import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface Props {
  variant?: 'compact' | 'full';
}

export const DisclaimerBanner: React.FC<Props> = ({ variant = 'compact' }) => {
  if (variant === 'compact') {
    return (
      <div className="bg-emerald-950/80 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-300/80">
        <Info className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-emerald-300">Digital Simulation Only:</strong> Digital hens and eggs represent gamified reward entertainment mechanics. No guaranteed profits or fixed financial returns.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 text-sm text-slate-300 shadow-xl space-y-2">
      <div className="flex items-center gap-2 text-emerald-400 font-bold">
        <ShieldAlert className="w-5 h-5 text-amber-400" />
        <span>Platform Transparency & Risk Disclaimer</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">
        EGGS NAVA PRO is an interactive digital poultry farm simulation and reward entertainment platform. Hens, coops, feed cycles, and eggs are virtual digital assets and game mechanics. This platform does not offer banking, security investments, fixed deposit yields, or guaranteed profit doubling. All digital egg yields are subject to user manual participation and platform operational guidelines.
      </p>
    </div>
  );
};
