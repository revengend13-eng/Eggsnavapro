import React from 'react';
import { Home, ShoppingBag, Layers, Wallet, Users, Sparkles, Crown, ShieldAlert } from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { useAuth } from '../context/AuthContext';
import { EggIllustration } from './FarmIllustrations';

interface Props {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const BottomNav: React.FC<Props> = ({ currentTab, setCurrentTab }) => {
  const { availableHarvestCount } = useFarm();
  const { isOwner, isAdmin } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'plans', label: 'Buy Hens', icon: ShoppingBag },
    { id: 'collect', label: 'Harvest', isCenter: true },
    { id: 'my-farm', label: 'My Farm', icon: Layers },
    ...(isOwner 
      ? [{ id: 'owner', label: 'Owner', icon: Crown, highlight: true }]
      : (isAdmin 
        ? [{ id: 'admin', label: 'Admin', icon: ShieldAlert, highlight: true }]
        : [{ id: 'deposit', label: 'Wallet', icon: Wallet }]
      )
    ),
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-emerald-500/20 px-2 py-1.5 md:hidden">
      <div className="flex items-center justify-around relative">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;

          if (item.isCenter) {
            return (
              <div key={item.id} className="relative -top-5 flex flex-col items-center">
                <button
                  onClick={() => setCurrentTab('collect')}
                  className={`w-14 h-14 rounded-full p-1 shadow-xl transition transform active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-tr from-amber-400 to-amber-200 ring-4 ring-amber-500/30 scale-105'
                      : 'bg-gradient-to-tr from-emerald-500 to-teal-400 ring-4 ring-emerald-950 hover:scale-105'
                  }`}
                >
                  <div className="w-full h-full bg-emerald-950 rounded-full flex items-center justify-center relative overflow-hidden">
                    <EggIllustration size={28} color="#fbbf24" />
                    {availableHarvestCount > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white font-black text-[9px] px-1 rounded-full animate-bounce">
                        {availableHarvestCount}
                      </span>
                    )}
                  </div>
                </button>
                <span className={`text-[10px] font-bold mt-0.5 tracking-tight ${
                  isActive ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  Harvest
                </span>
              </div>
            );
          }

          const IconComponent = item.icon!;
          const isSpecial = (item as any).highlight;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
                isActive 
                  ? (isSpecial ? 'text-amber-400 font-black scale-105' : 'text-emerald-400 font-bold')
                  : (isSpecial ? 'text-amber-400/80 font-bold hover:text-amber-300' : 'text-slate-400 hover:text-slate-200')
              }`}
            >
              <IconComponent className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'} ${isSpecial && !isActive ? 'text-amber-400' : ''}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
