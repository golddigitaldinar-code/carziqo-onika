import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/UI';
import { Gift, Loader as Loader2 } from 'lucide-react';

interface GiftItem {
  id: string;
  name: string;
  description: string;
  carbon_cost: number;
  image_url: string;
  stock: number;
}

export default function GiftPage() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => { loadGifts(); }, []);

  async function loadGifts() {
    const { data } = await supabase.from('gifts').select('*').order('carbon_cost', { ascending: true });
    if (data) setGifts(data as GiftItem[]);
    setLoading(false);
  }

  async function handleRedeem(gift: GiftItem) {
    if (gift.stock <= 0) {
      showToast('Out of stock', 'error');
      return;
    }
    if ((profile?.carbon_points || 0) < gift.carbon_cost) {
      showToast('Insufficient carbon points', 'error');
      return;
    }
    setRedeeming(gift.id);
    try {
      const { error: carbonError } = await supabase.from('carbon_records').insert({
        user_id: profile!.user_id,
        type: 'exchange',
        points: -gift.carbon_cost,
        description: `Redeemed: ${gift.name}`,
      });
      if (carbonError) throw carbonError;

      const newPoints = (profile!.carbon_points || 0) - gift.carbon_cost;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ carbon_points: newPoints })
        .eq('user_id', profile!.user_id);
      if (profileError) throw profileError;

      await supabase
        .from('gifts')
        .update({ stock: gift.stock - 1 })
        .eq('id', gift.id);

      await refreshProfile();
      showToast(`Redeemed ${gift.name}!`, 'success');
      loadGifts();
    } catch {
      showToast('Failed to redeem', 'error');
    }
    setRedeeming(null);
  }

  return (
    <AppLayout>
      <PageHeader title="Gift List" backPath="/profile" />
      <div className="px-4 py-4">
        <div className="card mb-4 bg-gradient-to-br from-[#16a35a] to-[#0f7142] text-white">
          <div className="flex items-center gap-2">
            <Gift size={20} />
            <div>
              <p className="text-xs text-white/70">Your Carbon Points</p>
              <p className="text-xl font-bold">{Math.floor(profile?.carbon_points || 0)} pts</p>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading gifts..." />
        ) : gifts.length === 0 ? (
          <EmptyState icon={Gift} title="No gifts yet" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {gifts.map((g) => (
              <div key={g.id} className="card">
                <div className="w-full h-28 rounded-xl overflow-hidden bg-[#f0f3f8] mb-2">
                  <img
                    src={g.image_url || '/assets/images/carziqo.webp'}
                    alt={g.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-sm font-semibold text-[#323643] line-clamp-1">{g.name}</h3>
                <p className="text-xs text-[#9babc6] line-clamp-1 mb-2">{g.description}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#ef9100]">{g.carbon_cost} pts</span>
                  <span className={`text-[10px] ${g.stock > 0 ? 'text-[#16a35a]' : 'text-[#ef4444]'}`}>
                    {g.stock > 0 ? `${g.stock} left` : 'Out of stock'}
                  </span>
                </div>
                <button
                  onClick={() => handleRedeem(g)}
                  disabled={g.stock <= 0 || redeeming === g.id}
                  className="btn-primary w-full !py-2 text-xs flex items-center justify-center gap-1"
                >
                  {redeeming === g.id && <Loader2 size={14} className="animate-spin" />}
                  Redeem
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
