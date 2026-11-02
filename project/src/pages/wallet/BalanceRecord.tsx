import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/UI';
import { CircleArrowDown as ArrowDownCircle, CircleArrowUp as ArrowUpCircle, FileText } from 'lucide-react';

export default function BalanceRecord() {
  const { profile } = useAuth();
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) loadTxs();
  }, [profile]);

  async function loadTxs() {
    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('created_at', { ascending: false });
    if (data) setTxs(data);
    setLoading(false);
  }

  return (
    <AppLayout>
      <PageHeader title="Balance Record" backPath="/wallet" />
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-8">Loading...</div>
        ) : txs.length === 0 ? (
          <EmptyState icon={FileText} title="No transactions yet" />
        ) : (
          <div className="space-y-2">
            {txs.map((tx) => (
              <div key={tx.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${Number(tx.amount) >= 0 ? 'bg-[#e6f7ee]' : 'bg-[#fef2f2]'}`}>
                    {Number(tx.amount) >= 0 ? <ArrowDownCircle size={20} className="text-[#16a35a]" /> : <ArrowUpCircle size={20} className="text-[#ef4444]" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#323643]">{tx.description || tx.type}</p>
                    <p className="text-[10px] text-[#9babc6]">{formatDateTime(tx.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${Number(tx.amount) >= 0 ? 'text-[#16a35a]' : 'text-[#ef4444]'}`}>
                    {Number(tx.amount) >= 0 ? '+' : ''}₱{formatCurrency(tx.amount)}
                  </p>
                  <span className={`status-badge ${tx.status === 'completed' ? 'status-completed' : tx.status === 'pending' ? 'status-pending' : 'status-rejected'}`}>
                    {tx.status}
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
