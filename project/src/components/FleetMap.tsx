import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchDrivingRoute, positionOnRoute, randomPointNear, type CarRoute, type LatLng } from '@/lib/fleet';

export type CarStatus = 'routing' | 'driving' | 'parked' | 'error';

export interface FleetCar {
  id: string;
  name: string;
}

export interface FleetCarState {
  status: CarStatus;
  speedKmh: number;
}

interface CarSim {
  position: LatLng;
  heading: number;
  route: CarRoute | null;
  distance: number;
  speed: number;
  cruiseSpeed: number;
  dwellUntil: number;
  retryAt: number;
  status: CarStatus;
  controller: AbortController | null;
  marker: L.Marker;
}

const BASE_CENTER: LatLng = [34.0522, -118.2437];
const CRUISE_MIN_MPS = 4;
const CRUISE_MAX_MPS = 6.5;
const ACCELERATION_MPS2 = 0.35;
const BRAKING_MPS2 = 0.7;
const CRAWL_MPS = 1.2;
const SLOW_ZONE_M = 40;
const DWELL_MIN_MS = 20_000;
const DWELL_MAX_MS = 60_000;
const TRIP_MIN_M = 400;
const TRIP_MAX_M = 1800;
const RETRY_MS = 15_000;

function carIcon(status: CarStatus): L.DivIcon {
  const color = status === 'driving' ? '#16a35a' : status === 'error' ? '#ef4444' : '#ef9100';
  return L.divIcon({
    className: 'fleet-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `<div class="fleet-car" style="width:40px;height:40px;transition:transform 0.4s linear"><div style="width:40px;height:40px;border-radius:9999px;background:${color};border:3px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/></svg></div></div>`,
  });
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function setStatus(sim: CarSim, status: CarStatus) {
  if (sim.status === status) return;
  sim.status = status;
  sim.marker.setIcon(carIcon(status));
}

function applyHeading(sim: CarSim) {
  const el = sim.marker.getElement()?.querySelector<HTMLElement>('.fleet-car');
  if (el) el.style.transform = `rotate(${sim.heading}deg)`;
}

function startTrip(sim: CarSim) {
  sim.controller?.abort();
  const controller = new AbortController();
  sim.controller = controller;
  setStatus(sim, 'routing');

  const destination = randomPointNear(sim.position, TRIP_MIN_M, TRIP_MAX_M);
  fetchDrivingRoute(sim.position, destination, controller.signal)
    .then((route) => {
      if (controller.signal.aborted) return;
      sim.route = route;
      sim.position = route.points[0];
      sim.distance = 0;
      sim.speed = 0;
      sim.cruiseSpeed = randomBetween(CRUISE_MIN_MPS, CRUISE_MAX_MPS);
      setStatus(sim, 'driving');
    })
    .catch(() => {
      if (controller.signal.aborted) return;
      sim.route = null;
      sim.retryAt = performance.now() + RETRY_MS;
      setStatus(sim, 'error');
    });
}

function arrive(sim: CarSim, now: number) {
  sim.route = null;
  sim.speed = 0;
  sim.controller = null;
  sim.dwellUntil = now + randomBetween(DWELL_MIN_MS, DWELL_MAX_MS);
  setStatus(sim, 'parked');
}

function moveCar(sim: CarSim, dt: number, now: number) {
  const route = sim.route;
  if (!route) return;
  const remaining = route.total - sim.distance;
  const target = remaining < SLOW_ZONE_M ? CRAWL_MPS : sim.cruiseSpeed;
  const rate = target > sim.speed ? ACCELERATION_MPS2 : BRAKING_MPS2;
  const delta = target - sim.speed;
  sim.speed = Math.max(0, sim.speed + Math.max(-rate * dt, Math.min(rate * dt, delta)));
  sim.distance = Math.min(route.total, sim.distance + sim.speed * dt);

  const { position, heading } = positionOnRoute(route, sim.distance);
  sim.position = position;
  sim.heading = heading;

  if (sim.distance >= route.total) arrive(sim, now);
}

function stepCar(sim: CarSim, dt: number, now: number) {
  if (sim.status === 'parked' && now >= sim.dwellUntil) startTrip(sim);
  if (sim.status === 'error' && now >= sim.retryAt) startTrip(sim);
  if (sim.status === 'driving') moveCar(sim, dt, now);
}

interface FleetMapProps {
  cars: FleetCar[];
  onStatusChange: (states: Record<string, FleetCarState>) => void;
}

export default function FleetMap({ cars, onStatusChange }: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const simsRef = useRef(new Map<string, CarSim>());
  const onStatusRef = useRef(onStatusChange);
  onStatusRef.current = onStatusChange;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false }).setView(BASE_CENTER, 14);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    mapRef.current = map;

    const sims = simsRef.current;
    return () => {
      sims.forEach((sim) => sim.controller?.abort());
      sims.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const sims = simsRef.current;
    const ids = new Set(cars.map((car) => car.id));

    sims.forEach((sim, id) => {
      if (ids.has(id)) return;
      sim.controller?.abort();
      sim.marker.remove();
      sims.delete(id);
    });

    cars.forEach((car) => {
      if (sims.has(car.id)) return;
      const position = randomPointNear(BASE_CENTER, 300, 3000);
      const marker = L.marker(position, { icon: carIcon('parked'), title: car.name }).addTo(map);
      sims.set(car.id, {
        position,
        heading: 0,
        route: null,
        distance: 0,
        speed: 0,
        cruiseSpeed: CRUISE_MIN_MPS,
        dwellUntil: performance.now() + Math.random() * 5000,
        retryAt: 0,
        status: 'parked',
        controller: null,
        marker,
      });
    });

    if (sims.size > 0) {
      const bounds = L.latLngBounds(Array.from(sims.values(), (sim) => sim.position));
      map.fitBounds(bounds.pad(0.3), { maxZoom: 15 });
    }
  }, [cars]);

  useEffect(() => {
    let frameId = 0;
    let last = performance.now();
    let lastReport = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const report: Record<string, FleetCarState> = {};

      simsRef.current.forEach((sim, id) => {
        stepCar(sim, dt, now);
        if (sim.status === 'driving') {
          sim.marker.setLatLng(sim.position);
          applyHeading(sim);
        }
        report[id] = { status: sim.status, speedKmh: Math.round(sim.speed * 3.6) };
      });

      if (now - lastReport >= 1000) {
        lastReport = now;
        onStatusRef.current(report);
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
