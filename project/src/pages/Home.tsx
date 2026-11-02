import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import { SectionCard } from '@/components/UI';
import { EmptyState } from '@/components/UI';
import {
  Wallet, Car, TrendingUp, Gift, Users, Newspaper,
  ShoppingBag, Sparkles, ChevronRight, Bell, Calendar,
  Award, MessageCircle, Megaphone, Ticket, Info, Share2,
  Shield, Headphones, ChevronRight as Chevron
} from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  price: number;
  daily_return: number;
  image_url: string;
  category: string;
}

interface Rental {
  id: string;
  vehicle_name: string;
  daily_income: number;
  status: string;
}

export default function Home() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: vData } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);
    if (vData) setVehicles(vData as Vehicle[]);

    if (profile?.user_id) {
      const { data: rData } = await supabase
        .from('rentals')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (rData) setRentals(rData as Rental[]);

      const { data: eData } = await supabase
        .from('daily_earnings')
        .select('amount')
        .eq('user_id', profile.user_id)
        .gte('date', new Date().toISOString().split('T')[0]);
      if (eData) {
        const total = eData.reduce((sum, e) => sum + Number(e.amount), 0);
        setTodayEarnings(total);
      }

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.user_id)
        .eq('is_read', false);
      setUnreadMessages(count || 0);
    }
  }

  const quickLinks = [
    { icon: Car, label: 'Car Market', to: '/car-market', color: '#16a35a' },
    { icon: Wallet, label: 'Recharge', to: '/wallet/recharge', color: '#ef9100' },
    { icon: TrendingUp, label: 'Withdraw', to: '/wallet/withdraw', color: '#2979ff' },
    { icon: Users, label: 'Team', to: '/team', color: '#22c55e' },
    { icon: Award, label: 'Carbon', to: '/carbon', color: '#16a35a' },
    { icon: Sparkles, label: 'Bubbles', to: '/bubbles', color: '#4fa3ff' },
    { icon: Calendar, label: 'Check In', to: '/checkin', color: '#ef9100' },
    { icon: Ticket, label: 'Coupon', to: '/coupon', color: '#dc2626' },
    { icon: Gift, label: 'Gift List', to: '/gift', color: '#16a35a' },
    { icon: ShoppingBag, label: 'Mall', to: '/mall', color: '#2979ff' },
  ];

  const menuLinks = [
    { icon: Newspaper, label: 'News', to: '/news' },
    { icon: Megaphone, label: 'Broadcast', to: '/broadcast' },
    { icon: MessageCircle, label: 'Messages', to: '/messages', badge: unreadMessages },
    { icon: Users, label: 'My Vehicles', to: '/my-cars' },
    { icon: TrendingUp, label: 'Daily Earnings', to: '/wallet/daily' },
    { icon: Award, label: 'Performance', to: '/performance' },
    { icon: Share2, label: 'Refer a Friend', to: '/referral' },
    { icon: Info, label: 'About Carziqo', to: '/about' },
    { icon: Headphones, label: 'Customer Service', to: '/service' },
    { icon: Shield, label: 'Security', to: '/security' },
    { icon: Share2, label: 'Download App', to: '/share' },
  ];

  return (
    <AppLayout>
      <div className="gradient-hero px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#16a35a] to-[#0f7142] flex items-center justify-center">
              <img src="/assets/images/carziqo.webp" alt="Carziqo" className="w-full h-full rounded-xl object-contain" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Carziqo</h1>
              <p className="text-[10px] text-white/50">Autonomous Mobility</p>
            </div>
          </div>
          <button onClick={() => navigate('/broadcast')} className="relative w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Bell size={20} className="text-white" />
            {unreadMessages > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#ef4444] rounded-full text-[10px] text-white flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
          <p className="text-xs text-white/60 mb-1">Your Wallet Balance</p>
          <p className="text-3xl font-bold text-white tracking-tight">
            ₱ {formatCurrency(profile?.wallet_balance || 0)}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <p className="text-[10px] text-white/50">Today's Earnings</p>
              <p className="text-sm font-semibold text-[#8edbb6]">
                ₱ {formatCurrency(todayEarnings)}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/50">Total Earned</p>
              <p className="text-sm font-semibold text-white">
                ₱ {formatCurrency(profile?.total_earnings || 0)}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/50">Carbon Points</p>
              <p className="text-sm font-semibold text-[#ef9100]">
                {Math.floor(profile?.carbon_points || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={() => navigate('/wallet/recharge')} className="flex-1 bg-gradient-to-r from-[#16a35a] to-[#0f7142] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1">
            <Wallet size={16} /> Recharge
          </button>
          <button onClick={() => navigate('/wallet/withdraw')} className="flex-1 bg-white/10 backdrop-blur-md text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1 border border-white/10">
            <TrendingUp size={16} /> Withdraw
          </button>
        </div>
      </div>

      <div className="px-4 -mt-3">
        <SectionCard>
          <div className="grid grid-cols-5 gap-3">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.to)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-active:scale-90"
                  style={{ backgroundColor: `${link.color}15` }}
                >
                  <link.icon size={20} style={{ color: link.color }} />
                </div>
                <span className="text-[10px] text-[#9babc6] font-medium text-center leading-tight">
                  {link.label}
                </span>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Featured Vehicles"
          action={<button onClick={() => navigate('/car-market')} className="text-xs text-[#16a35a] font-medium flex items-center gap-0.5">View all <ChevronRight size={14} /></button>}
        >
          {vehicles.length === 0 ? (
            <EmptyState icon={Car} title="No vehicles available" />
          ) : (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => navigate(`/car-detail?id=${v.id}`)}
                  className="flex-shrink-0 w-40 text-left group"
                >
                  <div className="w-full h-24 rounded-xl overflow-hidden bg-[#f0f3f8]">
                    {v.image_url ? (
                      <img src={v.image_url} alt={v.name} className="w-full h-full object-cover group-active:scale-95 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car size={32} className="text-[#9babc6]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#323643] mt-2 truncate">{v.name}</p>
                  <p className="text-xs text-[#16a35a] font-medium">₱{formatCurrency(v.daily_return)}/day</p>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="My Vehicles">
          {rentals.length === 0 ? (
            <div className="flex flex-col items-center py-4">
              <p className="text-xs text-[#9babc6] mb-2">No vehicles rented yet</p>
              <button onClick={() => navigate('/car-market')} className="text-xs text-[#16a35a] font-medium">
                Browse and rent →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {rentals.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-[#f0f3f8] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#323643]">{r.vehicle_name}</p>
                    <p className="text-xs text-[#9babc6]">₱{formatCurrency(r.daily_income)}/day</p>
                  </div>
                  <span className="status-badge status-active">Active</span>
                </div>
              ))}
              {rentals.length > 3 && (
                <button onClick={() => navigate('/my-cars')} className="text-xs text-[#16a35a] font-medium w-full text-center pt-1">
                  View all ({rentals.length})
                </button>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Menu">
          <div className="grid grid-cols-3 gap-1">
            {menuLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.to)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-[#f0f3f8] transition-colors relative"
              >
                <link.icon size={20} className="text-[#16a35a]" />
                <span className="text-[10px] text-[#9babc6] font-medium text-center leading-tight">
                  {link.label}
                </span>
                {link.badge && link.badge > 0 ? (
                  <span className="absolute top-1 right-4 w-4 h-4 bg-[#ef4444] rounded-full text-[9px] text-white flex items-center justify-center">
                    {link.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </SectionCard>

        <div className="pb-4" />
      </div>
    </AppLayout>
  );
}
