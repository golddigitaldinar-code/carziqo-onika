import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { maskAccountNumber } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/UI';
import Modal from '@/components/Modal';
import { Plus, Star, Trash as Trash2, Loader as Loader2, Smartphone, Bitcoin, Coins, CreditCard, Building as Building2, Wallet, CreditCard as Edit2, Check } from 'lucide-react';

interface WithdrawAddress {
  id: string;
  label: string;
  method: string;
  account_name: string;
  account_number: string;
  bank_name: string | null;
  is_default: boolean;
  created_at: string;
}

const methodOptions = [
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2, color: '#2979ff' },
  { id: 'gcash', label: 'GCash', icon: Smartphone, color: '#2979ff' },
  { id: 'paymaya', label: 'PayMaya', icon: Smartphone, color: '#16a35a' },
  { id: 'usdt_trc20', label: 'USDT TRC20', icon: Bitcoin, color: '#ef9100' },
  { id: 'usdt_bep20', label: 'USDT BEP20', icon: Bitcoin, color: '#f0b90b' },
  { id: 'usdt_erc20', label: 'USDT ERC20', icon: Bitcoin, color: '#26a17b' },
  { id: 'bitcoin', label: 'Bitcoin BTC', icon: Bitcoin, color: '#f7931a' },
  { id: 'eth', label: 'ETH', icon: Coins, color: '#627eea' },
  { id: 'bnb', label: 'BNB', icon: Coins, color: '#f0b90b' },
  { id: 'opbnb', label: 'opBNB', icon: Coins, color: '#c2a5cf' },
  { id: 'worldcoin', label: 'WorldCoin WLD', icon: Coins, color: '#8a2be2' },
];

const isCrypto = (method: string) => !['bank_transfer', 'gcash', 'paymaya'].includes(method);

function getMethodMeta(method: string) {
  return methodOptions.find((m) => m.id === method) || methodOptions[0];
}

