import React from 'react';
import { Volume2, Sparkles } from 'lucide-react';

export const MarqueeBanner: React.FC = () => {
  return (
    <div className="bg-emerald-950/60 border-y border-emerald-500/20 py-2 px-3 flex items-center gap-2 overflow-hidden text-xs">
      <div className="flex items-center gap-1.5 text-amber-400 font-bold shrink-0 bg-emerald-900/80 px-2 py-0.5 rounded-full border border-amber-400/30">
        <Volume2 className="w-3.5 h-3.5 animate-pulse" />
        <span>NOTICE</span>
      </div>
      <div className="overflow-hidden relative w-full whitespace-nowrap">
        <div className="inline-block animate-[marquee_25s_linear_infinite] text-emerald-200/90 space-x-8">
          <span>✨ Welcome to EGGS NAVA PRO — The Next-Gen Digital Poultry Farming & Harvest Simulation!</span>
          <span>🥚 Daily morning nest collections now active across all Starter & Premium Coops.</span>
          <span>⚡ Instant Easypaisa & JazzCash payment auditing active 24/7.</span>
          <span>🛡️ Verified transparent digital rewards with zero guaranteed profit claims.</span>
          <span>🤝 Earn multi-tier referral commissions when your invitees set up their coops.</span>
        </div>
      </div>
    </div>
  );
};
