import React, { useState } from 'react';
import { 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Filter,
  Lock,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { HenPlan } from '../types';
import { HenIllustration, EggIllustration } from '../components/FarmIllustrations';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

interface Props {
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const PlansView: React.FC<Props> = ({ setCurrentTab, openAuthModal }) => {
  const { currentUser } = useAuth();
  const { plans, wallet, buyPlan, createPendingUserPlan } = useFarm();

  const [selectedPlan, setSelectedPlan] = useState<HenPlan | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [buying, setBuying] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | '1-10' | '11-25' | '26-50' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const displayedPlans = plans.filter(p => {
    // Range filters
    if (filterMode === 'active' && p.status !== 'ACTIVE') return false;
    if (filterMode === '1-10' && (p.planNumber < 1 || p.planNumber > 10)) return false;
    if (filterMode === '11-25' && (p.planNumber < 11 || p.planNumber > 25)) return false;
    if (filterMode === '26-50' && (p.planNumber < 26 || p.planNumber > 50)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchNumber = String(p.planNumber) === q;
      const matchHens = `${p.henQuantity || p.planNumber}`.includes(q) || `${p.henQuantity || p.planNumber} hen`.includes(q);
      const matchType = (p.henType || '').toLowerCase().includes(q);
      const matchPrice = String(p.price).includes(q);
      return matchName || matchNumber || matchHens || matchType || matchPrice;
    }

    return true;
  });

  const handlePayViaDeposit = async () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    if (!selectedPlan) return;

    if (!agreedToTerms) {
      setPurchaseStatus({
        type: 'error',
        message: 'Please accept the digital farm rules and terms before proceeding.'
      });
      return;
    }

    setBuying(true);
    setPurchaseStatus(null);

    const result = await createPendingUserPlan(selectedPlan);

    if (result.success && result.userPlanId) {
      // Store in sessionStorage so DepositView picks it up directly
      sessionStorage.setItem('pending_deposit_plan', JSON.stringify({
        userPlanId: result.userPlanId,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        price: selectedPlan.price,
        henQuantity: selectedPlan.henQuantity || selectedPlan.planNumber,
        dailyEggs: selectedPlan.dailyEggs
      }));

      setPurchaseStatus({
        type: 'success',
        message: `${selectedPlan.name} reserved! Redirecting to deposit portal...`
      });

      setTimeout(() => {
        setSelectedPlan(null);
        setAgreedToTerms(false);
        setPurchaseStatus(null);
        setCurrentTab('deposit');
      }, 1000);
    } else {
      setPurchaseStatus({
        type: 'error',
        message: result.message
      });
    }
    setBuying(false);
  };

  const handleBuyWithBalance = async () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    if (!selectedPlan) return;

    if (!agreedToTerms) {
      setPurchaseStatus({
        type: 'error',
        message: 'Please accept the digital farm rules and terms before proceeding.'
      });
      return;
    }

    setBuying(true);
    setPurchaseStatus(null);

    const result = await buyPlan(selectedPlan);

    if (result.success) {
      setPurchaseStatus({
        type: 'success',
        message: result.message
      });
      setTimeout(() => {
        setSelectedPlan(null);
        setAgreedToTerms(false);
        setPurchaseStatus(null);
        setCurrentTab('my-farm');
      }, 1500);
    } else {
      setPurchaseStatus({
        type: 'error',
        message: result.message
      });
    }
    setBuying(false);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Digital Hen Catalog (All 50 Hen Plans Available)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
            Acquire Digital Hens — Plan 1 to Plan 50
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Select your flock scale from Plan 1 (1 Hen for 500 PKR) up to Plan 50 (50 Hens for 25,000 PKR). Each flock nests for a full 60-day cycle, yielding daily digital eggs for manual harvest and balance redemption.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-emerald-500/20">
          {/* Quick Range Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: `All 50 Plans (${plans.length})` },
              { id: '1-10', label: 'Plans 1–10' },
              { id: '11-25', label: 'Plans 11–25' },
              { id: '26-50', label: 'Plans 26–50' },
              { id: 'active', label: `Active (${plans.filter(p => p.status === 'ACTIVE').length})` },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setFilterMode(chip.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  filterMode === chip.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search plan #, hens, or PKR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* Grid of All 50 Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {displayedPlans.map((plan) => {
          const isActive = plan.status === 'ACTIVE';
          const henCount = plan.henQuantity || plan.planNumber;
          const henLabel = henCount === 1 ? '1 Hen' : `${henCount} Hens`;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl border transition shadow-xl relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-400/60 hover:shadow-emerald-500/10'
                  : 'bg-slate-950/60 border-slate-800 opacity-60'
              }`}
            >
              {/* Top Header Badge */}
              <div className="p-4 pb-0 flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-400 font-['Outfit'] bg-slate-950 px-2 py-0.5 rounded-lg border border-amber-500/30">
                    {plan.name}
                  </span>
                  {plan.badge && (
                    <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              {/* Hen Visual & Plan Details */}
              <div className="p-4 text-center space-y-2">
                <div className="h-28 flex items-center justify-center">
                  <HenIllustration 
                    color={plan.henColor} 
                    size={84} 
                    animating={isActive} 
                    quantity={henCount}
                    image={plan.henImage}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-black text-white font-['Outfit']">
                    {plan.name}
                  </h3>
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 mt-0.5">
                    <span>🐔 {henLabel}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {plan.henType || 'Heritage Layer'}
                  </p>
                </div>
              </div>

              {/* Metric Breakdown Table */}
              <div className="px-4 py-3 bg-slate-950/60 border-y border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Price:</span>
                  <span className="text-base font-black text-white font-['Outfit']">
                    {plan.price.toLocaleString()} PKR
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cycle Duration:</span>
                  <span className="font-bold text-white">{plan.cycleDays} Days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Daily Egg Harvest:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <EggIllustration size={16} color={plan.eggColor || '#fef3c7'} image={plan.eggImage} />
                    {plan.dailyEggs} {plan.dailyEggs === 1 ? 'Egg' : 'Eggs'} / Day
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Egg Value:</span>
                  <span className="font-bold text-emerald-400">{plan.eggValuePkr} PKR / Egg</span>
                </div>
              </div>

              {/* BUY NOW Button */}
              <div className="p-4">
                {isActive ? (
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setPurchaseStatus(null);
                      setAgreedToTerms(false);
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>BUY NOW • {plan.price.toLocaleString()} PKR</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-2xl bg-slate-900 text-slate-500 text-xs font-bold text-center flex items-center justify-center gap-1.5 border border-slate-800">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Slot Inactive (Owner Managed)</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Buy Confirmation Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <HenIllustration color={selectedPlan.henColor} size={48} quantity={selectedPlan.henQuantity || selectedPlan.planNumber} image={selectedPlan.henImage} />
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Confirm Digital Flock Purchase
                </span>
                <h3 className="text-xl font-black text-white font-['Outfit']">
                  {selectedPlan.name} ({selectedPlan.henQuantity || selectedPlan.planNumber} {selectedPlan.henQuantity === 1 ? 'Hen' : 'Hens'})
                </h3>
              </div>
            </div>

            {/* Price & Balance Check */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/20 space-y-2 mb-4 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Flock Price:</span>
                <span className="text-lg font-black text-white font-['Outfit']">
                  {selectedPlan.price.toLocaleString()} PKR
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-800">
                <span className="text-slate-400">Hen Quantity:</span>
                <span className="font-bold text-amber-400">
                  {selectedPlan.henQuantity || selectedPlan.planNumber} {selectedPlan.henQuantity === 1 ? 'Hen' : 'Hens'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-800">
                <span className="text-slate-400">Cycle Duration:</span>
                <span className="font-bold text-white">{selectedPlan.cycleDays} Days</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-800">
                <span className="text-slate-400">Daily Egg Harvest:</span>
                <span className="font-bold text-amber-400">{selectedPlan.dailyEggs} Eggs / Day</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-800">
                <span className="text-slate-400">Your Confirmed Balance:</span>
                <span className={`font-bold font-['Outfit'] ${
                  (wallet?.balance || 0) >= selectedPlan.price ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {(wallet?.balance || 0).toLocaleString()} PKR
                </span>
              </div>
            </div>

            {/* Balance Warning if Insufficient */}
            {(wallet?.balance || 0) < selectedPlan.price && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Insufficient confirmed balance for this flock.</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setCurrentTab('deposit');
                  }}
                  className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs shrink-0"
                >
                  Deposit Now
                </button>
              </div>
            )}

            {/* Terms and Non-Guaranteed Disclaimer Agreement */}
            <div className="space-y-3 mb-5">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <p>
                  <strong>Terms & Conditions:</strong> {selectedPlan.terms} Digital eggs require active daily harvesting. No guaranteed monetary profits or fixed investment returns are implied.
                </p>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
                />
                <span>
                  I understand that this is a digital farm simulation and agree to the platform operating rules and reward mechanics.
                </span>
              </label>
            </div>

            {/* Status alerts */}
            {purchaseStatus && (
              <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                purchaseStatus.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/80 border border-red-500/40 text-red-300'
              }`}>
                {purchaseStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{purchaseStatus.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5">
              {/* Pay via Deposit button (Primary flow for purchasing plans) */}
              <button
                type="button"
                onClick={handlePayViaDeposit}
                disabled={buying || !agreedToTerms}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {buying ? 'Reserving Flock...' : `Select & Pay via Deposit (${selectedPlan.price.toLocaleString()} PKR)`}
                </span>
              </button>

              {/* Instant Buy with confirmed balance if available */}
              {(wallet?.balance || 0) >= selectedPlan.price && (
                <button
                  type="button"
                  onClick={handleBuyWithBalance}
                  disabled={buying || !agreedToTerms}
                  className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Buy with Wallet Balance ({(wallet?.balance || 0).toLocaleString()} PKR Available)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transparency Disclaimer */}
      <DisclaimerBanner variant="full" />
    </div>
  );
};
