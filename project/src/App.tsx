import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { FullScreenLoader } from './components/LoadingSpinner';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';

import Home from './pages/Home';
import CarMarket from './pages/car/CarMarket';
import CarDetail from './pages/car/CarDetail';
import MyCars from './pages/car/MyCars';
import LiveFleet from './pages/car/LiveFleet';

import Wallet from './pages/wallet/Wallet';
import Recharge from './pages/wallet/Recharge';
import Withdraw from './pages/wallet/Withdraw';
import BankCard from './pages/wallet/BankCard';
import WithdrawAddresses from './pages/wallet/WithdrawAddresses';
import BalanceRecord from './pages/wallet/BalanceRecord';
import RechargeRecord from './pages/wallet/RechargeRecord';
import DailyEarnings from './pages/wallet/DailyEarnings';

import Profile from './pages/profile/Profile';
import Account from './pages/profile/Account';
import Security from './pages/profile/Security';

import Team from './pages/team/Team';
import TeamDetail from './pages/team/TeamDetail';
import Referral from './pages/team/Referral';
import MemberIntro from './pages/team/MemberIntro';

import Carbon from './pages/rewards/Carbon';
import Bubbles from './pages/rewards/Bubbles';
import Checkin from './pages/rewards/Checkin';
import Performance from './pages/rewards/Performance';

import News from './pages/content/News';
import NewsDetail from './pages/content/NewsDetail';
import Messages from './pages/content/Messages';
import MessageDetail from './pages/content/MessageDetail';
import Broadcast from './pages/content/Broadcast';

import Mall from './pages/shop/Mall';
import MallRecords from './pages/shop/MallRecords';
import Coupon from './pages/shop/Coupon';
import Gift from './pages/shop/Gift';

import About from './pages/info/About';
import Faq from './pages/info/Faq';
import Service from './pages/info/Service';
import Privacy from './pages/info/Privacy';
import Share from './pages/info/Share';

import Admin from './pages/admin/Admin';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/reset" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />

      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/car-market" element={<ProtectedRoute><CarMarket /></ProtectedRoute>} />
      <Route path="/car-detail" element={<ProtectedRoute><CarDetail /></ProtectedRoute>} />
      <Route path="/my-cars" element={<ProtectedRoute><MyCars /></ProtectedRoute>} />
      <Route path="/live-fleet" element={<ProtectedRoute><LiveFleet /></ProtectedRoute>} />

      <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
      <Route path="/wallet/recharge" element={<ProtectedRoute><Recharge /></ProtectedRoute>} />
      <Route path="/wallet/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
      <Route path="/wallet/bank-card" element={<ProtectedRoute><BankCard /></ProtectedRoute>} />
      <Route path="/wallet/withdraw-addresses" element={<ProtectedRoute><WithdrawAddresses /></ProtectedRoute>} />
      <Route path="/wallet/balance-record" element={<ProtectedRoute><BalanceRecord /></ProtectedRoute>} />
      <Route path="/wallet/recharge-record" element={<ProtectedRoute><RechargeRecord /></ProtectedRoute>} />
      <Route path="/wallet/daily" element={<ProtectedRoute><DailyEarnings /></ProtectedRoute>} />

      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
      <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />

      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/team-detail" element={<ProtectedRoute><TeamDetail /></ProtectedRoute>} />
      <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
      <Route path="/member-intro" element={<ProtectedRoute><MemberIntro /></ProtectedRoute>} />

      <Route path="/carbon" element={<ProtectedRoute><Carbon /></ProtectedRoute>} />
      <Route path="/bubbles" element={<ProtectedRoute><Bubbles /></ProtectedRoute>} />
      <Route path="/checkin" element={<ProtectedRoute><Checkin /></ProtectedRoute>} />
      <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />

      <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
      <Route path="/news-detail" element={<ProtectedRoute><NewsDetail /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/message-detail" element={<ProtectedRoute><MessageDetail /></ProtectedRoute>} />
      <Route path="/broadcast" element={<ProtectedRoute><Broadcast /></ProtectedRoute>} />

      <Route path="/mall" element={<ProtectedRoute><Mall /></ProtectedRoute>} />
      <Route path="/mall-records" element={<ProtectedRoute><MallRecords /></ProtectedRoute>} />
      <Route path="/coupon" element={<ProtectedRoute><Coupon /></ProtectedRoute>} />
      <Route path="/gift" element={<ProtectedRoute><Gift /></ProtectedRoute>} />

      <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
      <Route path="/faq" element={<ProtectedRoute><Faq /></ProtectedRoute>} />
      <Route path="/service" element={<ProtectedRoute><Service /></ProtectedRoute>} />
      <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
      <Route path="/share" element={<ProtectedRoute><Share /></ProtectedRoute>} />

      <Route path="/admin" element={<Admin />} />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
