import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { CARBON_POINT_VALUE_PHP } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/UI';
import { Award, ArrowDownUp, Loader as Loader2, Leaf } from 'lucide-react';

export default function Carbon() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    if (profile?.user_id) loadRecords();
  }, [profile]);

  async function loadRecords() {
    const { data } = await supabase
      .from('carbon_records')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('created_at', { ascending: false });
    if (data) setRecords(data);
    setLoading(false);
  }

  async function handleExchange() {
    const pts = parseInt(exchangeAmount);
    if (!pts || pts <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (pts > (profile?.carbon_points || 0)) {
      showToast('Insufficient carbon points', 'error');
      return;
    }
    setExchanging(true);
    try {
      const { data, error } = await supabase.rpc('exchange_carbon_points', {
        p_points: pts,
      });

      if (error) throw error;

      if (data && data.error) {
        showToast(data.error, 'error');
        setExchanging(false);
        return;
      }

      await refreshProfile();
      showToast(`Exchanged ${pts} points for ₱${(pts * CARBON_POINT_VALUE_PHP).toFixed(2)}`, 'success');
      setExchangeAmount('');
      loadRecords();
    } catch {
      showToast('Exchange failed', 'error');
    }
    setExchanging(false);
  }

  return (
    <AppLayout>
      <PageHeader title="Carbon Exchange" backPath="/home" />
      <div className="px-4 py-4">
        <div className="card mb-4 bg-gradient-to-br from-[#16a35a] to-[#0f7142] text-white">
          <div className="flex items-center gap-3 mb-2">
            <Leaf size={24} />
            <div>
              <p className="text-xs text-white/70">MY CARBON POINTS</p>
              <p className="text-2xl font-bold">{Math.floor(profile?.carbon_points || 0)}</p>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-[#323643] mb-3 flex items-center gap-2">
            <ArrowDownUp size={16} className="text-[#16a35a]" /> Exchange Points
          </h3>
          <p className="text-xs text-[#9babc6] mb-2">1 Carbon Point = ₱{CARBON_POINT_VALUE_PHP.toFixed(2)}</p>
          <input
            type="number"
            className="input-field mb-3"
            placeholder="Enter points to exchange"
            value={exchangeAmount}
            onChange={(e) => setExchangeAmount(e.target.value)}
          />
          <button onClick={handleExchange} disabled={exchanging} className="btn-primary w-full flex items-center justify-center gap-2">
            {exchanging && <Loader2 size={18} className="animate-spin" />}
            {exchanging ? 'Exchanging...' : 'EXCHANGE NOW'}
          </button>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-[#323643] mb-3">CARBON POINTS HISTORY</h3>
          {loading ? (
            <div className="flex justify-center py-4">Loading...</div>
          ) : records.length === 0 ? (
            <EmptyState icon={Award} title="No exchange records" />
          ) : (
            <div className="space-y-2">
              {records.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-[#f0f3f8] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#323643]">{r.description}</p>
                    <p className="text-[10px] text-[#9babc6]">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className={`text-sm font-semibold ${Number(r.points) >= 0 ? 'text-[#16a35a]' : 'text-[#ef4444]'}`}>
                    {Number(r.points) >= 0 ? '+' : ''}{r.points} pts
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
