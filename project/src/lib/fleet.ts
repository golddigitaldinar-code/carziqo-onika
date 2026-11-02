export type LatLng = [number, number];

export interface CarRoute {
  points: LatLng[];
  cumulative: number[];
  total: number;
}

const EARTH_RADIUS_M = 6371000;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearingDegrees(a: LatLng, b: LatLng): number {
  const dLng = toRad(b[1] - a[1]);
  const y = Math.sin(dLng) * Math.cos(toRad(b[0]));
  const x =
    Math.cos(toRad(a[0])) * Math.sin(toRad(b[0])) -
    Math.sin(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function randomPointNear(origin: LatLng, minMeters: number, maxMeters: number): LatLng {
  const angle = Math.random() * 2 * Math.PI;
  const distance = minMeters + Math.random() * (maxMeters - minMeters);
  const dLat = (distance * Math.cos(angle)) / EARTH_RADIUS_M;
  const dLng = (distance * Math.sin(angle)) / (EARTH_RADIUS_M * Math.cos(toRad(origin[0])));
  return [origin[0] + toDeg(dLat), origin[1] + toDeg(dLng)];
}

export function buildRoute(points: LatLng[]): CarRoute {
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + distanceMeters(points[i - 1], points[i]));
  }
  return { points, cumulative, total: cumulative[cumulative.length - 1] };
}

export async function fetchDrivingRoute(from: LatLng, to: LatLng, signal: AbortSignal): Promise<CarRoute> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Routing failed (${response.status})`);
  const json = await response.json();
  const coords: [number, number][] | undefined = json?.routes?.[0]?.geometry?.coordinates;
  if (json?.code !== 'Ok' || !Array.isArray(coords) || coords.length < 2) {
    throw new Error('No driving route found');
  }
  return buildRoute(coords.map(([lng, lat]) => [lat, lng]));
}

export function positionOnRoute(route: CarRoute, distance: number): { position: LatLng; heading: number } {
  const d = Math.min(Math.max(distance, 0), route.total);
  let i = 1;
  while (i < route.cumulative.length - 1 && route.cumulative[i] < d) i++;
  const segmentStart = route.cumulative[i - 1];
  const segmentLength = route.cumulative[i] - segmentStart;
  const t = segmentLength > 0 ? (d - segmentStart) / segmentLength : 0;
  const a = route.points[i - 1];
  const b = route.points[i];
  return {
    position: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    heading: bearingDegrees(a, b),
  };
}
