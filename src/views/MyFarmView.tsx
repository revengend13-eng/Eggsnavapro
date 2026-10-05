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
  const pendingFlocks = userPlans.filter(p => p.status === 'PENDING');

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
            My Digital Farm Roosts
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Monitor nesting hens, daily egg yields, flock activations, and harvest schedules.
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

      {/* PENDING FLOCKS AWAITING DEPOSIT / APPROVAL */}
      {pendingFlocks.length > 0 && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400 animate-spin" />
              <h3 className="text-lg font-black text-white font-['Outfit']">
                Flocks Awaiting Activation ({pendingFlocks.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-500/30">
              Pending Admin Verification
            </span>
          </div>
          <p className="text-xs text-slate-300">
            These flock plans were reserved. Once your linked deposit is approved by the Owner/Admin team, your hens immediately start nesting and laying eggs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {pendingFlocks.map(flock => {
              const henCount = flock.henQuantity || 1;
              return (
                <div
                  key={flock.id}
                  className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      RESERVATION #{flock.id.slice(0, 6)}
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase animate-pulse">
                      AWAITING APPROVAL
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <HenIllustration color={flock.henColor || '#f59e0b'} size={40} image={flock.henImage} quantity={henCount} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{flock.planName}</h4>
                      <p className="text-xs text-amber-400 font-bold">🐔 {henCount} {henCount === 1 ? 'Hen' : 'Hens'}</p>
                      <p className="text-[11px] text-emerald-400 font-bold font-mono">{flock.purchasePrice.toLocaleString()} PKR</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 text-[11px] text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cycle Duration:</span>
                      <span className="font-bold text-white">{flock.cycleDays} Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expected Daily Yield:</span>
                      <span className="font-bold text-amber-400">{flock.dailyEggs} Eggs / Day</span>
                    </div>
                  </div>

                  {flock.depositId ? (
                    <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Deposit submitted! Awaiting Owner/Admin review.</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sessionStorage.setItem('pending_deposit_plan', JSON.stringify({
                          userPlanId: flock.id,
                          planId: flock.planId,
                          planName: flock.planName,
                          price: flock.purchasePrice,
                          henQuantity: henCount,
                          dailyEggs: flock.dailyEggs
                        }));
                        setCurrentTab('deposit');
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <span>Submit Deposit for this Flock</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flocks Grid or Empty State */}
      {activeFlocks.length === 0 ? (
        <div className="bg-slate-900/60 border border-emerald-500/20 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto shadow-xl">
          <div className="w-20 h-20 rounded-3xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <HenIllustration size={60} color="#f59e0b" />
          </div>
          <h3 className="text-xl font-black text-white font-['Outfit']">
            {pendingFlocks.length > 0 ? 'Flocks Reserved — Awaiting Activation' : 'Your Roosts Are Empty'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {pendingFlocks.length > 0
              ? 'Your reserved hen flocks are listed above. Once the deposit is approved by the admin team, your active coops will appear here immediately.'
              : 'You do not have any active digital hen flocks yet. Acquire your first starter flock to begin harvesting fresh digital eggs every day!'}
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
            const henCount = flock.henQuantity || 1;
            const start = flock.startDate ? new Date(flock.startDate).getTime() : Date.now();
            const end = flock.endDate ? new Date(flock.endDate).getTime() : Date.now() + (flock.cycleDays || 60) * 86400000;
            const totalMs = Math.max(1, end - start);
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
                      <HenIllustration color={flock.henColor || '#f59e0b'} size={50} image={flock.henImage} quantity={henCount} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white font-['Outfit']">
                        {flock.planName}
                      </h4>
                      <p className="text-xs font-bold text-amber-400">
                        🐔 {henCount} {henCount === 1 ? 'Hen' : 'Hens'}
                      </p>
                      <p className="text-[11px] text-slate-400">
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
                      <span>Started: {flock.startDate ? new Date(flock.startDate).toLocaleDateString() : 'Active'}</span>
                      <span>Expires: {flock.endDate ? new Date(flock.endDate).toLocaleDateString() : `${daysLeft}d`} ({daysLeft} Days Left)</span>
                    </div>
                  </div>

                  {/* Flock Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-400 text-[10px] block">Daily Egg Yield</span>
                      <span className="font-extrabold text-white flex items-center gap-1 mt-0.5">
                        <EggIllustration size={14} color="#fef3c7" image={flock.eggImage} />
                        {flock.dailyEggs} {flock.dailyEggs === 1 ? 'Egg' : 'Eggs'} / Day
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
