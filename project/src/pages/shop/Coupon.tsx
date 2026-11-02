import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/UI';
import { Ticket } from 'lucide-react';

export default function Coupon() {
  const { profile } = useAuth();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) loadCoupons();
  }, [profile]);

  async function loadCoupons() {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('created_at', { ascending: false });
    if (data) {
      setCoupons([...data].sort((a, b) => (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1)));
    }
    setLoading(false);
  }

  return (
    <AppLayout>
      <PageHeader title="My Coupon" backPath="/profile" />
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-8">Loading...</div>
        ) : coupons.length === 0 ? (
          <EmptyState icon={Ticket} title="No coupons yet" />
        ) : (
          <div className="space-y-3">
            {coupons.map((c) => (
              <div key={c.id} className="card relative overflow-hidden bg-gradient-to-r from-[#ef9100] to-[#cc7e00] text-white">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-8 -mt-8" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-6 -mb-6" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket size={18} />
                    <h3 className="text-sm font-bold">{c.name}</h3>
                  </div>
                  <p className="text-2xl font-bold">₱{formatCurrency(c.value)}</p>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-white/70">
                      {c.expiry_date ? `Expires: ${formatDate(c.expiry_date)}` : 'No expiry'}
                    </span>
                    <span className={`status-badge ${c.status === 'active' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
