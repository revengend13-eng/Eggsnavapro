import React, { useState } from 'react';

interface HenIllustrationProps {
  color?: string;
  size?: number;
  className?: string;
  animating?: boolean;
  quantity?: number;
  image?: string;
}

export const HenIllustration: React.FC<HenIllustrationProps> = ({
  color = '#f59e0b',
  size = 72,
  className = '',
  animating = false,
  quantity,
  image
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {image && !imgError ? (
        <div 
          style={{ width: size, height: size }}
          className={`relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-lg shadow-amber-500/10 bg-slate-900 flex items-center justify-center ${
            animating ? 'transition-transform duration-300 hover:scale-105' : ''
          }`}
        >
          <img
            src={image}
            alt="Farm Hen"
            className="w-full h-full object-cover object-center"
            onError={() => setImgError(true)}
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
        </div>
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={animating ? 'animate-bounce' : ''}
        >
          <defs>
            <radialGradient id={`henGlow-${color.replace('#','')}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0.1" />
            </radialGradient>
            <linearGradient id={`beakGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id={`combGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>

          {/* Nest Straw base */}
          <ellipse cx="50" cy="84" rx="36" ry="12" fill="#78350f" opacity="0.6" />
          <path d="M18 82 Q32 92 50 85 Q68 92 82 82 Q65 76 50 78 Q35 76 18 82 Z" fill="#d97706" />
          <path d="M22 84 L26 94 M38 86 L42 96 M54 86 L58 95 M70 85 L74 93" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" />

          {/* Tail Feathers */}
          <path d="M22 48 Q10 40 12 28 Q24 35 28 45 Z" fill={color} opacity="0.9" />
          <path d="M25 44 Q14 30 20 20 Q30 30 32 40 Z" fill={color} />
          <path d="M30 42 Q22 22 30 16 Q36 28 35 38 Z" fill="#fbbf24" />

          {/* Main Body */}
          <ellipse cx="52" cy="58" rx="26" ry="22" fill={color} />
          <ellipse cx="52" cy="58" rx="26" ry="22" fill={`url(#henGlow-${color.replace('#','')})`} />

          {/* Wing with feather layers */}
          <path d="M42 54 Q56 46 64 56 Q66 68 48 70 Q38 66 42 54 Z" fill="#0f172a" fillOpacity="0.25" />
          <path d="M44 56 Q54 50 60 58 Q62 66 48 68 Q40 65 44 56 Z" fill={color} />
          <path d="M47 60 Q55 56 58 63" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

          {/* Neck and Head */}
          <path d="M60 52 Q64 36 68 30 Q78 30 80 40 Q76 56 66 60 Z" fill={color} />
          <circle cx="73" cy="33" r="10" fill={color} />

          {/* Red Comb on Head */}
          <path d="M67 25 Q68 16 72 20 Q75 14 78 19 Q82 17 80 26 Z" fill="url(#combGrad)" />
          {/* Wattle under Beak */}
          <path d="M78 40 Q84 42 82 48 Q78 48 76 43 Z" fill="url(#combGrad)" />

          {/* Eye */}
          <circle cx="75" cy="31" r="3.2" fill="#ffffff" />
          <circle cx="76" cy="31" r="1.8" fill="#0f172a" />
          <circle cx="76.6" cy="30.4" r="0.6" fill="#ffffff" />

          {/* Beak */}
          <path d="M82 32 L92 36 L82 40 Z" fill="url(#beakGrad)" />
        </svg>
      )}

      {quantity !== undefined && quantity > 1 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full border border-amber-300 shadow">
          {quantity} Hens
        </span>
      )}
    </div>
  );
};

interface EggIllustrationProps {
  color?: string;
  size?: number;
  className?: string;
  count?: number;
  image?: string;
}

export const EggIllustration: React.FC<EggIllustrationProps> = ({
  color = '#fef3c7',
  size = 54,
  className = '',
  count,
  image
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {image && !imgError ? (
        <div 
          style={{ width: size, height: size }}
          className="relative rounded-xl overflow-hidden border border-amber-500/30 shadow bg-slate-900 flex items-center justify-center"
        >
          <img
            src={image}
            alt="Farm Egg"
            className="w-full h-full object-cover object-center"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`eggGrad-${color.replace('#','')}`} x1="20%" y1="10%" x2="80%" y2="90%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor={color} />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <radialGradient id="eggHighlight" cx="35%" cy="30%" r="35%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Egg Shadow */}
          <ellipse cx="50" cy="88" rx="28" ry="7" fill="#064e3b" opacity="0.3" />

          {/* Egg Shape */}
          <path
            d="M50 14 C68 14 82 38 82 62 C82 78 68 86 50 86 C32 86 18 78 18 62 C18 38 32 14 50 14 Z"
            fill={`url(#eggGrad-${color.replace('#','')})`}
            filter="url(#softGlow)"
          />

          {/* Specular reflection */}
          <path
            d="M44 22 C52 22 58 32 58 44 C58 50 52 52 44 52 C38 52 34 46 34 40 C34 30 38 22 44 22 Z"
            fill="url(#eggHighlight)"
          />

          {/* Subtle decorative speckles */}
          <circle cx="56" cy="62" r="1.5" fill="#b45309" opacity="0.3" />
          <circle cx="64" cy="52" r="1.2" fill="#b45309" opacity="0.25" />
          <circle cx="38" cy="68" r="1.8" fill="#b45309" opacity="0.25" />
        </svg>
      )}

      {count !== undefined && (
        <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-xs px-1.5 py-0.5 rounded-full border border-amber-300 shadow">
          x{count}
        </span>
      )}
    </div>
  );
};

export const FarmBarnIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 21h18" />
      <path d="M5 21V9l7-5 7 5v12" />
      <path d="M9 21v-6a3 3 0 0 1 6 0v6" />
      <path d="M9 10h6" />
      <path d="M12 4v6" />
    </svg>
  );
};

export const EasypaisaBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold text-xs tracking-wider ${className}`}>
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      EASYPAISA
    </div>
  );
};

export const JazzCashBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold text-xs tracking-wider ${className}`}>
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
      JAZZCASH
    </div>
  );
};
