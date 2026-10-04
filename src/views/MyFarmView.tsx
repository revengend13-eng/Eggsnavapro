import React from 'react';
import { 
  Layers, 
  Sparkles, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  PlusCircle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { HenIllustration, EggIllustration, FarmBarnIcon } from '../components/FarmIllustrations';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

interface Props {
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const MyFarmView: React.FC<Props> = ({ setCurrentTab, openAuthModal }) => {
  const { currentUser } = useAuth();
  const { userPlans, collectEggs, availableHarvestCount } = useFarm();

  const activeFlocks = userPlans.filter(p => p.status === 'ACTIVE');

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <FarmBarnIcon size={14} />
            <span>Digital Coops & Roosts</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
            My Active Farm Roosts
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Monitor nesting hens, daily egg yields, and individual flock cycle progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('plans')}
            className="px-4 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add More Hens</span>
          </button>
          {availableHarvestCount > 0 && (
            <button
              onClick={() => setCurrentTab('collect')}
              className="px-4 py-3 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:bg-amber-300 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Harvest ({availableHarvestCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Flocks Grid or Empty State */}
      {activeFlocks.length === 0 ? (
        <div className="bg-slate-900/60 border border-emerald-500/20 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto shadow-xl">
          <div className="w-20 h-20 rounded-3xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <HenIllustration size={60} color="#f59e0b" />
          </div>
          <h3 className="text-xl font-black text-white font-['Outfit']">
            Your Roosts Are Empty
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            You do not have any active digital hen flocks yet. Acquire your first starter flock to begin harvesting fresh digital eggs every day!
          </p>
          <div className="pt-2">
            <button
              onClick={() => setCurrentTab('plans')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 transition inline-flex items-center gap-2"
            >
              <span>Explore Hen Plans</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeFlocks.map((flock) => {
            const start = new Date(flock.startDate).getTime();
            const end = new Date(flock.endDate).getTime();
            const totalMs = end - start;
            const elapsedMs = Math.max(0, Date.now() - start);
            const progressPercent = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
            const daysLeft = Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)));

            return (
              <div
                key={flock.id}
                className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-5 shadow-xl hover:border-emerald-400/50 transition flex flex-col justify-between"
              >
                <div>
                  {/* Coop Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      COOP #{flock.id.slice(0, 6)}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-black">
                      ACTIVE ROOST
                    </span>
                  </div>

                  {/* Visual Hen & Title */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <HenIllustration color={flock.henColor || '#f59e0b'} size={50} image={flock.henImage} quantity={flock.henQuantity} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white font-['Outfit']">
                        {flock.planName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Breed: {flock.henType || 'Heritage Layer'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar of Cycle */}
                  <div className="space-y-1.5 mb-4 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Cycle Progress:</span>
                      <span className="text-emerald-400">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Started: {new Date(flock.startDate).toLocaleDateString()}</span>
                      <span>{daysLeft} Days Left</span>
                    </div>
                  </div>

                  {/* Flock Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-400 text-[10px] block">Daily Egg Yield</span>
                      <span className="font-extrabold text-white flex items-center gap-1 mt-0.5">
                        <EggIllustration size={14} color="#fef3c7" />
                        {flock.dailyEggs} Egg / Day
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-400 text-[10px] block">Total Harvested</span>
                      <span className="font-extrabold text-amber-400 mt-0.5 block">
                        {flock.eggsCollectedTotal || 0} Eggs
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentTab('collect')}
                  className="w-full py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Go to Harvest Pasture</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimers */}
      <DisclaimerBanner variant="compact" />
    </div>
  );
};
