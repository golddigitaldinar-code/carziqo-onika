import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, maskAccountNumber } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Loader as Loader2, CircleAlert as AlertCircle, KeyRound, ChevronRight, Smartphone, Bitcoin, Coins, Building as Building2, Plus, Wallet as WalletIcon } from 'lucide-react';

interface WithdrawAddress {
  id: string;
  label: string;
  method: string;
  account_name: string;
  account_number: string;
  bank_name: string | null;
  is_default: boolean;
}

const methodMeta: Record<string, { label: string; icon: typeof Smartphone; color: string }> = {
  bank_transfer: { label: 'Bank Transfer', icon: Building2, color: '#2979ff' },
  gcash: { label: 'GCash', icon: Smartphone, color: '#2979ff' },
  paymaya: { label: 'PayMaya', icon: Smartphone, color: '#16a35a' },
  usdt_trc20: { label: 'USDT TRC20', icon: Bitcoin, color: '#ef9100' },
  usdt_bep20: { label: 'USDT BEP20', icon: Bitcoin, color: '#f0b90b' },
  usdt_erc20: { label: 'USDT ERC20', icon: Bitcoin, color: '#26a17b' },
  bitcoin: { label: 'Bitcoin BTC', icon: Bitcoin, color: '#f7931a' },
  eth: { label: 'ETH', icon: Coins, color: '#627eea' },
  bnb: { label: 'BNB', icon: Coins, color: '#f0b90b' },
  opbnb: { label: 'opBNB', icon: Coins, color: '#c2a5cf' },
  worldcoin: { label: 'WorldCoin WLD', icon: Coins, color: '#8a2be2' },
};

const isCrypto = (method: string) => !['bank_transfer', 'gcash', 'paymaya'].includes(method);

