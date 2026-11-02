import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { watchTable } from '@/lib/realtime';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Car, TrendingUp, Clock, Package, CircleCheck as CheckCircle, Loader as Loader2, CircleAlert as AlertCircle, Gift, Calendar } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  description: string;
  price: number;
  daily_return: number;
  image_url: string;
  stock: number;
  status: string;
  category: string;
  settlement_cycle: number;
  rental_limit: number;
  is_free_vehicle: boolean;
}

export default function CarDetail() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [renting, setRenting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const periods = [30, 60];
  const dailyRates: Record<number, number> = { 30: 0.02, 60: 0.03 };

  useEffect(() => {
    if (!id) return;
    loadVehicle();
    return watchTable('car-detail', { table: 'vehicles', filter: `id=eq.${id}` }, loadVehicle);
  }, [id]);

  async function loadVehicle() {
    const { data } = await supabase.from('vehicles').select('*').eq('id', id).maybeSingle();
    if (data) setVehicle(data as Vehicle);
    setLoading(false);
  }

  async function handleRent() {
    if (!vehicle || !profile) return;
    if (vehicle.stock <= 0) {
      showToast('This vehicle is out of stock', 'error');
      return;
    }
    if (!agreed) {
      showToast('Please accept the Car Rental Agreement', 'error');
      return;
    }

    if (vehicle.is_free_vehicle) {
      if (profile.free_vehicle_used) {
        showToast('You have already claimed your free trial vehicle', 'error');
        return;
      }
    } else {
      if (vehicle.price < 500) {
        showToast('Minimum vehicle rental is ₱500', 'error');
        return;
      }
      if (vehicle.price > 100000) {
        showToast('Maximum vehicle rental is ₱100,000', 'error');
        return;
      }
      if ((profile.wallet_balance || 0) < vehicle.price) {
        showToast('Insufficient Wallet Balance', 'error');
        return;
      }
    }

    setRenting(true);
    try {
      const rentalDays = vehicle.is_free_vehicle ? vehicle.settlement_cycle : selectedPeriod;
      const { data, error } = await supabase.rpc('rent_vehicle', {
        p_vehicle_id: vehicle.id,
        p_rental_days: rentalDays,
      });

      if (error) throw error;

      if (data && data.error) {
        showToast(data.error, 'error');
        setRenting(false);
        return;
      }

      await refreshProfile();
      showToast(vehicle.is_free_vehicle ? 'Free trial vehicle activated!' : 'Vehicle rented successfully', 'success');
      navigate('/my-cars');
    } catch {
      showToast('Failed to rent vehicle', 'error');
    }
    setRenting(false);
  }

  if (loading) return <AppLayout><PageHeader title="Car Detail" /><LoadingSpinner /></AppLayout>;

  if (!vehicle) {
    return (
      <AppLayout>
        <PageHeader title="Car Detail" />
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <AlertCircle size={48} className="text-[#9babc6] mb-3" />
          <p className="text-sm text-[#9babc6]">Vehicle not found</p>
          <button onClick={() => navigate('/car-market')} className="btn-primary mt-4 max-w-xs">
            Back to Market
          </button>
        </div>
      </AppLayout>
    );
  }

  const totalReturn = vehicle.daily_return * vehicle.settlement_cycle;
  const isFree = vehicle.is_free_vehicle;
  const freeAlreadyUsed = profile?.free_vehicle_used === true;
  const canRent = isFree ? !freeAlreadyUsed : (profile?.wallet_balance || 0) >= vehicle.price;

  const price = vehicle.price;

  function dailyRateFor(days: number): number {
    return dailyRates[days] ?? 0;
  }

  function dailyForPeriod(days: number): number {
    return price * dailyRateFor(days);
  }

  const selectedPercent = Math.round(dailyRateFor(selectedPeriod) * 100);
  const selectedDaily = dailyForPeriod(selectedPeriod);
  const selectedReturn = selectedDaily * selectedPeriod;

  return (
    <AppLayout>
      <PageHeader title="Car Detail" />
      <div className="pb-4">
        <div className="w-full h-52 bg-[#f0f3f8] relative">
          {vehicle.image_url ? (
            <img src={vehicle.image_url} alt={vehicle.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car size={48} className="text-[#9babc6]" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full text-white bg-[#16a35a]">
              {vehicle.category.toUpperCase()}
            </span>
            {isFree && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white bg-[#ef9100] flex items-center gap-1">
                <Gift size={10} /> FREE TRIAL
              </span>
            )}
            {vehicle.stock > 0 ? (
              <span className="status-badge status-active bg-white/90">Available</span>
            ) : (
              <span className="status-badge status-closed bg-white/90">Out of stock</span>
            )}
          </div>
        </div>

        <div className="px-5 py-4">
          <h1 className="text-xl font-bold text-[#323643]">{vehicle.name}</h1>
          <p className="text-sm text-[#9babc6] mt-1">{vehicle.description}</p>

          {isFree && freeAlreadyUsed && (
            <div className="card mt-3 bg-[#fff8eb] border border-[#ef9100]/30 flex items-start gap-3">
              <AlertCircle size={20} className="text-[#ef9100] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-[#323643]">Free Trial Already Used</p>
                <p className="text-[11px] text-[#9babc6] mt-0.5">You have already claimed your free trial vehicle. Only one free trial per member.</p>
              </div>
            </div>
          )}

          {isFree ? (
            <>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="card !p-3 text-center">
                  <TrendingUp size={20} className="text-[#16a35a] mx-auto mb-1" />
                  <p className="text-[10px] text-[#9babc6]">Daily Return</p>
                  <p className="text-base font-bold text-[#16a35a]">₱{formatCurrency(vehicle.daily_return)}</p>
                </div>
                <div className="card !p-3 text-center">
                  <Package size={20} className="text-[#2979ff] mx-auto mb-1" />
                  <p className="text-[10px] text-[#9babc6]">Vehicle Price</p>
                  <p className="text-base font-bold text-[#323643]">FREE</p>
                </div>
                <div className="card !p-3 text-center">
                  <Clock size={20} className="text-[#ef9100] mx-auto mb-1" />
                  <p className="text-[10px] text-[#9babc6]">Trial Period</p>
                  <p className="text-base font-bold text-[#323643]">7 days</p>
                </div>
                <div className="card !p-3 text-center">
                  <CheckCircle size={20} className="text-[#16a35a] mx-auto mb-1" />
                  <p className="text-[10px] text-[#9babc6]">Total Return</p>
                  <p className="text-base font-bold text-[#16a35a]">₱{formatCurrency(totalReturn)}</p>
                </div>
              </div>

              <div className="card mt-3 bg-gradient-to-br from-[#e6f7ee] to-[#f0fdf4]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#9babc6]">Total Profit</p>
                    <p className="text-2xl font-bold text-[#16a35a]">₱{formatCurrency(totalReturn)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#9babc6]">Trial duration</p>
                    <p className="text-sm font-semibold text-[#323643]">7 days</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="card !p-3 text-center">
                  <Package size={20} className="text-[#2979ff] mx-auto mb-1" />
                  <p className="text-[10px] text-[#9babc6]">Vehicle Price</p>
                  <p className="text-base font-bold text-[#323643]">₱{formatCurrency(vehicle.price)}</p>
                </div>
                <div className="card !p-3 text-center">
                  <TrendingUp size={20} className="text-[#16a35a] mx-auto mb-1" />
                  <p className="text-[10px] text-[#9babc6]">Selected Return ({selectedPercent}% Daily)</p>
                  <p className="text-base font-bold text-[#16a35a]">₱{formatCurrency(selectedReturn)}</p>
                </div>
              </div>

              <div className="card mt-3">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-[#2979ff]" />
                  <h3 className="text-sm font-semibold text-[#323643]">Select Rental Period</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {periods.map((days) => {
                    const percent = Math.round(dailyRateFor(days) * 100);
                    const daily = dailyForPeriod(days);
                    const earned = daily * days;
                    const isSelected = selectedPeriod === days;
                    return (
                      <button
                        key={days}
                        onClick={() => setSelectedPeriod(days)}
                        className={`rounded-xl p-2.5 text-center transition-all border-2 ${isSelected ? 'bg-[#e6f7ee] border-[#16a35a]' : 'bg-white border-[#dfe5f0]'}`}
                      >
                        <p className={`text-sm font-bold ${isSelected ? 'text-[#16a35a]' : 'text-[#323643]'}`}>{days} days</p>
                        <p className="text-[10px] text-[#9babc6] mt-0.5">₱{formatCurrency(daily)}/day</p>
                        <p className="text-[9px] text-[#16a35a] mt-0.5">{percent}% daily return</p>
                        <p className="text-[9px] text-[#9babc6]">₱{formatCurrency(earned)} total</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#9babc6] mt-2">
                  30 days earn a 2% daily return and 60 days earn a 3% daily return on the vehicle price.
                </p>
              </div>

              <div className="card mt-3 bg-gradient-to-br from-[#e6f7ee] to-[#f0fdf4]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#9babc6]">Selected: {selectedPeriod} days ({selectedPercent}% daily)</p>
                    <p className="text-2xl font-bold text-[#16a35a]">₱{formatCurrency(selectedReturn)}</p>
                    <p className="text-[11px] text-[#9babc6] mt-0.5">Total return over {selectedPeriod} days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#9babc6]">Daily earning</p>
                    <p className="text-sm font-semibold text-[#323643]">₱{formatCurrency(selectedDaily)}/day</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="card mt-3">
            <h3 className="text-sm font-semibold text-[#323643] mb-2">How it works</h3>
            <div className="space-y-2 text-xs text-[#9babc6]">
              {isFree ? (
                <>
                  <p>1. Claim your free trial vehicle — no cost to your wallet</p>
                  <p>2. Earn ₱{formatCurrency(vehicle.daily_return)} daily for 7 days</p>
                  <p>3. After 7 days, the trial ends</p>
                  <p>4. Limit: one free trial vehicle per member</p>
                </>
              ) : (
                <>
                  <p>1. Choose your rental period (30 or 60 days)</p>
                  <p>2. 30 days = 2% daily return, 60 days = 3% daily return</p>
                  <p>3. Earnings are credited to your wallet daily</p>
                  <p>4. Rental limit: {vehicle.rental_limit} per member</p>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => setAgreed(!agreed)}
            className="flex items-center gap-2 text-sm text-[#9babc6] mt-4"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${agreed ? 'bg-[#16a35a] border-[#16a35a]' : 'border-[#dfe5f0]'}`}>
              {agreed && <CheckCircle size={12} className="text-white" />}
            </div>
            <span>Accept the Car Rental Agreement</span>
          </button>

          <button
            onClick={handleRent}
            disabled={renting || vehicle.stock <= 0 || (isFree && freeAlreadyUsed) || !canRent}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            {renting && <Loader2 size={18} className="animate-spin" />}
            {renting ? 'Processing...' : isFree ? (freeAlreadyUsed ? 'Trial Already Used' : 'Claim Free Trial') : vehicle.stock <= 0 ? 'Out of Stock' : 'Rent Now'}
          </button>

          <div className="text-center mt-3">
            <p className="text-xs text-[#9babc6]">
              {isFree ? 'Free — no wallet charge' : `Your Balance: ₱${formatCurrency(profile?.wallet_balance || 0)}`}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
