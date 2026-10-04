import React, { useState } from 'react';
import { 
  Sparkles, 
  Gift, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Clock, 
  Flame,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { EggIllustration } from '../components/FarmIllustrations';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

interface Props {
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const RewardsView: React.FC<Props> = ({ setCurrentTab, openAuthModal }) => {
  const { currentUser } = useAuth();
  const { claimDailyCheckin, userPlans, wallet, totalEggsHarvested } = useFarm();

  const [claiming, setClaiming] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleClaim = async () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    setClaiming(true);
    setFeedback(null);

    const res = await claimDailyCheckin();
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
    setClaiming(false);
  };

  const hasFlock = userPlans.length > 0;
  const hasHarvested10 = totalEggsHarvested >= 10;
  const hasEggs = (wallet?.availableEggs || 0) > 0;

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-emerald-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-2">
          <Gift className="w-3.5 h-3.5" />
          <span>Farmer Bonus Center</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
          Daily Check-In & Farm Milestones
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
          Check in every day to claim bonus feed rewards and complete farm milestones to boost your digital pasturing experience.
        </p>
      </div>

      {/* Daily Check-In Card */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Flame className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              24-Hour Check-In Streak
            </span>
            <h3 className="text-xl font-black text-white font-['Outfit']">
              Daily +20 PKR Check-In Reward
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Available once every 24 hours. Directly credited to your confirmed balance.
            </p>
          </div>
        </div>

        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{claiming ? 'Claiming...' : 'Claim 20 PKR Now'}</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
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

      {/* Farm Milestones */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <h3 className="text-lg font-black text-white font-['Outfit'] flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Farm Achievements</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
            hasFlock ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">First Flock Breeder</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                hasFlock ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
              }`}>
                {hasFlock ? 'COMPLETED' : 'INCOMPLETE'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">Own at least 1 digital hen flock.</p>
          </div>

          <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
            hasHarvested10 ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Golden Harvester</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                hasHarvested10 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
              }`}>
                {hasHarvested10 ? 'COMPLETED' : 'INCOMPLETE'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">Harvest 10+ digital eggs in your farm.</p>
          </div>
        </div>
      </div>

      <DisclaimerBanner variant="compact" />
    </div>
  );
};
