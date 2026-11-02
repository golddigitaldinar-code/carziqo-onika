import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import { SectionCard } from '@/components/UI';
import { Wallet as WalletIcon, CircleArrowDown as ArrowDownCircle, CircleArrowUp as ArrowUpCircle, CreditCard, TrendingUp, FileText, ChevronRight, Car, MapPin } from 'lucide-react';

export default function Wallet() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [recentTx, setRecentTx] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.user_id) loadTransactions();
  }, [profile]);

  async function loadTransactions() {
    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setRecentTx(data);
  }

  const actions = [
    { icon: ArrowDownCircle, label: 'Recharge', to: '/wallet/recharge', color: '#16a35a' },
    { icon: ArrowUpCircle, label: 'Withdraw', to: '/wallet/withdraw', color: '#ef9100' },
    { icon: MapPin, label: 'Addresses', to: '/wallet/withdraw-addresses', color: '#2979ff' },
    { icon: CreditCard, label: 'Bank Card', to: '/wallet/bank-card', color: '#8850f0' },
    { icon: TrendingUp, label: 'Daily Earnings', to: '/wallet/daily', color: '#22c55e' },
  ];

  return (
    <AppLayout>
      <div className="gradient-hero px-5 pt-12 pb-8">
        <h1 className="text-lg font-bold text-white mb-1">Wallet</h1>
        <p className="text-xs text-white/50 mb-4">Your Wallet Balance</p>
        <p className="text-4xl font-bold text-white tracking-tight">
          ₱ {formatCurrency(profile?.wallet_balance || 0)}
        </p>
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="text-[10px] text-white/50">Total Earned</p>
            <p className="text-sm font-semibold text-white">₱ {formatCurrency(profile?.total_earnings || 0)}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="text-[10px] text-white/50">Carbon Points</p>
            <p className="text-sm font-semibold text-[#ef9100]">{Math.floor(profile?.carbon_points || 0)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <SectionCard>
          <div className="grid grid-cols-4 gap-2">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.to)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-active:scale-90"
                  style={{ backgroundColor: `${a.color}15` }}
                >
                  <a.icon size={22} style={{ color: a.color }} />
                </div>
                <span className="text-[10px] text-[#9babc6] font-medium text-center leading-tight">
                  {a.label}
                </span>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Transaction History"
          action={<button onClick={() => navigate('/wallet/balance-record')} className="text-xs text-[#16a35a] font-medium flex items-center gap-0.5">View all <ChevronRight size={14} /></button>}
        >
          {recentTx.length === 0 ? (
            <div className="flex flex-col items-center py-6">
              <FileText size={28} className="text-[#9babc6] mb-2" />
              <p className="text-xs text-[#9babc6]">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#f0f3f8] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${Number(tx.amount) >= 0 ? 'bg-[#e6f7ee]' : 'bg-[#fef2f2]'}`}>
                      {Number(tx.amount) >= 0 ? <ArrowDownCircle size={18} className="text-[#16a35a]" /> : <ArrowUpCircle size={18} className="text-[#ef4444]" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#323643]">{tx.description || tx.type}</p>
                      <p className="text-[10px] text-[#9babc6]">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${Number(tx.amount) >= 0 ? 'text-[#16a35a]' : 'text-[#ef4444]'}`}>
                    {Number(tx.amount) >= 0 ? '+' : ''}₱{formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="pb-4" />
      </div>
    </AppLayout>
  );
}
