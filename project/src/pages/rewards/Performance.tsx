import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/UI';
import { Award, Users, TrendingUp } from 'lucide-react';

export default function Performance() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamCount, setTeamCount] = useState(0);

  useEffect(() => {
    if (profile?.user_id) loadData();
  }, [profile]);

  async function loadData() {
    const { data } = await supabase
      .from('performance_records')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('created_at', { ascending: false });
    if (data) setRecords(data);

    const { count } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile!.user_id);
    setTeamCount(count || 0);
    setLoading(false);
  }

  const totalReward = records.reduce((s, r) => s + Number(r.weekly_reward), 0);
  const avgCoefficient = records.length > 0
    ? records.reduce((s, r) => s + Number(r.base_coefficient), 0) / records.length
    : 1.0;

  return (
    <AppLayout>
      <PageHeader title="Performance Reward" backPath="/home" />
      <div className="px-4 py-4">
        <div className="card mb-4 bg-gradient-to-br from-[#0f1729] to-[#1a1f2e] text-white">
          <p className="text-xs text-white/50">ESTIMATED WEEKLY REWARD</p>
          <p className="text-3xl font-bold">₱{formatCurrency(totalReward)}</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-white/50">Base Coefficient</p>
              <p className="text-lg font-bold">{avgCoefficient.toFixed(2)}x</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-white/50">Team Size</p>
              <p className="text-lg font-bold">{teamCount}</p>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-[#323643] mb-3">Weekly Base Performance Reward Details</h3>
          <div className="space-y-2 text-xs text-[#9babc6]">
            <p>• Base coefficient increases with team growth</p>
            <p>• Team size affects weekly reward calculation</p>
            <p>• Rewards are credited every Monday</p>
            <p>• Commission on team member earnings included</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">Loading...</div>
        ) : records.length === 0 ? (
          <EmptyState icon={Award} title="No performance records yet" subtitle="Build your team to earn weekly rewards" />
        ) : (
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#9babc6]">{new Date(r.created_at).toLocaleDateString()}</span>
                  <span className="text-sm font-bold text-[#16a35a]">₱{formatCurrency(r.weekly_reward)}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-[#9babc6]">
                    <TrendingUp size={14} /> {Number(r.base_coefficient).toFixed(2)}x
                  </span>
                  <span className="flex items-center gap-1 text-[#9babc6]">
                    <Users size={14} /> {r.team_size} members
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
