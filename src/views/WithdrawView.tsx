import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  FileText,
  HelpCircle
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { PaymentMethod, WithdrawalRequest } from '../types';
import { EasypaisaBadge, JazzCashBadge } from '../components/FarmIllustrations';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

interface Props {
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const WithdrawView: React.FC<Props> = ({ setCurrentTab, openAuthModal }) => {
  const { currentUser } = useAuth();
  const { wallet, settings, submitWithdrawal } = useFarm();

  const [method, setMethod] = useState<PaymentMethod>('EASYPAISA');
  const [amount, setAmount] = useState<string>('500');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountTitle, setAccountTitle] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // User's own withdrawal history
  const [myWithdrawals, setMyWithdrawals] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'withdrawals'),
      where('userId', '==', currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: WithdrawalRequest[] = [];
      snap.forEach((d) => list.push(d.data() as WithdrawalRequest));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyWithdrawals(list);
    });

    return () => unsub();
  }, [currentUser]);

  const numAmount = parseFloat(amount) || 0;
  const feePercent = settings.withdrawalFeePercent || 5;
  const calculatedFee = Math.round(numAmount * (feePercent / 100));
  const netPayout = Math.max(0, numAmount - calculatedFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal();
      return;
    }

    if (numAmount < settings.minWithdrawal || numAmount > settings.maxWithdrawal) {
      setFeedback({
        type: 'error',
        message: `Withdrawal amount must be between ${settings.minWithdrawal.toLocaleString()} PKR and ${settings.maxWithdrawal.toLocaleString()} PKR.`
      });
      return;
    }

    if ((wallet?.balance || 0) < numAmount) {
      setFeedback({
        type: 'error',
        message: `Insufficient confirmed balance. You have ${(wallet?.balance || 0).toLocaleString()} PKR available.`
      });
      return;
    }

    if (!accountNumber.trim() || !accountTitle.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please provide both your registered Account Number and exact Account Title.'
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const res = await submitWithdrawal(
      numAmount,
      method,
      accountNumber.trim(),
      accountTitle.trim()
    );

    if (res.success) {
      setFeedback({
        type: 'success',
        message: res.message
      });
      setAccountNumber('');
      setAccountTitle('');
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
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-purple-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider mb-2">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Secure Payout Portal</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
          Withdraw Confirmed PKR
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
          Request payout of your available wallet balance directly to your Easypaisa or JazzCash mobile account.
        </p>
      </div>

      {/* Available Balance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-emerald-500/30 p-5 rounded-3xl">
          <span className="text-xs text-slate-400 font-semibold block">Available Withdrawable Balance</span>
          <span className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] mt-1 block">
            {(wallet?.balance || 0).toLocaleString()} <span className="text-xs font-bold text-emerald-400">PKR</span>
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl">
          <span className="text-xs text-slate-400 font-semibold block">Pending Payouts Locked</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-400 font-['Outfit'] mt-1 block">
            {(wallet?.pendingWithdrawals || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">PKR</span>
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl">
          <span className="text-xs text-slate-400 font-semibold block">Platform Fee & Threshold</span>
          <div className="mt-1 text-xs text-slate-300 space-y-0.5">
            <p>Min Payout: <strong>{settings.minWithdrawal.toLocaleString()} PKR</strong></p>
            <p>Processing Fee: <strong>{feePercent}%</strong></p>
          </div>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Method Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Payout Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('EASYPAISA')}
                className={`p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  method === 'EASYPAISA'
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/30 shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <EasypaisaBadge />
              </button>

              <button
                type="button"
                onClick={() => setMethod('JAZZCASH')}
                className={`p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  method === 'JAZZCASH'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-300 ring-2 ring-amber-500/30 shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <JazzCashBadge />
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs font-semibold">
              <label className="text-slate-300">Amount to Withdraw (PKR)</label>
              <button
                type="button"
                onClick={() => setAmount(String(wallet?.balance || 0))}
                className="text-emerald-400 hover:text-emerald-300 font-bold"
              >
                Max Balance
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                min={settings.minWithdrawal}
                max={settings.maxWithdrawal}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {method} Mobile Account Number
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="03XXXXXXXXX"
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Registered Account Title / Name
              </label>
              <input
                type="text"
                required
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                placeholder="Full name as on CNIC/App"
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Fee & Net Payout Calculation Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/20 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Gross Withdrawal:</span>
              <span className="font-bold text-white">{numAmount.toLocaleString()} PKR</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Platform Processing Fee ({feePercent}%):</span>
              <span className="font-bold text-red-400">-{calculatedFee.toLocaleString()} PKR</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-800 text-sm font-black">
              <span className="text-emerald-300">Net Estimated Payout:</span>
              <span className="text-emerald-400 font-['Outfit']">{netPayout.toLocaleString()} PKR</span>
            </div>
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
            disabled={submitting || (wallet?.balance || 0) < numAmount || numAmount < settings.minWithdrawal}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{submitting ? 'Submitting Request...' : `Confirm Withdrawal Request (${numAmount.toLocaleString()} PKR)`}</span>
          </button>
        </form>
      </div>

      {/* Withdrawal History */}
      <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-black text-white font-['Outfit'] flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>My Withdrawal Request History</span>
        </h3>

        {myWithdrawals.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No withdrawal requests made yet.
          </p>
        ) : (
          <div className="space-y-3">
            {myWithdrawals.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm font-['Outfit']">
                      -{item.amount.toLocaleString()} PKR
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 border border-purple-500/30 text-purple-300">
                      {item.method}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Net: {item.netAmount.toLocaleString()} PKR)
                    </span>
                  </div>
                  <div className="text-slate-400 space-x-2 mt-1 font-mono text-[11px]">
                    <span>Account: {item.accountNumber}</span>
                    <span>•</span>
                    <span>Title: {item.accountTitle}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase border tracking-wider ${
                      item.status === 'PAID'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : item.status === 'REJECTED'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : item.status === 'PROCESSING'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    }`}
                  >
                    {item.status}
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
