import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  AlertCircle, 
  RotateCw,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { HenIllustration, EggIllustration } from '../components/FarmIllustrations';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

interface Props {
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const CollectView: React.FC<Props> = ({ setCurrentTab, openAuthModal }) => {
  const { currentUser } = useAuth();
  const { 
    wallet, 
    userPlans, 
    availableHarvestCount, 
    collectEggs 
  } = useFarm();

  const [collecting, setCollecting] = useState(false);
  const [harvestResult, setHarvestResult] = useState<{ count: number; message: string } | null>(null);

  const activeFlocks = userPlans.filter(p => p.status === 'ACTIVE');

  const handleHarvest = async () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    setCollecting(true);
    setHarvestResult(null);

    const res = await collectEggs();
    if (res.success) {
      setHarvestResult({
        count: res.collected,
        message: res.message
      });
    } else {
      setHarvestResult({
        count: 0,
        message: res.message
      });
    }
    setCollecting(false);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-emerald-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Egg Harvest Pasture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
            Collect Fresh Digital Eggs
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Harvest your hens' daily egg yield. Collected eggs are stored safely in your inventory and can be redeemed instantly into your confirmed PKR wallet balance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
            <EggIllustration size={28} color="#fef3c7" />
            <div>
              <span className="text-[10px] text-slate-400 block -mb-0.5">Inventory Eggs</span>
              <span className="text-xl font-black text-white font-['Outfit']">
                {(wallet?.availableEggs || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <button
            onClick={() => setCurrentTab('redeem')}
            className="px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
          >
            <span>Redeem for PKR</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Harvest Stage */}
      <div className="relative overflow-hidden bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {activeFlocks.length === 0 ? (
          <div className="max-w-md mx-auto space-y-4 py-8">
            <HenIllustration size={80} color="#f59e0b" />
            <h3 className="text-xl font-black text-white font-['Outfit']">
              No Active Hens in the Pasture
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You need at least one active digital flock to harvest eggs. Acquire Plan 01 to set up your starter coop!
            </p>
            <button
              onClick={() => setCurrentTab('plans')}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Acquire Hen Flock</span>
            </button>
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-6">
            {/* Visual Nest Display */}
            <div className="flex justify-center items-end gap-3 sm:gap-6 py-4">
              {activeFlocks.slice(0, 3).map((flock, idx) => (
                <div key={flock.id} className="flex flex-col items-center">
                  <div className="relative">
                    <HenIllustration color={flock.henColor || '#f59e0b'} size={72} animating={availableHarvestCount > 0} image={flock.henImage} quantity={flock.henQuantity} />
                    {availableHarvestCount > 0 && (
                      <div className="absolute -bottom-2 -right-1 animate-bounce">
                        <EggIllustration size={26} color="#fef3c7" image={flock.eggImage} />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold mt-2">
                    {flock.planName.split('-')[0]}
                  </span>
                </div>
              ))}
            </div>

            {/* Harvest Summary Status */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{activeFlocks.length} Flocks Active in Pasture</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                {availableHarvestCount > 0
                  ? `${availableHarvestCount} Digital Eggs Ready for Pickup!`
                  : 'Hens Are Currently Nesting'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                {availableHarvestCount > 0
                  ? 'Click the harvest button below to gather all laid eggs into your inventory.'
                  : 'Check back every day to harvest your daily digital eggs.'}
              </p>
            </div>

            {/* Harvest Action Button */}
            <div className="pt-2">
              <button
                onClick={handleHarvest}
                disabled={collecting || availableHarvestCount === 0}
                className={`w-full sm:w-80 py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-2xl transition inline-flex items-center justify-center gap-2.5 active:scale-95 ${
                  availableHarvestCount > 0
                    ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {collecting ? (
                  <>
                    <RotateCw className="w-5 h-5 animate-spin" />
                    <span>Harvesting Nests...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Harvest All Eggs ({availableHarvestCount})</span>
                  </>
                )}
              </button>
            </div>

            {/* Harvest Result Feedback */}
            {harvestResult && (
              <div className={`p-4 rounded-2xl text-xs flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
                harvestResult.count > 0
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border border-slate-800 text-slate-300'
              }`}>
                {harvestResult.count > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>{harvestResult.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Disclaimers */}
      <DisclaimerBanner variant="compact" />
    </div>
  );
};
