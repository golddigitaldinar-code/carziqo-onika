import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { maskAccountNumber } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/UI';
import Modal from '@/components/Modal';
import { CreditCard, Plus, Star, Trash as Trash2, Loader as Loader2 } from 'lucide-react';

interface BankCardData {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  is_default: boolean;
}

export default function BankCard() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [cards, setCards] = useState<BankCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.user_id) loadCards();
  }, [profile]);

  async function loadCards() {
    const { data } = await supabase
      .from('bank_cards')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('created_at', { ascending: false });
    if (data) setCards(data as BankCardData[]);
    setLoading(false);
  }

  async function handleAdd() {
    if (!bankName || !accountName || !accountNumber) {
      showToast('Please fill all fields', 'error');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('bank_cards').insert({
      user_id: profile!.user_id,
      bank_name: bankName,
      account_name: accountName,
      account_number: accountNumber,
      is_default: cards.length === 0,
    });
    setSubmitting(false);
    if (error) {
      showToast('Failed to add card', 'error');
    } else {
      showToast('Bank card added', 'success');
      setShowAdd(false);
      setBankName('');
      setAccountName('');
      setAccountNumber('');
      loadCards();
    }
  }

  async function handleSetDefault(id: string) {
    await supabase.from('bank_cards').update({ is_default: false }).eq('user_id', profile!.user_id);
    await supabase.from('bank_cards').update({ is_default: true }).eq('id', id);
    showToast('Default card updated', 'success');
    loadCards();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('bank_cards').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete card', 'error');
    } else {
      showToast('Card deleted', 'success');
      loadCards();
    }
  }

  return (
    <AppLayout>
      <PageHeader title="Bank Card" backPath="/wallet" rightAction={
        <button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-full bg-[#e6f7ee] flex items-center justify-center">
          <Plus size={20} className="text-[#16a35a]" />
        </button>
      } />
      <div className="px-4 py-4">
        <p className="text-xs text-[#9babc6] mb-3">Manage bank cards for withdrawals</p>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="text-[#16a35a] animate-spin" /></div>
        ) : cards.length === 0 ? (
          <EmptyState icon={CreditCard} title="No bank cards yet" subtitle="Add a card for easier withdrawals" />
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <div key={card.id} className="card relative overflow-hidden">
                {card.is_default && (
                  <div className="absolute top-0 right-0 bg-[#16a35a] text-white text-[9px] px-2 py-0.5 rounded-bl-lg font-medium flex items-center gap-1">
                    <Star size={10} /> Default
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2979ff] to-[#1a66f5] flex items-center justify-center">
                    <CreditCard size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#323643]">{card.bank_name}</p>
                    <p className="text-xs text-[#9babc6]">{card.account_name}</p>
                  </div>
                </div>
                <p className="text-base font-mono text-[#323643] tracking-wider">
                  {maskAccountNumber(card.account_number)}
                </p>
                <div className="flex gap-2 mt-3">
                  {!card.is_default && (
                    <button onClick={() => handleSetDefault(card.id)} className="text-xs text-[#16a35a] font-medium flex items-center gap-1">
                      <Star size={12} /> Set Default
                    </button>
                  )}
                  <button onClick={() => handleDelete(card.id)} className="text-xs text-[#ef4444] font-medium flex items-center gap-1 ml-auto">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setShowAdd(true)} className="btn-outline w-full mt-4 flex items-center justify-center gap-2">
          <Plus size={18} /> Add Bank Card
        </button>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Bank Card">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Bank Name</label>
            <input className="input-field" placeholder="Enter bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Card Holder Name</label>
            <input className="input-field" placeholder="Account Name" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Account Number</label>
            <input className="input-field" placeholder="Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          </div>
          <button onClick={handleAdd} disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {submitting ? 'Adding...' : 'Add Card'}
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}
