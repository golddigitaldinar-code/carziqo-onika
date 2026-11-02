import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { ArrowLeft, Phone, Award, TrendingUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TeamDetail() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadMember();
  }, [id]);

  async function loadMember() {
    const { data } = await supabase.from('team_members').select('*').eq('id', id).maybeSingle();
    if (data) setMember(data);
    setLoading(false);
  }

  if (loading) return <AppLayout><PageHeader title="Team detail" backPath="/team" /><div className="flex justify-center py-8">Loading...</div></AppLayout>;

  if (!member) return <AppLayout><PageHeader title="Team detail" backPath="/team" /><div className="text-center py-12 text-sm text-[#9babc6]">Member not found</div></AppLayout>;

  return (
    <AppLayout>
      <PageHeader title="Team detail" backPath="/team" />
      <div className="px-4 py-4">
        <div className="card flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#16a35a] to-[#0f7142] flex items-center justify-center text-white text-2xl font-bold">
            {member.member_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#323643]">{member.member_name || 'Unknown'}</h2>
            <p className="text-sm text-[#9babc6] flex items-center gap-1">
              <Phone size={14} /> {member.member_phone || 'N/A'}
            </p>
            <span className="status-badge status-active mt-1 inline-flex">Active</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card text-center">
            <TrendingUp size={20} className="text-[#16a35a] mx-auto mb-1" />
            <p className="text-[10px] text-[#9babc6]">Total Investment</p>
            <p className="text-lg font-bold text-[#323643]">₱{formatCurrency(member.total_investment)}</p>
          </div>
          <div className="card text-center">
            <Award size={20} className="text-[#ef9100] mx-auto mb-1" />
            <p className="text-[10px] text-[#9babc6]">Commission</p>
            <p className="text-lg font-bold text-[#16a35a]">₱{formatCurrency(member.commission)}</p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between py-2 border-b border-[#f0f3f8]">
            <span className="text-sm text-[#9babc6] flex items-center gap-2"><Award size={16} /> VIP Level</span>
            <span className="text-sm font-medium text-[#323643]">Level {member.vip_level}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#f0f3f8]">
            <span className="text-sm text-[#9babc6] flex items-center gap-2"><Calendar size={16} /> Joined</span>
            <span className="text-sm font-medium text-[#323643]">{formatDate(member.joined_at)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[#9babc6]">Status</span>
            <span className="status-badge status-active">Active</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
