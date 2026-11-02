import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { CARBON_POINT_VALUE_PHP, formatCurrency } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/UI';
import { ShoppingBag, Loader as Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category: string;
}

function carbonCost(price: number): number {
  return Math.round(price / CARBON_POINT_VALUE_PHP);
}

export default function Mall() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    const { data } = await supabase.from('mall_products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data as Product[]);
    setLoading(false);
  }

  async function handleBuy(product: Product) {
    if (product.stock <= 0) {
      showToast('Out of stock', 'error');
      return;
    }
    if ((profile?.carbon_points || 0) < carbonCost(product.price)) {
      showToast('Insufficient carbon points', 'error');
      return;
    }
    setBuying(product.id);
    try {
      const { data, error } = await supabase.rpc('purchase_mall_product', {
        p_product_id: product.id,
        p_quantity: 1,
      });

      if (error) throw error;

      if (data && data.error) {
        showToast(data.error, 'error');
        setBuying(null);
        return;
      }

      await refreshProfile();
      showToast('Order placed successfully', 'success');
      loadProducts();
      navigate('/mall-records');
    } catch {
      showToast('Failed to place order', 'error');
    }
    setBuying(null);
  }

  return (
    <AppLayout>
      <PageHeader title="Mall" backPath="/home" rightAction={
        <button onClick={() => navigate('/mall-records')} className="text-xs text-[#16a35a] font-medium">
          Orders
        </button>
      } />
      <div className="px-4 py-3">
        <div className="card mb-3 bg-gradient-to-br from-[#16a35a] to-[#0f7142] text-white">
          <p className="text-xs text-white/70">Your Carbon Points</p>
          <p className="text-lg font-bold">{Math.floor(profile?.carbon_points || 0).toLocaleString('en-PH')} pts</p>
          <p className="text-[10px] text-white/60 mt-1">Products are paid with carbon points (1 pt = ₱{CARBON_POINT_VALUE_PHP.toFixed(2)})</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="text-[#16a35a] animate-spin" /></div>
        ) : products.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No products found" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <div key={p.id} className="card">
                <div className="w-full h-32 rounded-xl overflow-hidden bg-[#f0f3f8] mb-2">
                  <img
                    src={p.image_url || '/assets/images/carziqo.webp'}
                    alt={p.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-sm font-semibold text-[#323643] line-clamp-1">{p.name}</h3>
                <p className="text-xs text-[#9babc6] line-clamp-2 mb-2">{p.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-[#16a35a]">{carbonCost(p.price).toLocaleString('en-PH')} pts</span>
                    <p className="text-[10px] text-[#9babc6]">≈ ₱{formatCurrency(p.price)}</p>
                  </div>
                  <span className={`text-[10px] ${p.stock > 0 ? 'text-[#16a35a]' : 'text-[#ef4444]'}`}>
                    {p.stock > 0 ? `${p.stock} left` : 'Out of stock'}
                  </span>
                </div>
                <button
                  onClick={() => handleBuy(p)}
                  disabled={p.stock <= 0 || buying === p.id}
                  className="btn-primary w-full mt-2 !py-2 text-xs flex items-center justify-center gap-1"
                >
                  {buying === p.id && <Loader2 size={14} className="animate-spin" />}
                  {p.stock <= 0 ? 'Out of stock' : 'Buy Now'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
