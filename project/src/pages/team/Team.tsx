import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/UI';
import { Users, UserPlus, Share2, Award, TrendingUp } from 'lucide-react';

interface TeamMember {
  id: string;
  member_name: string;
  member_phone: string;
  vip_level: number;
  total_investment: number;
  commission: number;
  status: string;
  joined_at: string;
}

export default function Team() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) loadMembers();
  }, [profile]);

  async function loadMembers() {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('joined_at', { ascending: false });
    if (data) setMembers(data as TeamMember[]);
    setLoading(false);
  }

  const totalCommission = members.reduce((s, m) => s + Number(m.commission), 0);
  const totalInvestment = members.reduce((s, m) => s + Number(m.total_investment), 0);
  const activeCount = members.filter((m) => m.status === 'active').length;

  return (
    <AppLayout>
      <PageHeader title="Team Members" backPath="/profile" rightAction={
        <button onClick={() => navigate('/referral')} className="w-9 h-9 rounded-full bg-[#e6f7ee] flex items-center justify-center">
          <Share2 size={18} className="text-[#16a35a]" />
        </button>
      } />
      <div className="px-4 py-4">
        <div className="card mb-4 bg-gradient-to-br from-[#0f1729] to-[#1a1f2e] text-white">
          <p className="text-xs text-white/50 mb-1">Team Total Profit</p>
          <p className="text-3xl font-bold">₱ {formatCurrency(totalCommission)}</p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <p className="text-[10px] text-white/50">Team Size</p>
              <p className="text-sm font-semibold">{members.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/50">Active</p>
              <p className="text-sm font-semibold">{activeCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/50">Total Invest</p>
              <p className="text-sm font-semibold">₱{formatCurrency(totalInvestment)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={() => navigate('/referral')} className="card flex items-center gap-2">
            <UserPlus size={20} className="text-[#16a35a]" />
            <span className="text-sm font-medium text-[#323643]">Invite more</span>
          </button>
          <button onClick={() => navigate('/performance')} className="card flex items-center gap-2">
            <Award size={20} className="text-[#ef9100]" />
            <span className="text-sm font-medium text-[#323643]">Performance</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">Loading...</div>
        ) : members.length === 0 ? (
          <EmptyState icon={Users} title="No team members yet" subtitle="Invite friends to build your team" />
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(`/team-detail?id=${m.id}`)}
                className="card w-full text-left flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#16a35a] to-[#0f7142] flex items-center justify-center text-white font-bold">
                  {m.member_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#323643]">{m.member_name || 'Unknown'}</p>
                  <p className="text-xs text-[#9babc6]">VIP {m.vip_level} • ₱{formatCurrency(m.total_investment)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#16a35a]">₱{formatCurrency(m.commission)}</p>
                  <p className="text-[10px] text-[#9babc6]">commission</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
