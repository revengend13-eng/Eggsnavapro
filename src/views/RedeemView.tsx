import React, { useState } from 'react';
import { 
  Egg, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Wallet,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { EggIllustration } from '../components/FarmIllustrations';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

interface Props {
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const RedeemView: React.FC<Props> = ({ setCurrentTab, openAuthModal }) => {
  const { currentUser } = useAuth();
  const { wallet, plans, sellEggs } = useFarm();

  const availableEggs = wallet?.availableEggs || 0;
  // Standard egg redemption rate from active plan or default 40 PKR
  const eggRate = plans.find(p => p.status === 'ACTIVE')?.eggValuePkr || 40;

  const [eggCount, setEggCount] = useState<number>(availableEggs > 0 ? availableEggs : 0);
  const [redeeming, setRedeeming] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const estimatedPkr = eggCount * eggRate;

  const handlePreset = (fraction: number) => {
    setEggCount(Math.floor(availableEggs * fraction));
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal();
      return;
    }

    if (eggCount <= 0 || eggCount > availableEggs) {
      setFeedback({
        type: 'error',
        message: 'Please specify a valid quantity of eggs from your inventory.'
      });
      return;
    }

    setRedeeming(true);
    setFeedback(null);

    const res = await sellEggs(eggCount);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: res.message
      });
      setEggCount(0);
    } else {
      setFeedback({
        type: 'error',
        message: res.message
      });
    }
    setRedeeming(false);
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Digital Egg Redemption Marketplace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
            Sell / Redeem Harvested Eggs
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
            Convert your collected digital eggs into confirmed PKR wallet balance at the official platform redemption rate.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 text-center shrink-0">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">
            Official Exchange Rate
          </span>
          <span className="text-xl font-black text-amber-400 font-['Outfit']">
            1 Egg = {eggRate} PKR
          </span>
        </div>
      </div>

      {/* Main Redeem Form */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Quick Inventory Summary */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-emerald-500/20 text-xs">
          <div>
            <span className="text-slate-400 block -mb-0.5">Available in Inventory</span>
            <span className="text-xl font-black text-amber-400 font-['Outfit']">
              {availableEggs.toLocaleString()} Eggs
            </span>
          </div>
          <div>
            <span className="text-slate-400 block -mb-0.5">Current Confirmed Balance</span>
            <span className="text-xl font-black text-white font-['Outfit']">
              {(wallet?.balance || 0).toLocaleString()} PKR
            </span>
          </div>
        </div>

        <form onSubmit={handleRedeem} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2 text-xs font-semibold">
              <label className="text-slate-300">Enter Number of Eggs to Redeem</label>
              <button
                type="button"
                onClick={() => handlePreset(1.0)}
                className="text-emerald-400 hover:text-emerald-300 font-bold"
              >
                Max ({availableEggs})
              </button>
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                max={availableEggs}
                value={eggCount === 0 ? '' : eggCount}
                onChange={(e) => setEggCount(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-2xl px-5 py-4 text-xl font-black text-white focus:outline-none focus:border-emerald-400 transition"
              />
              <span className="absolute right-5 top-5 text-xs text-amber-400 font-bold">
                EGGS
              </span>
            </div>

            {/* Quick Percentage Presets */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[0.25, 0.5, 0.75, 1.0].map((frac) => (
                <button
                  key={frac}
                  type="button"
                  onClick={() => handlePreset(frac)}
                  className="py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition"
                >
                  {frac * 100}%
                </button>
              ))}
            </div>
          </div>

          {/* Conversion Output Box */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-emerald-300 font-semibold block">You Will Receive (Credited to Wallet)</span>
              <p className="text-[11px] text-slate-400">{eggCount} Eggs × {eggRate} PKR</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400 font-['Outfit']">
                +{estimatedPkr.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-300 ml-1">PKR</span>
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
            disabled={redeeming || availableEggs === 0 || eggCount <= 0 || eggCount > availableEggs}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{redeeming ? 'Redeeming Eggs...' : `Redeem for ${estimatedPkr.toLocaleString()} PKR`}</span>
          </button>
        </form>
      </div>

      <DisclaimerBanner variant="compact" />
    </div>
  );
};
