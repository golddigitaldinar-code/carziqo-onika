import { NavLink, useLocation } from 'react-router-dom';
import { Dome as Home, Car, Wallet, User } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  const items = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/car-market', icon: Car, label: 'Market' },
    { to: '/wallet', icon: Wallet, label: 'Wallet' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/home') return location.pathname === '/home' || location.pathname === '/';
    if (path === '/car-market') return location.pathname.startsWith('/car');
    if (path === '/wallet') return location.pathname.startsWith('/wallet');
    if (path === '/profile') return location.pathname.startsWith('/profile') || location.pathname.startsWith('/account') || location.pathname.startsWith('/security');
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] nav-glass border-t border-[#dfe5f0] z-50">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = isActive(item.to);
          return (
            <NavLink key={item.to} to={item.to} className="flex flex-col items-center gap-1 px-4 py-1 transition-all">
              <item.icon
                size={22}
                className={active ? 'text-[#16a35a]' : 'text-[#9babc6]'}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-[#16a35a]' : 'text-[#9babc6]'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
