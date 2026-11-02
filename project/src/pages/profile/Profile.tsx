import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import { User, Settings, Shield, Users, Share2, Headphones, Info, Newspaper, Megaphone, ShoppingBag, Award, LogOut, ChevronRight, Ticket, Gift, Car, Circle as HelpCircle, Smartphone } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const vipLabels = ['Standard', 'Silver', 'Gold', 'Platinum', 'Diamond'];

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Account details', to: '/account' },
        { icon: Shield, label: 'Security', to: '/security' },
        { icon: Car, label: 'My Vehicles', to: '/my-cars' },
        { icon: ShoppingBag, label: 'Mall Orders', to: '/mall-records' },
        { icon: Ticket, label: 'My Coupon', to: '/coupon' },
      ],
    },
    {
      title: 'Rewards',
      items: [
        { icon: Award, label: 'Carbon Points', to: '/carbon' },
        { icon: Gift, label: 'Gift List', to: '/gift' },
        { icon: Share2, label: 'Refer a Friend', to: '/referral' },
        { icon: Users, label: 'Team Members', to: '/team' },
      ],
    },
    {
      title: 'Information',
      items: [
        { icon: Newspaper, label: 'News', to: '/news' },
        { icon: Megaphone, label: 'Broadcast', to: '/broadcast' },
        { icon: Info, label: 'About Carziqo', to: '/about' },
        { icon: HelpCircle, label: 'FAQ', to: '/faq' },
        { icon: Headphones, label: 'Customer Service', to: '/service' },
        { icon: Smartphone, label: 'Download App', to: '/share' },
      ],
    },
  ];

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <AppLayout>
      <div className="gradient-hero px-5 pt-12 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#16a35a] to-[#0f7142] flex items-center justify-center text-white text-2xl font-bold border-2 border-white/20">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile?.nickname || 'User'} className="w-full h-full object-cover" />
            ) : (
              (profile?.nickname || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{profile?.nickname || 'Member'}</h2>
            <p className="text-xs text-white/50">{profile?.phone || 'No phone number'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ef9100] to-[#cc7e00] text-white">
                {vipLabels[profile?.vip_level || 0]} VIP
              </span>
              {profile?.referrer_code && (
                <span className="text-[10px] text-white/50">Referred by {profile.referrer_code}</span>
              )}
            </div>
          </div>
          <button onClick={() => navigate('/account')} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Settings size={18} className="text-white" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-white">₱{formatCurrency(profile?.wallet_balance || 0)}</p>
            <p className="text-[10px] text-white/50">Balance</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-[#8edbb6]">₱{formatCurrency(profile?.total_earnings || 0)}</p>
            <p className="text-[10px] text-white/50">Total Earned</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-[#ef9100]">{Math.floor(profile?.carbon_points || 0)}</p>
            <p className="text-[10px] text-white/50">Carbon</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 pb-4">
        {menuSections.map((section) => (
          <div key={section.title} className="card mb-3">
            <h3 className="text-xs font-semibold text-[#9babc6] mb-2 px-1">{section.title}</h3>
            <div className="space-y-0">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.to)}
                  className="w-full flex items-center justify-between py-3 border-b border-[#f0f3f8] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#f0f3f8] flex items-center justify-center">
                      <item.icon size={18} className="text-[#16a35a]" />
                    </div>
                    <span className="text-sm font-medium text-[#323643]">{item.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-[#9babc6]" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleLogout}
          className="card w-full flex items-center justify-center gap-2 text-[#ef4444] font-semibold"
        >
          <LogOut size={18} /> Log out
        </button>
      </div>
    </AppLayout>
  );
}
