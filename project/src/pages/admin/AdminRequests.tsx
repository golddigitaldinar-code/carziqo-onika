import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/UI';
import { CircleArrowDown as ArrowDownCircle, CircleArrowUp as ArrowUpCircle, ImageOff, Loader as Loader2 } from 'lucide-react';

type Action = 'approved' | 'rejected';

interface RechargeRow {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  status: string;
  reference: string;
  transaction_hash: string;
  created_at: string;
  member_nickname: string | null;
  member_phone: string | null;
  proof_path: string | null;
}

interface WithdrawalRow {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  addr_label: string | null;
  addr_account_name: string | null;
  addr_account_number: string | null;
  addr_bank_name: string | null;
  member_nickname: string | null;
  member_phone: string | null;
}

interface AdminRequestsProps {
  kind: 'recharges' | 'withdrawals';
}

const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };

function statusClass(status: string) {
  if (status === 'approved') return 'status-active';
  if (status === 'pending') return 'status-pending';
  return 'status-rejected';
}

export default function AdminRequests({ kind }: AdminRequestsProps) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<(RechargeRow | WithdrawalRow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    const fn = kind === 'recharges' ? 'admin_get_recharge_requests' : 'admin_get_withdrawal_requests';
    const { data, error: rpcError } = await supabase.rpc(fn);
    if (rpcError || !Array.isArray(data)) {
      setError(true);
    } else {
      setRows(
        [...data].sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)),
      );
    }
    setLoading(false);
  }, [kind]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function handleAction(id: string, action: Action) {
    setActing(id);
    const base = kind === 'recharges' ? 'recharge' : 'withdrawal';
    const fn = `admin_${action === 'approved' ? 'approve' : 'reject'}_${base}`;
    const { error: rpcError } = await supabase.rpc(fn, { request_id: id });
    if (rpcError) {
      showToast(`Could not ${action === 'approved' ? 'approve' : 'reject'} this request`, 'error');
    } else {
      showToast(`${kind === 'recharges' ? 'Cash in' : 'Withdrawal'} ${action}`, 'success');
      await load();
    }
    setActing(null);
  }

  if (loading) return <LoadingSpinner label="Loading requests..." />;

  if (error) {
    return (
      <EmptyState icon={kind === 'recharges' ? ArrowDownCircle : ArrowUpCircle} title="Could not load requests" subtitle="Check your admin session and try again." />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={kind === 'recharges' ? ArrowDownCircle : ArrowUpCircle}
        title={kind === 'recharges' ? 'No cash in requests' : 'No withdrawal requests'}
      />
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="card">
          <div className="flex items-start justify-between mb-2 gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#323643]">₱{formatCurrency(r.amount)}</p>
              <p className="text-[11px] text-[#323643] truncate">{r.member_nickname || 'Unknown member'}{r.member_phone ? ` • ${r.member_phone}` : ''}</p>
              <p className="text-[10px] text-[#9babc6]">{formatDate(r.created_at)} • {r.method}</p>
            </div>
            <span className={`status-badge ${statusClass(r.status)}`}>{r.status}</span>
          </div>

          {kind === 'recharges' ? (
            <RechargeDetails row={r as RechargeRow} />
          ) : (
            <WithdrawalDetails row={r as WithdrawalRow} />
          )}

          {r.status === 'pending' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleAction(r.id, 'approved')}
                disabled={acting === r.id}
                className="btn-primary !py-1.5 !px-3 text-xs flex-1 flex items-center justify-center gap-1"
              >
                {acting === r.id && <Loader2 size={12} className="animate-spin" />}
                Approve
              </button>
              <button
                onClick={() => handleAction(r.id, 'rejected')}
                disabled={acting === r.id}
                className="btn-error !py-1.5 !px-3 text-xs flex-1 flex items-center justify-center gap-1"
              >
                {acting === r.id && <Loader2 size={12} className="animate-spin" />}
                Reject
              </button>
            </div>
          )}
          {kind === 'withdrawals' && r.status === 'rejected' && (
            <p className="text-[10px] text-[#16a35a] mt-1">Amount refunded to member wallet</p>
          )}
        </div>
      ))}
    </div>
  );
}

function RechargeDetails({ row }: { row: RechargeRow }) {
  return (
    <div className="space-y-1.5">
      {row.proof_path && <ProofOfPayment path={row.proof_path} />}
      {row.reference && (
        <div className="bg-[#f0f3f8] rounded-lg p-2">
          <p className="text-[9px] text-[#9babc6]">Reference</p>
          <p className="text-[10px] font-mono text-[#323643] break-all">{row.reference}</p>
        </div>
      )}
      {row.transaction_hash && (
        <div className="bg-[#f0f3f8] rounded-lg p-2">
          <p className="text-[9px] text-[#9babc6]">Transaction hash</p>
          <p className="text-[10px] font-mono text-[#323643] break-all">{row.transaction_hash}</p>
        </div>
      )}
    </div>
  );
}

function ProofOfPayment({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.storage
      .from('payment-proofs')
      .createSignedUrl(path, 600)
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data?.signedUrl) setFailed(true);
        else setUrl(data.signedUrl);
      });
    return () => {
      active = false;
    };
  }, [path]);

  return (
    <div className="bg-[#f0f3f8] rounded-lg p-2">
      <p className="text-[9px] text-[#9babc6] mb-1">Proof of payment</p>
      {failed ? (
        <p className="text-[10px] text-[#e5484d] flex items-center gap-1">
          <ImageOff size={12} /> Could not load proof image
        </p>
      ) : url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt="Proof of payment" className="w-full max-h-72 object-contain rounded-md bg-white" />
        </a>
      ) : (
        <p className="text-[10px] text-[#9babc6] flex items-center gap-1">
          <Loader2 size={12} className="animate-spin" /> Loading proof...
        </p>
      )}
    </div>
  );
}

function WithdrawalDetails({ row }: { row: WithdrawalRow }) {
  if (!row.addr_account_number) return null;
  return (
    <div className="bg-[#f0f3f8] rounded-lg p-2 space-y-0.5">
      <p className="text-[9px] text-[#9babc6] uppercase tracking-wide">Send to</p>
      {row.addr_label && <p className="text-[11px] font-medium text-[#323643]">{row.addr_label}</p>}
      {row.addr_bank_name && <p className="text-[10px] text-[#9babc6]">Bank: {row.addr_bank_name}</p>}
      <p className="text-[10px] text-[#9babc6]">Name: {row.addr_account_name}</p>
      <p className="text-[10px] font-mono text-[#323643] break-all">{row.addr_account_number}</p>
    </div>
  );
}
