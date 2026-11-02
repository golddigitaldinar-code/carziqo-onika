import type { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export default function AppLayout({ children, showNav = true }: AppLayoutProps) {
  return (
    <div className="app-container pb-20">
      {children}
      {showNav && <BottomNav />}
    </div>
  );
}