export default function WithdrawAddresses() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<WithdrawAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    label: '',
    method: 'bank_transfer',
    account_name: '',
    account_number: '',
    bank_name: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.user_id) loadAddresses();
  }, [profile]);

  async function loadAddresses() {
    const { data } = await supabase
      .from('withdrawal_addresses')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('created_at', { ascending: false });
    if (data) setAddresses(data as WithdrawAddress[]);
    setLoading(false);
  }

  function openAdd() {
    setEditingId(null);
    setForm({ label: '', method: 'bank_transfer', account_name: '', account_number: '', bank_name: '' });
    setShowAdd(true);
  }

  function openEdit(addr: WithdrawAddress) {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      method: addr.method,
      account_name: addr.account_name,
      account_number: addr.account_number,
      bank_name: addr.bank_name || '',
    });
    setShowAdd(true);
  }

  async function handleSave() {
    if (!form.label.trim() || !form.account_name.trim() || !form.account_number.trim()) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    if (form.method === 'bank_transfer' && !form.bank_name.trim()) {
      showToast('Please enter bank name', 'error');
      return;
    }

    setSubmitting(true);
    const payload = {
      user_id: profile!.user_id,
      label: form.label.trim(),
      method: form.method,
      account_name: form.account_name.trim(),
      account_number: form.account_number.trim(),
      bank_name: isCrypto(form.method) ? null : form.bank_name.trim(),
      is_default: addresses.length === 0 && !editingId,
    };

    if (editingId) {
      const { error } = await supabase
        .from('withdrawal_addresses')
        .update({
          label: payload.label,
          method: payload.method,
          account_name: payload.account_name,
          account_number: payload.account_number,
          bank_name: payload.bank_name,
        })
        .eq('id', editingId);
      if (error) {
        showToast('Failed to update address', 'error');
      } else {
        showToast('Address updated', 'success');
        setShowAdd(false);
        loadAddresses();
      }
    } else {
      const { error } = await supabase.from('withdrawal_addresses').insert(payload);
      if (error) {
        showToast('Failed to add address', 'error');
      } else {
        showToast('Withdrawal address saved', 'success');
        setShowAdd(false);
        loadAddresses();
      }
    }
    setSubmitting(false);
  }

  async function handleSetDefault(id: string) {
    await supabase.from('withdrawal_addresses').update({ is_default: false }).eq('user_id', profile!.user_id);
    await supabase.from('withdrawal_addresses').update({ is_default: true }).eq('id', id);
    showToast('Default address updated', 'success');
    loadAddresses();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('withdrawal_addresses').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete address', 'error');
    } else {
      showToast('Address deleted', 'success');
      loadAddresses();
    }
  }

  const selectedMethod = getMethodMeta(form.method);

  return (
    <AppLayout>
      <PageHeader title="Withdrawal Addresses" backPath="/wallet/withdraw" rightAction={
        <button onClick={openAdd} className="w-9 h-9 rounded-full bg-[#e6f7ee] flex items-center justify-center">
          <Plus size={20} className="text-[#16a35a]" />
        </button>
      } />
      <div className="px-4 py-4">
        <p className="text-xs text-[#9babc6] mb-3">Save your bank accounts, e-wallets, and crypto wallet addresses for faster withdrawals</p>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="text-[#16a35a] animate-spin" /></div>
        ) : addresses.length === 0 ? (
          <EmptyState icon={Wallet} title="No saved addresses" subtitle="Add a bank, e-wallet, or crypto address" />
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => {
              const meta = getMethodMeta(addr.method);
              return (
                <div key={addr.id} className="card relative overflow-hidden">
                  {addr.is_default && (
                    <div className="absolute top-0 right-0 bg-[#16a35a] text-white text-[9px] px-2 py-0.5 rounded-bl-lg font-medium flex items-center gap-1">
                      <Star size={10} /> Default
                    </div>
                  )}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${meta.color}15` }}>
                      <meta.icon size={22} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#323643]">{addr.label}</p>
                      <p className="text-[10px] text-[#9babc6]">{meta.label}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {addr.bank_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#9babc6] w-16">Bank</span>
                        <span className="text-xs text-[#323643]">{addr.bank_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#9babc6] w-16">Name</span>
                      <span className="text-xs text-[#323643]">{addr.account_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#9babc6] w-16">{isCrypto(addr.method) ? 'Address' : 'Number'}</span>
                      <span className="text-xs font-mono text-[#323643] break-all">
                        {isCrypto(addr.method) ? addr.account_number : maskAccountNumber(addr.account_number)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3 pt-2 border-t border-[#f0f3f8]">
                    <button onClick={() => openEdit(addr)} className="text-xs text-[#2979ff] font-medium flex items-center gap-1">
                      <Edit2 size={12} /> Edit
                    </button>
                    {!addr.is_default && (
                      <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-[#16a35a] font-medium flex items-center gap-1">
                        <Star size={12} /> Set Default
                      </button>
                    )}
                    <button onClick={() => handleDelete(addr.id)} className="text-xs text-[#ef4444] font-medium flex items-center gap-1 ml-auto">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={openAdd} className="btn-outline w-full mt-4 flex items-center justify-center gap-2">
          <Plus size={18} /> Add Withdrawal Address
        </button>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editingId ? 'Edit Address' : 'Add Withdrawal Address'}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Label</label>
            <input
              className="input-field"
              placeholder="e.g. My GCash, Binance USDT"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {methodOptions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setForm({ ...form, method: m.id })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                    form.method === m.id ? 'border-[#16a35a] bg-[#e6f7ee]' : 'border-[#dfe5f0]'
                  }`}
                >
                  <m.icon size={18} style={{ color: m.color }} />
                  <span className="text-[9px] text-[#323643] text-center leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {form.method === 'bank_transfer' && (
            <div>
              <label className="text-xs font-medium text-[#9babc6] mb-1 block">Bank Name</label>
              <input
                className="input-field"
                placeholder="e.g. BDO, BPI, Metrobank"
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">
              {isCrypto(form.method) ? 'Wallet Address' : form.method === 'bank_transfer' ? 'Account Number' : 'Mobile Number'}
            </label>
            <input
              className="input-field"
              placeholder={isCrypto(form.method) ? 'Paste wallet address' : form.method === 'bank_transfer' ? 'Bank account number' : '09XX XXX XXXX'}
              value={form.account_number}
              onChange={(e) => setForm({ ...form, account_number: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">
              {isCrypto(form.method) ? 'Address Label / Name' : 'Account Holder Name'}
            </label>
            <input
              className="input-field"
              placeholder={isCrypto(form.method) ? 'e.g. Binance Spot Wallet' : 'Full name on account'}
              value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
            />
          </div>

          <button onClick={handleSave} disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : editingId ? <Check size={18} /> : <Plus size={18} />}
            {submitting ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}
