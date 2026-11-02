import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/utils';
import { paymentMethods } from '@/lib/paymentMethods';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Loader as Loader2, Copy, Check, Upload, QrCode, CircleAlert as AlertCircle, Wallet, Link2, FileText, ImagePlus, X } from 'lucide-react';

const quickAmounts = [200, 500, 1000, 2000, 5000, 10000];
const PROOF_MAX_BYTES = 5 * 1024 * 1024;
const PROOF_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export default function Recharge() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('gcash');
  const [reference, setReference] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const selectedMethod = paymentMethods.find((m) => m.id === method)!;
  const SelectedIcon = selectedMethod.icon;
  const isMobileWallet = selectedMethod.id === 'gcash' || selectedMethod.id === 'paymaya';

  useEffect(() => {
    if (!proofFile) {
      setProofPreview(null);
      return;
    }
    const url = URL.createObjectURL(proofFile);
    setProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  function copyAddress() {
    if (!selectedMethod.address) return;
    navigator.clipboard.writeText(selectedMethod.address);
    setCopied(true);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleProofChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!PROOF_TYPES[file.type]) {
      showToast('Proof must be a JPG, PNG or WEBP image', 'error');
      return;
    }
    if (file.size > PROOF_MAX_BYTES) {
      showToast('Proof image must be 5 MB or smaller', 'error');
      return;
    }
    setProofFile(file);
  }

  function handleProceed() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (amt < 200) {
      showToast('Minimum recharge is ₱200', 'error');
      return;
    }
    if (!profile?.user_id) {
      showToast('Please log in first', 'error');
      return;
    }
    setShowPayment(true);
  }

  async function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    if (!profile?.user_id) return;

    if (!proofFile) {
      showToast('Please upload a photo of your proof of payment', 'error');
      return;
    }

    if (!reference.trim() && !transactionHash.trim()) {
      showToast('Please enter your reference number or transaction hash', 'error');
      return;
    }

    setLoading(true);
    try {
      const extension = PROOF_TYPES[proofFile.type];
      const proofPath = `${profile.user_id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(proofPath, proofFile, { contentType: proofFile.type });
      if (uploadError) throw uploadError;

      const { error } = await supabase.from('recharge_requests').insert({
        user_id: profile.user_id,
        amount: amt,
        method: selectedMethod.id,
        reference: reference.trim(),
        transaction_hash: transactionHash.trim(),
        proof_path: proofPath,
        status: 'pending',
      });

      if (error) throw error;

      showToast('Recharge submitted for admin review', 'success');
      navigate('/wallet/recharge-record');
    } catch {
      showToast('Failed to submit recharge request', 'error');
    }
    setLoading(false);
  }

  return (
    <AppLayout>
      <PageHeader title="Recharge Wallet" backPath="/wallet" />
      <div className="px-4 py-4">
        <div className="card mb-4 bg-gradient-to-br from-[#16a35a] to-[#0f7142] text-white">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-white/70" />
            <p className="text-xs text-white/70">Available Balance</p>
          </div>
          <p className="text-2xl font-bold">₱ {formatCurrency(profile?.wallet_balance || 0)}</p>
        </div>

        <div className="card mb-4 bg-[#fff8eb] border border-[#ef9100]/30 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ef9100]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle size={16} className="text-[#ef9100]" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#323643]">Important — Read before paying</p>
            <p className="text-[11px] text-[#9babc6] mt-0.5">
              Scan the QR code for your chosen method, pay the exact amount, then upload a screenshot of your
              proof of payment. Your balance is credited after admin verifies the payment.
            </p>
          </div>
        </div>

        {!showPayment ? (
          <>
            <div className="card mb-4">
              <h3 className="text-sm font-semibold text-[#323643] mb-3">1. Choose Payment Method</h3>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      method === m.id ? 'border-[#16a35a] bg-[#e6f7ee]' : 'border-[#dfe5f0]'
                    }`}
                  >
                    <m.icon size={20} style={{ color: m.color }} />
                    <div className="text-left">
                      <p className="text-xs font-medium text-[#323643]">{m.label}</p>
                      <p className="text-[9px] text-[#9babc6]">{m.network}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card mb-4">
              <h3 className="text-sm font-semibold text-[#323643] mb-3">2. Select Amount</h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(String(amt))}
                    className={`py-2 rounded-xl text-sm font-medium transition-all ${
                      amount === String(amt)
                        ? 'bg-[#16a35a] text-white'
                        : 'bg-[#f0f3f8] text-[#323643]'
                    }`}
                  >
                    ₱{amt}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#9babc6] mb-1">Or Enter Custom Amount</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9babc6] font-medium">₱</span>
                <input
                  type="number"
                  className="input-field pl-8"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-[#9babc6] mt-1">Minimum ₱200</p>
            </div>

            <button onClick={handleProceed} className="btn-primary w-full flex items-center justify-center gap-2">
              <QrCode size={18} />
              Show Payment Details
            </button>
          </>
        ) : (
          <>
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <SelectedIcon size={20} style={{ color: selectedMethod.color }} />
                  <div>
                    <p className="text-sm font-semibold text-[#323643]">{selectedMethod.label}</p>
                    <p className="text-[10px] text-[#9babc6]">{selectedMethod.network}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-[#16a35a]">₱{formatCurrency(parseFloat(amount) || 0)}</span>
              </div>

              <div className="flex flex-col items-center py-4 bg-[#f8faff] rounded-xl border border-[#dfe5f0]">
                <div className="bg-white p-3 rounded-2xl shadow-sm">
                  <img
                    src={selectedMethod.qrImage}
                    alt={`${selectedMethod.label} payment QR code`}
                    className="w-56 h-auto rounded-lg"
                  />
                </div>
                <p className="text-[10px] text-[#9babc6] mt-3 flex items-center gap-1">
                  <QrCode size={12} /> Scan to pay with {selectedMethod.label}
                </p>
              </div>
            </div>

            {selectedMethod.address && (
              <div className="card mb-4">
                <p className="text-[10px] font-medium text-[#9babc6] uppercase tracking-wide mb-1">
                  {isMobileWallet ? 'Mobile Number' : 'Wallet Address'}
                </p>
                <div className="flex items-center gap-2 bg-[#f0f3f8] rounded-xl p-3">
                  <p className="text-xs font-mono text-[#323643] flex-1 break-all">{selectedMethod.address}</p>
                  <button
                    onClick={copyAddress}
                    aria-label="Copy address"
                    className="flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-[#dfe5f0] hover:border-[#16a35a] transition-colors"
                  >
                    {copied ? <Check size={14} className="text-[#16a35a]" /> : <Copy size={14} className="text-[#9babc6]" />}
                  </button>
                </div>
                <p className="text-[10px] text-[#ef9100] mt-2 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {selectedMethod.note}
                </p>
              </div>
            )}

            <div className="card mb-4">
              <h3 className="text-sm font-semibold text-[#323643] mb-3 flex items-center gap-2">
                <Upload size={16} className="text-[#2979ff]" />
                Upload Payment Proof
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-medium text-[#9babc6] uppercase tracking-wide mb-1">
                    Screenshot of payment (required)
                  </p>
                  {proofPreview ? (
                    <div className="relative rounded-xl border border-[#dfe5f0] bg-[#f8faff] p-2">
                      <img src={proofPreview} alt="Proof of payment preview" className="w-full max-h-64 object-contain rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setProofFile(null)}
                        aria-label="Remove proof image"
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow border border-[#dfe5f0]"
                      >
                        <X size={14} className="text-[#323643]" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-[#dfe5f0] bg-[#f8faff] cursor-pointer hover:border-[#16a35a] transition-colors">
                      <ImagePlus size={24} className="text-[#9babc6]" />
                      <span className="text-xs font-medium text-[#323643]">Tap to upload a photo</span>
                      <span className="text-[10px] text-[#9babc6]">JPG, PNG or WEBP, up to 5 MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleProofChange}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-medium text-[#9babc6] uppercase tracking-wide flex items-center gap-1 mb-1">
                    <FileText size={12} /> Reference Number
                    {isMobileWallet ? ' (GCash/PayMaya ref)' : ' (optional)'}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter reference number"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>

                {!isMobileWallet && (
                  <div>
                    <label className="text-[10px] font-medium text-[#9babc6] uppercase tracking-wide flex items-center gap-1 mb-1">
                      <Link2 size={12} /> Transaction Hash / TXID (optional)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Paste transaction hash"
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <p className="text-[10px] text-[#9babc6] mt-3">
                Upload a screenshot and enter a reference number or transaction hash so admin can verify your payment.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>

            <button
              onClick={() => setShowPayment(false)}
              disabled={loading}
              className="btn-outline w-full mt-3"
            >
              Back to Payment Methods
            </button>
          </>
        )}

        <button
          onClick={() => navigate('/wallet/recharge-record')}
          className="btn-outline w-full mt-3"
        >
          View Recharge Records
        </button>
      </div>
    </AppLayout>
  );
}
