import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import { EmptyState } from '@/components/UI';
import { Ban, CircleCheck as CheckCircle, Pencil, Search, Users, Wallet, Loader as Loader2 } from 'lucide-react';

interface MemberRow {
  id: string;
  user_id: string;
  nickname: string;
  phone: string;
  wallet_balance: number;
  carbon_points: number;
  vip_level: number;
  referral_code: string;
  total_earnings: number;
  is_blocked: boolean;
  created_at: string;
}

export default function AdminMembers() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<MemberRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    const { data, error: rpcError } = await supabase.rpc('admin_get_profiles');
    if (rpcError || !Array.isArray(data)) {
      setError(true);
    } else {
      setMembers(data as MemberRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      (m.nickname || '').toLowerCase().includes(q) ||
      (m.phone || '').toLowerCase().includes(q) ||
      (m.referral_code || '').toLowerCase().includes(q),
    );
  }, [members, query]);

  async function handleBlock(member: MemberRow, block: boolean) {
    setActing(member.user_id);
    const fn = block ? 'admin_block_user' : 'admin_unblock_user';
    const { error: rpcError } = await supabase.rpc(fn, { p_user_id: member.user_id });
    if (rpcError) {
      showToast(`Could not ${block ? 'block' : 'unblock'} this member`, 'error');
    } else {
      showToast(`${block ? 'Blocked' : 'Unblocked'} ${member.nickname || 'member'}`, 'success');
      setMembers((prev) =>
        prev.map((m) => (m.user_id === member.user_id ? { ...m, is_blocked: block } : m)),
      );
      if (selected?.user_id === member.user_id) {
        setSelected((prev) => (prev ? { ...prev, is_blocked: block } : prev));
      }
    }
    setActing(null);
  }

  async function handleAdjustBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const amount = parseFloat(adjustAmount);
    if (!Number.isFinite(amount) || amount === 0) {
      showToast('Enter a non-zero amount', 'error');
      return;
    }

    setSaving(true);
    const { data, error: rpcError } = await supabase.rpc('admin_adjust_balance', {
      p_user_id: selected.user_id,
      p_amount: amount,
      p_reason: adjustReason.trim() || 'No reason provided',
    });
    setSaving(false);

    if (rpcError || (data && data.error)) {
      showToast('Could not adjust balance', 'error');
      return;
    }

    const newBalance = data?.new_balance ?? selected.wallet_balance + amount;
    setMembers((prev) =>
      prev.map((m) => (m.user_id === selected.user_id ? { ...m, wallet_balance: newBalance } : m)),
    );
    setSelected((prev) => (prev ? { ...prev, wallet_balance: newBalance } : prev));
    setAdjustAmount('');
    setAdjustReason('');
    showToast(`Balance adjusted by ₱${formatCurrency(amount)}`, 'success');
  }

  if (loading) return <LoadingSpinner label="Loading members..." />;
  if (error) return <EmptyState icon={Users} title="Could not load members" subtitle="Check your admin session and try again." />;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9babc6]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone, or referral code"
          className="input-field pl-9"
        />
      </div>

      <p className="text-[11px] text-[#9babc6]">{filtered.length} of {members.length} members</p>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No members found" />
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div key={m.id} className="card">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${m.is_blocked ? 'bg-[#dc2626]' : 'bg-[#16a35a]'}`}>
                  {m.nickname?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-[#323643] truncate">{m.nickname || 'Unknown'}</p>
                    {m.is_blocked && (
                      <span className="text-[9px] font-medium text-white bg-[#dc2626] px-1.5 py-0.5 rounded-full">Blocked</span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#9babc6] truncate">{m.phone || 'No phone'} • Code {m.referral_code || '-'}</p>
                  <p className="text-[10px] text-[#9babc6]">Joined {formatDate(m.created_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-[#16a35a]">₱{formatCurrency(m.wallet_balance)}</p>
                  <p className="text-[10px] text-[#9babc6]">VIP {m.vip_level}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setSelected(m)}
                  className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-xl bg-[#f0f3f8] text-[#323643]"
                >
                  <Wallet size={13} /> Adjust balance
                </button>
                {m.is_blocked ? (
                  <button
                    onClick={() => handleBlock(m, false)}
                    disabled={acting === m.user_id}
                    className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-xl bg-[#e6f7ee] text-[#16a35a]"
                  >
                    {acting === m.user_id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Unblock
                  </button>
                ) : (
                  <button
                    onClick={() => handleBlock(m, true)}
                    disabled={acting === m.user_id}
                    className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-xl bg-[#fee2e2] text-[#dc2626]"
                  >
                    {acting === m.user_id ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />} Block
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <Modal open onClose={() => setSelected(null)} title="Manage member">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${selected.is_blocked ? 'bg-[#dc2626]' : 'bg-[#16a35a]'}`}>
                {selected.nickname?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#323643]">{selected.nickname || 'Unknown'}</p>
                <p className="text-[11px] text-[#9babc6]">{selected.phone || 'No phone'}</p>
                <p className="text-[10px] text-[#9babc6]">Referral: {selected.referral_code || '-'} • VIP {selected.vip_level}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#f0f3f8] rounded-xl p-3">
                <p className="text-[10px] text-[#9babc6]">Wallet balance</p>
                <p className="text-base font-bold text-[#16a35a]">₱{formatCurrency(selected.wallet_balance)}</p>
              </div>
              <div className="bg-[#f0f3f8] rounded-xl p-3">
                <p className="text-[10px] text-[#9babc6]">Total earnings</p>
                <p className="text-base font-bold text-[#323643]">₱{formatCurrency(selected.total_earnings)}</p>
              </div>
              <div className="bg-[#f0f3f8] rounded-xl p-3">
                <p className="text-[10px] text-[#9babc6]">Carbon points</p>
                <p className="text-base font-bold text-[#323643]">{formatCurrency(selected.carbon_points)}</p>
              </div>
              <div className="bg-[#f0f3f8] rounded-xl p-3">
                <p className="text-[10px] text-[#9babc6]">Status</p>
                <p className={`text-base font-bold ${selected.is_blocked ? 'text-[#dc2626]' : 'text-[#16a35a]'}`}>
                  {selected.is_blocked ? 'Blocked' : 'Active'}
                </p>
              </div>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#9babc6] mb-1 block">
                  Adjust balance <span className="text-[#9babc6]">(positive = add, negative = subtract)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 500 or -200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#9babc6] mb-1 block">Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Bonus credit, correction"
                />
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />}
                Apply adjustment
              </button>
            </form>

            <div className="pt-2 border-t border-[#dfe5f0]">
              {selected.is_blocked ? (
                <button
                  onClick={() => handleBlock(selected, false)}
                  disabled={acting === selected.user_id}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium px-3 py-2.5 rounded-xl bg-[#e6f7ee] text-[#16a35a]"
                >
                  {acting === selected.user_id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Unblock member
                </button>
              ) : (
                <button
                  onClick={() => handleBlock(selected, true)}
                  disabled={acting === selected.user_id}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium px-3 py-2.5 rounded-xl bg-[#fee2e2] text-[#dc2626]"
                >
                  {acting === selected.user_id ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                  Block member
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
