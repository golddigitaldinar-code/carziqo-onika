import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EmptyState, StatusBadge } from '@/components/UI';
import { Car } from 'lucide-react';

interface Rental {
  id: string;
  vehicle_name: string;
  rental_period: number;
  daily_income: number;
  total_income: number;
  status: string;
  created_at: string;
}

export default function MyCars() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) loadRentals();
  }, [profile]);

  async function loadRentals() {
    const { data } = await supabase
      .from('rentals')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('created_at', { ascending: false });
    if (data) setRentals(data as Rental[]);
    setLoading(false);
  }

  const activeCount = rentals.filter((r) => r.status === 'active').length;
  const totalDaily = rentals.filter((r) => r.status === 'active').reduce((s, r) => s + Number(r.daily_income), 0);

  return (
    <AppLayout>
      <PageHeader title="My Vehicles" rightAction={
        <button onClick={() => navigate('/live-fleet')} className="text-xs text-[#16a35a] font-medium">
          Live Map
        </button>
      } />
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="card !p-3 text-center">
            <p className="text-2xl font-bold text-[#16a35a]">{rentals.length}</p>
            <p className="text-[10px] text-[#9babc6]">Total</p>
          </div>
          <div className="card !p-3 text-center">
            <p className="text-2xl font-bold text-[#2979ff]">{activeCount}</p>
            <p className="text-[10px] text-[#9babc6]">Active</p>
          </div>
          <div className="card !p-3 text-center">
            <p className="text-2xl font-bold text-[#ef9100]">₱{formatCurrency(totalDaily)}</p>
            <p className="text-[10px] text-[#9babc6]">Daily Income</p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading vehicles..." />
        ) : rentals.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No vehicles yet"
            subtitle="Browse the market to start earning"
          />
        ) : (
          <div className="space-y-3">
            {rentals.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#323643]">{r.vehicle_name}</h3>
                    <p className="text-xs text-[#9babc6]">Rented on {formatDate(r.created_at)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div>
                    <p className="text-[10px] text-[#9babc6]">Daily Income</p>
                    <p className="text-sm font-semibold text-[#16a35a]">₱{formatCurrency(r.daily_income)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9babc6]">Period</p>
                    <p className="text-sm font-semibold text-[#323643]">{r.rental_period} days</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9babc6]">Total</p>
                    <p className="text-sm font-semibold text-[#323643]">₱{formatCurrency(r.total_income)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {rentals.length === 0 && (
          <button onClick={() => navigate('/car-market')} className="btn-primary w-full mt-4">
            Go to Car Market
          </button>
        )}
      </div>
    </AppLayout>
  );
}
