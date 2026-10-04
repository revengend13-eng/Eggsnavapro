import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShoppingBag, 
  Layers, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { HenIllustration, EggIllustration, EasypaisaBadge, JazzCashBadge } from '../components/FarmIllustrations';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { MarqueeBanner } from '../components/MarqueeBanner';

interface Props {
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const HomeView: React.FC<Props> = ({ setCurrentTab, openAuthModal }) => {
  const { currentUser, userProfile } = useAuth();
  const { 
    wallet, 
    plans, 
    userPlans, 
    activeHensCount, 
    availableHarvestCount, 
    totalEggsHarvested,
    collectEggs,
    claimDailyCheckin 
  } = useFarm();

  const starterPlan = plans.find(p => p.id === 'plan_01') || plans[0];

  return (
    <div className="space-y-5 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      <MarqueeBanner />

      {/* Top Hero Balance & Farm Stats Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 border border-emerald-500/30 p-5 sm:p-7 shadow-2xl">
        {/* Subtle background ambient farm glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
                Digital Roost Overview
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                Season 01 Live
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">Available Confirmed Balance</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight">
                  {(wallet?.balance || 0).toLocaleString()}
                </span>
                <span className="text-emerald-400 font-bold text-lg">PKR</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="bg-slate-900/80 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <EggIllustration size={20} color="#fef3c7" />
                <div>
                  <span className="text-[10px] text-slate-400 block -mb-1">Available Eggs</span>
                  <span className="font-extrabold text-sm text-white font-['Outfit']">
                    {(wallet?.availableEggs || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  🐔
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block -mb-1">Active Hens</span>
                  <span className="font-extrabold text-sm text-white font-['Outfit']">
                    {activeHensCount} Flocks
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
            {currentUser ? (
              <>
                <button
                  onClick={() => setCurrentTab('deposit')}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Deposit PKR</span>
                </button>
                <button
                  onClick={() => setCurrentTab('withdraw')}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Withdraw</span>
                </button>
              </>
            ) : (
              <button
                onClick={openAuthModal}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2"
              >
                <span>Get Started Now</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pending Ledger Indicators if any */}
        {((wallet?.pendingDeposits || 0) > 0 || (wallet?.pendingWithdrawals || 0) > 0) && (
          <div className="mt-5 pt-4 border-t border-emerald-500/20 flex flex-wrap gap-4 text-xs">
            {(wallet?.pendingDeposits || 0) > 0 && (
              <div className="flex items-center gap-2 text-amber-300 bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-500/30">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Pending Deposit Verification: <strong>{wallet?.pendingDeposits.toLocaleString()} PKR</strong></span>
              </div>
            )}
            {(wallet?.pendingWithdrawals || 0) > 0 && (
              <div className="flex items-center gap-2 text-cyan-300 bg-cyan-950/40 px-3 py-1 rounded-lg border border-cyan-500/30">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Pending Payout Processing: <strong>{wallet?.pendingWithdrawals.toLocaleString()} PKR</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Harvest Pasture Callout Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-emerald-950/80 border border-amber-500/30 p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <EggIllustration size={44} color="#fef3c7" count={availableHarvestCount > 0 ? availableHarvestCount : undefined} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Daily Roost Harvest</span>
              {availableHarvestCount > 0 && (
                <span className="text-[10px] bg-red-500 text-white font-black px-1.5 py-0.2 rounded-full animate-bounce">
                  READY
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-white font-['Outfit'] mt-0.5">
              {availableHarvestCount > 0 
                ? `${availableHarvestCount} Digital Eggs Ready to Harvest!` 
                : (activeHensCount > 0 ? 'Hens Are Nesting in the Coops' : 'Set Up Your First Hen Flock')}
            </h3>
            <p className="text-xs text-slate-300">
              {availableHarvestCount > 0 
                ? 'Collect your freshly laid digital eggs now and redeem them into your confirmed balance.'
                : 'Each active hen plan produces digital eggs daily that can be collected and redeemed.'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {availableHarvestCount > 0 ? (
            <button
              onClick={() => setCurrentTab('collect')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Collect Eggs Now</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentTab(activeHensCount > 0 ? 'my-farm' : 'plans')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-900/50 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <span>{activeHensCount > 0 ? 'View My Farm' : 'Explore Hen Plans'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Navigation 6-Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: 'plans', title: 'Buy Hens', subtitle: '30 Flock Plans', icon: ShoppingBag, color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400' },
          { id: 'my-farm', title: 'My Farm', subtitle: `${activeHensCount} Active Coops`, icon: Layers, color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400' },
          { id: 'collect', title: 'Collect Eggs', subtitle: `${availableHarvestCount} Harvestable`, icon: Sparkles, color: 'from-teal-500/20 to-teal-600/10 border-teal-500/30 text-teal-300' },
          { id: 'deposit', title: 'Deposit PKR', subtitle: 'Easypaisa / JazzCash', icon: ArrowDownLeft, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400' },
          { id: 'withdraw', title: 'Withdraw', subtitle: 'Instant Audit', icon: ArrowUpRight, color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400' },
          { id: 'team', title: 'Referral Team', subtitle: 'Earn Commissions', icon: Users, color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400' },
        ].map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`p-4 rounded-2xl bg-gradient-to-br ${item.color} bg-slate-900/60 border cursor-pointer hover:scale-[1.02] active:scale-95 transition shadow-lg group`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-950/60 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                <IconComp className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white font-['Outfit']">{item.title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Featured Starter Plan Showcase */}
      {starterPlan && (
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                  Featured Starter Flock
                </span>
                <span className="text-xs text-emerald-400 font-semibold">Ready for Purchase</span>
              </div>
              <h3 className="text-xl font-black text-white font-['Outfit'] mt-1">
                {starterPlan.name}
              </h3>
              <p className="text-xs text-slate-400">
                Resilient digital layer bred for consistent daily nest harvesting.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block font-medium">Activation Price</span>
              <span className="text-2xl font-black text-white font-['Outfit']">
                {starterPlan.price.toLocaleString()} <span className="text-sm font-bold text-emerald-400">PKR</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-950/60 p-4 rounded-2xl border border-emerald-500/20">
            <div className="flex items-center justify-center p-3">
              <HenIllustration color={starterPlan.henColor} size={90} animating />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Flock Cycle:</span>
                <span className="font-bold text-white">{starterPlan.cycleDays} Days</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Daily Egg Yield:</span>
                <span className="font-bold text-amber-400">{starterPlan.dailyEggs} Egg / Day</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Egg Redemption Value:</span>
                <span className="font-bold text-emerald-400">{starterPlan.eggValuePkr} PKR / Egg</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Total Harvest Potential:</span>
                <span className="font-bold text-white">Up to {starterPlan.cycleDays * starterPlan.dailyEggs} Eggs</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => setCurrentTab('plans')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
              >
                <span>View Full Details & Buy</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Server-validated transaction ledger. No guaranteed financial returns.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Channels Banner */}
      <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-slate-300">
            Official Pakistan Mobile Payment Rails Supported:
          </span>
        </div>
        <div className="flex items-center gap-3">
          <EasypaisaBadge />
          <JazzCashBadge />
        </div>
      </div>

      {/* Compliance Disclaimer */}
      <DisclaimerBanner variant="full" />
    </div>
  );
};
