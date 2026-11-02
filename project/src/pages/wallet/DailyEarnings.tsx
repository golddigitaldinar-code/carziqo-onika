import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState, SectionCard } from '@/components/UI';
import { TrendingUp, Calendar } from 'lucide-react';

export default function DailyEarnings() {
  const { profile, refreshProfile } = useAuth();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalToday, setTotalToday] = useState(0);
  const [totalAll, setTotalAll] = useState(0);

  useEffect(() => {
    if (profile?.user_id) {
      generateAndLoadEarnings();
    }
  }, [profile]);

  async function generateAndLoadEarnings() {
    try {
      const { data, error } = await supabase.rpc('claim_daily_earnings');
      if (error) throw error;
      if (data && data.success && !data.already_claimed && !data.no_earnings) {
        await refreshProfile();
      }
    } catch (err) {
      console.error('Failed to generate earnings:', err);
    }

    await loadEarnings();
  }

  async function loadEarnings() {
    const { data } = await supabase
      .from('daily_earnings')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('date', { ascending: false });
    if (data) {
      setEarnings(data);
      const today = new Date().toISOString().split('T')[0];
      const todayTotal = data.filter((e) => new Date(e.date).toISOString().split('T')[0] === today).reduce((s, e) => s + Number(e.amount), 0);
      setTotalToday(todayTotal);
      setTotalAll(data.reduce((s, e) => s + Number(e.amount), 0));
    }
    setLoading(false);
  }

  const groupedByDate: Record<string, any[]> = {};
  earnings.forEach((e) => {
    const dateKey = formatDate(e.date);
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(e);
  });

  return (
    <AppLayout>
      <PageHeader title="Daily Earnings" backPath="/wallet" />
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card bg-gradient-to-br from-[#16a35a] to-[#0f7142] text-white">
            <Calendar size={18} className="mb-1" />
            <p className="text-[10px] text-white/70">Today's Earnings</p>
            <p className="text-xl font-bold">₱{formatCurrency(totalToday)}</p>
          </div>
          <div className="card bg-gradient-to-br from-[#ef9100] to-[#cc7e00] text-white">
            <TrendingUp size={18} className="mb-1" />
            <p className="text-[10px] text-white/70">Earned to date</p>
            <p className="text-xl font-bold">₱{formatCurrency(totalAll)}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">Loading...</div>
        ) : earnings.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No earnings yet" subtitle="Rent vehicles to start earning" />
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedByDate).map(([date, items]) => {
              const dayTotal = items.reduce((s, e) => s + Number(e.amount), 0);
              return (
                <SectionCard key={date} title={date}>
                  <div className="space-y-2">
                    {items.map((e) => (
                      <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-[#f0f3f8] last:border-0">
                        <div>
                          <p className="text-sm font-medium text-[#323643]">{e.vehicle_name}</p>
                          <p className="text-[10px] text-[#9babc6]">Daily income</p>
                        </div>
                        <p className="text-sm font-semibold text-[#16a35a]">+₱{formatCurrency(e.amount)}</p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs font-medium text-[#9babc6]">Daily Returns</p>
                      <p className="text-sm font-bold text-[#16a35a]">₱{formatCurrency(dayTotal)}</p>
                    </div>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