export default function Withdraw() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [withdrawalPassword, setWithdrawalPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasWithdrawalPassword, setHasWithdrawalPassword] = useState(false);
  const [addresses, setAddresses] = useState<WithdrawAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    if (profile) {
      setHasWithdrawalPassword(!!profile.withdrawal_password);
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.user_id) loadAddresses();
  }, [profile]);

  async function loadAddresses() {
    const { data } = await supabase
      .from('withdrawal_addresses')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) {
      setAddresses(data as WithdrawAddress[]);
      const defaultAddr = data.find((a) => a.is_default);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (data.length > 0) setSelectedAddressId(data[0].id);
    }
    setLoadingAddresses(false);
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  async function handleWithdraw() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (!hasWithdrawalPassword) {
      showToast('Please set withdrawal password first', 'error');
      navigate('/security');
      return;
    }
    if (!selectedAddressId) {
      showToast('Please select a withdrawal address', 'error');
      navigate('/wallet/withdraw-addresses');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('request_withdrawal', {
        p_amount: amt,
        p_method: selectedAddress?.method || 'bank_transfer',
        p_address_id: selectedAddressId,
        p_withdrawal_password: withdrawalPassword,
      });

      if (error) throw error;

      if (data && data.error) {
        showToast(data.error, 'error');
        setLoading(false);
        return;
      }

      await refreshProfile();
      showToast('Withdrawal submitted for admin review', 'success');
      navigate('/wallet/balance-record');
    } catch {
      showToast('Failed to submit withdrawal', 'error');
    }
    setLoading(false);
  }

  return (
    <AppLayout>
      <PageHeader title="Withdrawal Wallet" backPath="/wallet" />
      <div className="px-4 py-4">
        <div className="card mb-4 bg-gradient-to-br from-[#ef9100] to-[#cc7e00] text-white">
          <p className="text-xs text-white/70">Available Balance</p>
          <p className="text-2xl font-bold">₱ {formatCurrency(profile?.wallet_balance || 0)}</p>
          <p className="text-[10px] text-white/60 mt-1">Minimum ₱500 • Within 24h processing</p>
        </div>

        <div className="card mb-4 bg-[#fff8eb] border border-[#ef9100]/30 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ef9100]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Loader2 size={16} className="text-[#ef9100]" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#323643]">Admin Review Required</p>
            <p className="text-[11px] text-[#9babc6] mt-0.5">Your withdrawal will be sent to your saved address and reviewed by admin. If rejected, the amount is refunded to your wallet.</p>
          </div>
        </div>

        {!hasWithdrawalPassword && (
          <div className="card mb-4 bg-[#fff8eb] border border-[#ef9100]/30 flex items-start gap-3">
            <AlertCircle size={20} className="text-[#ef9100] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-[#323643]">Set Withdrawal Password</p>
              <p className="text-[11px] text-[#9babc6] mt-0.5">Required for withdrawals</p>
              <button onClick={() => navigate('/security')} className="text-xs text-[#16a35a] font-medium mt-1">
                Set now →
              </button>
            </div>
          </div>
        )}

        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#323643]">Withdraw To</h3>
            <button onClick={() => navigate('/wallet/withdraw-addresses')} className="text-xs text-[#16a35a] font-medium flex items-center gap-1">
              Manage <ChevronRight size={12} />
            </button>
          </div>

          {loadingAddresses ? (
            <div className="flex justify-center py-4"><Loader2 size={20} className="text-[#16a35a] animate-spin" /></div>
          ) : addresses.length === 0 ? (
            <button
              onClick={() => navigate('/wallet/withdraw-addresses')}
              className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-[#dfe5f0] rounded-xl"
            >
              <div className="w-12 h-12 rounded-full bg-[#e6f7ee] flex items-center justify-center">
                <Plus size={24} className="text-[#16a35a]" />
              </div>
              <p className="text-sm text-[#323643] font-medium">Add Withdrawal Address</p>
              <p className="text-[10px] text-[#9babc6]">Save your bank, e-wallet, or crypto address</p>
            </button>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => {
                const meta = methodMeta[addr.method] || methodMeta.bank_transfer;
                return (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedAddressId === addr.id ? 'border-[#16a35a] bg-[#e6f7ee]' : 'border-[#dfe5f0]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${meta.color}15` }}>
                      <meta.icon size={20} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#323643]">{addr.label}</p>
                      <p className="text-[10px] text-[#9babc6]">
                        {addr.bank_name ? `${addr.bank_name} • ` : ''}
                        {isCrypto(addr.method) ? `${addr.account_number.slice(0, 10)}...${addr.account_number.slice(-6)}` : maskAccountNumber(addr.account_number)}
                      </p>
                    </div>
                    {addr.is_default && (
                      <span className="text-[9px] text-[#16a35a] font-medium bg-[#e6f7ee] px-2 py-0.5 rounded-full">Default</span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => navigate('/wallet/withdraw-addresses')}
                className="w-full flex items-center justify-center gap-1 py-2 text-xs text-[#16a35a] font-medium"
              >
                <Plus size={14} /> Add new address
              </button>
            </div>
          )}
        </div>

        {selectedAddress && (
          <div className="card mb-4 bg-[#f8faff] border border-[#dfe5f0]">
            <p className="text-[10px] text-[#9babc6] uppercase tracking-wide mb-2">Payment will be sent to</p>
            <div className="space-y-1">
              {selectedAddress.bank_name && (
                <div className="flex gap-2">
                  <span className="text-[10px] text-[#9babc6] w-16">Bank</span>
                  <span className="text-xs text-[#323643]">{selectedAddress.bank_name}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-[10px] text-[#9babc6] w-16">Name</span>
                <span className="text-xs text-[#323643]">{selectedAddress.account_name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] text-[#9babc6] w-16">{isCrypto(selectedAddress.method) ? 'Address' : 'Number'}</span>
                <span className="text-xs font-mono text-[#323643] break-all">
                  {isCrypto(selectedAddress.method) ? selectedAddress.account_number : maskAccountNumber(selectedAddress.account_number)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-[#323643] mb-3">Withdrawal Amount</h3>
          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9babc6] font-medium">₱</span>
            <input
              type="number"
              className="input-field pl-8"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <button
            onClick={() => setAmount(String(profile?.wallet_balance || 0))}
            className="text-xs text-[#16a35a] font-medium"
          >
            Withdraw All
          </button>
        </div>

        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-[#323643] mb-3 flex items-center gap-2">
            <KeyRound size={16} className="text-[#16a35a]" /> Withdrawal Password
          </h3>
          <input
            type="password"
            className="input-field"
            placeholder="Enter withdrawal password"
            value={withdrawalPassword}
            onChange={(e) => setWithdrawalPassword(e.target.value)}
            maxLength={6}
          />
        </div>

        <button onClick={handleWithdraw} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Processing...' : 'Submit for Review'}
        </button>

        <p className="text-[11px] text-[#9babc6] text-center mt-3">
          Withdrawals are reviewed and processed within 24 hours
        </p>
      </div>
    </AppLayout>
  );
}
