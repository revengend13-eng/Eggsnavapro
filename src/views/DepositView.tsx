import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  FileText,
  UploadCloud,
  ChevronRight
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { PaymentMethod, DepositRequest } from '../types';
import { EasypaisaBadge, JazzCashBadge } from '../components/FarmIllustrations';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

interface Props {
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const DepositView: React.FC<Props> = ({ setCurrentTab, openAuthModal }) => {
  const { currentUser } = useAuth();
  const { settings, submitDeposit } = useFarm();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('EASYPAISA');
  const [amount, setAmount] = useState<string>('500');
  const [senderAccount, setSenderAccount] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [copiedNumber, setCopiedNumber] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // User's own deposit requests history
  const [myDeposits, setMyDeposits] = useState<DepositRequest[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'deposits'),
      where('userId', '==', currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: DepositRequest[] = [];
      snap.forEach((d) => list.push(d.data() as DepositRequest));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyDeposits(list);
    });

    return () => unsub();
  }, [currentUser]);

  const activeAccountNumber = selectedMethod === 'EASYPAISA' 
    ? settings.easypaisaNumber 
    : settings.jazzcashNumber;

  const activeAccountTitle = selectedMethod === 'EASYPAISA' 
    ? settings.easypaisaTitle 
    : settings.jazzcashTitle;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(activeAccountNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal();
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < settings.minDeposit || numAmount > settings.maxDeposit) {
      setFeedback({
        type: 'error',
        message: `Deposit amount must be between ${settings.minDeposit.toLocaleString()} PKR and ${settings.maxDeposit.toLocaleString()} PKR.`
      });
      return;
    }

    if (!senderAccount.trim() || !transactionId.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please provide both your sender mobile account number and the Transaction ID (TID).'
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const res = await submitDeposit(
      numAmount,
      selectedMethod,
      senderAccount.trim(),
      transactionId.trim(),
      proofUrl.trim() || undefined,
      notes.trim() || undefined
    );

    if (res.success) {
      setFeedback({
        type: 'success',
        message: res.message
      });
      setTransactionId('');
      setNotes('');
      setProofUrl('');
    } else {
      setFeedback({
        type: 'error',
        message: res.message
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2">
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Real-Money Deposit Portal</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
          Deposit Confirmed PKR Funds
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
          Transfer funds via Easypaisa or JazzCash to acquire digital hen flocks. All transactions are securely audited and credited upon manual or automated confirmation.
        </p>
      </div>

      {/* Payment Channel Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Easypaisa Card */}
        <div
          onClick={() => setSelectedMethod('EASYPAISA')}
          className={`p-5 rounded-3xl border cursor-pointer transition shadow-xl relative ${
            selectedMethod === 'EASYPAISA'
              ? 'bg-emerald-950/80 border-emerald-400 shadow-emerald-500/10 ring-2 ring-emerald-500/30'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <EasypaisaBadge />
            {selectedMethod === 'EASYPAISA' && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">
                ✓
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">Account Title</p>
          <h4 className="text-sm font-black text-white font-['Outfit']">{settings.easypaisaTitle}</h4>
          <p className="text-xs text-slate-400 mt-2">Mobile Account Number</p>
          <p className="text-base font-black text-emerald-400 tracking-wider font-mono">
            {settings.easypaisaNumber}
          </p>
        </div>

        {/* JazzCash Card */}
        <div
          onClick={() => setSelectedMethod('JAZZCASH')}
          className={`p-5 rounded-3xl border cursor-pointer transition shadow-xl relative ${
            selectedMethod === 'JAZZCASH'
              ? 'bg-amber-950/80 border-amber-400 shadow-amber-500/10 ring-2 ring-amber-500/30'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <JazzCashBadge />
            {selectedMethod === 'JAZZCASH' && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                ✓
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">Account Title</p>
          <h4 className="text-sm font-black text-white font-['Outfit']">{settings.jazzcashTitle}</h4>
          <p className="text-xs text-slate-400 mt-2">Mobile Account Number</p>
          <p className="text-base font-black text-amber-400 tracking-wider font-mono">
            {settings.jazzcashNumber}
          </p>
        </div>
      </div>

      {/* Transfer Information Box */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Active Transfer Recipient</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-black text-white font-mono tracking-wider">{activeAccountNumber}</span>
              <button
                onClick={handleCopyNumber}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
              >
                {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNumber ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-xs text-emerald-400 mt-1">Title: {activeAccountTitle}</p>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="text-slate-400 block font-medium">Limits Allowed</span>
            <span className="text-white font-bold">Min: {settings.minDeposit.toLocaleString()} PKR</span>
            <span className="text-slate-500 block">Max: {settings.maxDeposit.toLocaleString()} PKR</span>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/20 text-xs text-slate-300 space-y-1 whitespace-pre-line leading-relaxed">
          {settings.depositInstructions}
        </div>

        {/* Deposit Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount Sent (PKR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={settings.minDeposit}
                  max={settings.maxDeposit}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                  className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400 font-bold"
                />
                <span className="absolute right-4 top-3.5 text-xs text-emerald-400 font-bold">
                  PKR
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sender Mobile / Account Number
              </label>
              <input
                type="text"
                required
                value={senderAccount}
                onChange={(e) => setSenderAccount(e.target.value)}
                placeholder="e.g. 03451234567"
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transaction ID (TID / Trx ID)
              </label>
              <input
                type="text"
                required
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. 29384759281"
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Optional Screenshot / Proof Link
              </label>
              <input
                type="url"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://imgur.com/... or receipt link"
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Additional Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sent from Ali Easypaisa app"
              className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          {feedback && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/80 border border-red-500/40 text-red-300'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>{submitting ? 'Submitting Request...' : `Submit Deposit of ${amount || '0'} PKR`}</span>
          </button>
        </form>
      </div>

      {/* User's Deposit History Section */}
      <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-black text-white font-['Outfit'] flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>My Recent Deposit Requests</span>
        </h3>

        {myDeposits.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No deposits requested yet. Submissions will display here with live status auditing updates.
          </p>
        ) : (
          <div className="space-y-3">
            {myDeposits.map((dep) => (
              <div
                key={dep.id}
                className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm font-['Outfit']">
                      +{dep.amount.toLocaleString()} PKR
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                      {dep.method}
                    </span>
                  </div>
                  <div className="text-slate-400 space-x-2 mt-1 font-mono text-[11px]">
                    <span>TID: {dep.transactionId}</span>
                    <span>•</span>
                    <span>Sender: {dep.senderAccount}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(dep.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase border tracking-wider ${
                      dep.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : dep.status === 'REJECTED'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    }`}
                  >
                    {dep.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DisclaimerBanner variant="compact" />
    </div>
  );
};
