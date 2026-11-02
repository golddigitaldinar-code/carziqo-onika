import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isAdminSession } from '@/lib/admin';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminRequests from '@/pages/admin/AdminRequests';
import AdminMembers from '@/pages/admin/AdminMembers';
import AdminCars from '@/pages/admin/AdminCars';
import AdminAccount from '@/pages/admin/AdminAccount';

type Tab = 'recharges' | 'withdrawals' | 'members' | 'cars' | 'account';
type Gate = 'checking' | 'signed_out' | 'admin';

const tabs: { key: Tab; label: string }[] = [
  { key: 'recharges', label: 'Cash In' },
  { key: 'withdrawals', label: 'Withdrawals' },
  { key: 'members', label: 'Members' },
  { key: 'cars', label: 'Cars' },
  { key: 'account', label: 'Account' },
];

export default function Admin() {
  const [gate, setGate] = useState<Gate>('checking');
  const [tab, setTab] = useState<Tab>('recharges');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setGate('signed_out');
        return;
      }
      setGate((await isAdminSession()) ? 'admin' : 'signed_out');
    })();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setGate('signed_out');
  }

  if (gate === 'checking') {
    return (
      <AppLayout showNav={false}>
        <PageHeader title="Admin Panel" backPath="/home" />
        <LoadingSpinner />
      </AppLayout>
    );
  }

  if (gate === 'signed_out') {
    return (
      <AppLayout showNav={false}>
        <PageHeader title="Admin Panel" backPath="/home" />
        <AdminLogin onSuccess={() => setGate('admin')} />
      </AppLayout>
    );
  }

  return (
    <AppLayout showNav={false}>
      <PageHeader title="Admin Panel" backPath="/home" />
      <div className="px-4 py-4">
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                tab === t.key ? 'bg-[#16a35a] text-white' : 'bg-white border border-[#dfe5f0] text-[#9babc6]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'recharges' && <AdminRequests kind="recharges" />}
        {tab === 'withdrawals' && <AdminRequests kind="withdrawals" />}
        {tab === 'members' && <AdminMembers />}
        {tab === 'cars' && <AdminCars />}
        {tab === 'account' && <AdminAccount onSignOut={handleSignOut} />}
      </div>
    </AppLayout>
  );
}
