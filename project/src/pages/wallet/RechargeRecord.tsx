import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/UI';
import { FileText } from 'lucide-react';

export default function RechargeRecord() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) loadRecords();
  }, [profile]);

  async function loadRecords() {
    const { data } = await supabase
      .from('recharge_requests')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('created_at', { ascending: false });
    if (data) setRecords(data);
    setLoading(false);
  }

  return (
    <AppLayout>
      <PageHeader title="Recharge Record" backPath="/wallet" />
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-8">Loading...</div>
        ) : records.length === 0 ? (
          <EmptyState icon={FileText} title="No recharge records yet" />
        ) : (
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-[#323643]">₱{formatCurrency(r.amount)}</p>
                    <p className="text-[10px] text-[#9babc6]">{formatDate(r.created_at)}</p>
                  </div>
                  <span className={`status-badge ${r.status === 'approved' ? 'status-active' : r.status === 'pending' ? 'status-pending' : 'status-rejected'}`}>
                    {r.status === 'approved' ? 'Approved' : r.status === 'pending' ? 'Pending Approval' : 'Rejected'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#9babc6] flex-wrap">
                  <span>Method: {r.method}</span>
                  {r.reference && <span>• Ref: {r.reference}</span>}
                </div>
                {r.transaction_hash && (
                  <div className="mt-2 bg-[#f0f3f8] rounded-lg p-2">
                    <p className="text-[9px] text-[#9babc6] mb-0.5">Transaction Hash</p>
                    <p className="text-[10px] font-mono text-[#323643] break-all">{r.transaction_hash}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
