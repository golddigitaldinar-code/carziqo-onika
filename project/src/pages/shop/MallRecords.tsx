import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/UI';
import { ShoppingBag } from 'lucide-react';

export default function MallRecords() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) loadOrders();
  }, [profile]);

  async function loadOrders() {
    const { data } = await supabase
      .from('mall_orders')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }

  return (
    <AppLayout>
      <PageHeader title="Mall Orders" backPath="/mall" />
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-8">Loading...</div>
        ) : orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No orders yet" />
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={o.image_url || '/assets/images/carziqo.webp'}
                    alt={o.product_name}
                    className="w-14 h-14 rounded-xl bg-[#f0f3f8] object-contain flex-shrink-0"
                  />
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#323643]">{o.product_name}</h3>
                  <span className={`status-badge ${o.status === 'completed' ? 'status-completed' : 'status-pending'}`}>
                    {o.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[#9babc6]">
                  <span>Qty: {o.quantity}</span>
                  <span>{formatDate(o.created_at)}</span>
                  <span className="font-semibold text-[#16a35a]">₱{formatCurrency(o.total_price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
