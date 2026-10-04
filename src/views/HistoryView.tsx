import React, { useState } from 'react';
import { 
  FileText, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShoppingBag, 
  Sparkles, 
  Users, 
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { TransactionType } from '../types';
import { EggIllustration } from '../components/FarmIllustrations';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const HistoryView: React.FC = () => {
  const { transactions } = useFarm();
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = transactions.filter((t) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'DEPOSIT') return t.type === 'DEPOSIT';
    if (filterType === 'WITHDRAWAL') return t.type === 'WITHDRAWAL';
    if (filterType === 'PLANS') return t.type === 'PLAN_PURCHASE';
    if (filterType === 'REWARDS') return t.type === 'REWARD' || t.type === 'REFERRAL_REWARD';
    if (filterType === 'EGGS') return t.type === 'EGG_SALE';
    return true;
  });

  const getIconForType = (type: TransactionType) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'WITHDRAWAL':
        return <ArrowUpRight className="w-4 h-4 text-purple-400" />;
      case 'PLAN_PURCHASE':
        return <ShoppingBag className="w-4 h-4 text-amber-400" />;
      case 'REWARD':
        return <Sparkles className="w-4 h-4 text-teal-400" />;
      case 'REFERRAL_REWARD':
        return <Users className="w-4 h-4 text-rose-400" />;
      case 'EGG_SALE':
        return <EggIllustration size={16} color="#fef3c7" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2">
          <FileText className="w-3.5 h-3.5" />
          <span>Immutable Ledger Audit</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
          Wallet Transaction & Activity History
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
          Complete, tamper-evident record of all deposits, payouts, hen flock activations, daily harvests, and egg sales.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'All Operations' },
          { id: 'DEPOSIT', label: 'Deposits' },
          { id: 'WITHDRAWAL', label: 'Withdrawals' },
          { id: 'PLANS', label: 'Flock Purchases' },
          { id: 'REWARDS', label: 'Rewards & Commissions' },
          { id: 'EGGS', label: 'Egg Sales' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === tab.id
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No transaction records found matching this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tx) => {
              const isCredit = tx.direction === 'CREDIT';

              return (
                <div
                  key={tx.id}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      {getIconForType(tx.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm font-['Outfit']">
                          {tx.description}
                        </span>
                        <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-mono">
                          {tx.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono space-x-2 mt-0.5">
                        <span>Ref: {tx.referenceId || tx.id.slice(0, 10)}</span>
                        <span>•</span>
                        <span>{new Date(tx.createdAt).toLocaleString()}</span>
                      </div>
                      {tx.adminNote && (
                        <p className="text-[11px] text-amber-400/90 mt-1 italic">
                          Note: {tx.adminNote}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span
                      className={`text-base font-black font-['Outfit'] block ${
                        isCredit ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {isCredit ? '+' : '-'}{tx.amount.toLocaleString()} PKR
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        tx.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : tx.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DisclaimerBanner variant="compact" />
    </div>
  );
};
