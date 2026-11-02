import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { watchTable } from '@/lib/realtime';
import { formatCurrency } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/UI';
import { Car, Gift } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  description: string;
  price: number;
  daily_return: number;
  image_url: string;
  stock: number;
  status: string;
  category: string;
  settlement_cycle: number;
  is_free_vehicle: boolean;
}

const categories = ['All', 'standard', 'premium', 'luxury'];

export default function CarMarket() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    loadVehicles();
    return watchTable('car-market', { table: 'vehicles' }, loadVehicles);
  }, []);

  async function loadVehicles() {
    const { data } = await supabase.from('vehicles').select('*').order('price', { ascending: true });
    if (data) setVehicles(data as Vehicle[]);
    setLoading(false);
  }

  const filtered = category === 'All' ? vehicles : vehicles.filter((v) => v.category === category);

  const categoryColors: Record<string, string> = {
    standard: '#2979ff',
    premium: '#ef9100',
    luxury: '#dc2626',
  };

  return (
    <AppLayout>
      <PageHeader title="Car Market" />
      <div className="px-4 py-3">
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-[#16a35a] text-white'
                  : 'bg-white text-[#9babc6] border border-[#dfe5f0]'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="card mb-3 bg-[#e6f7ee] border border-[#16a35a]/20 flex items-start gap-3">
          <Gift size={18} className="text-[#16a35a] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-[#323643]">Free Trial Available</p>
            <p className="text-[11px] text-[#9babc6] mt-0.5">Claim 1 free vehicle for 7 days — no cost. Paid rentals: ₱500 to ₱100,000.</p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading vehicles..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Car} title="No vehicles found" />
        ) : (
          <div className="space-y-3">
            {filtered.map((v) => (
              <button
                key={v.id}
                onClick={() => navigate(`/car-detail?id=${v.id}`)}
                className="card card-hover w-full text-left flex gap-3"
              >
                <div className="w-28 h-24 rounded-xl overflow-hidden bg-[#f0f3f8] flex-shrink-0">
                  {v.image_url ? (
                    <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car size={28} className="text-[#9babc6]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {v.is_free_vehicle ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white bg-[#ef9100] flex items-center gap-1">
                        <Gift size={8} /> FREE
                      </span>
                    ) : (
                      <span
                        className="text-[9px] font-medium px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: categoryColors[v.category] || '#16a35a' }}
                      >
                        {v.category.toUpperCase()}
                      </span>
                    )}
                    {v.stock > 0 ? (
                      <span className="status-badge status-active">Available</span>
                    ) : (
                      <span className="status-badge status-closed">Out of stock</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-[#323643] truncate">{v.name}</h3>
                  <p className="text-xs text-[#9babc6] truncate">{v.description}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <p className="text-[10px] text-[#9babc6]">Daily Return</p>
                      <p className="text-sm font-bold text-[#16a35a]">₱{formatCurrency(v.daily_return)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#9babc6]">Price</p>
                      <p className="text-sm font-bold text-[#323643]">
                        {v.is_free_vehicle ? 'FREE' : `₱${formatCurrency(v.price)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
