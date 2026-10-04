import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  QrCode,
  ArrowRight
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { Referral } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

interface Props {
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const TeamView: React.FC<Props> = ({ setCurrentTab, openAuthModal }) => {
  const { currentUser, userProfile } = useAuth();
  const { wallet, settings } = useFarm();

  const [copied, setCopied] = useState(false);
  const [referralsList, setReferralsList] = useState<Referral[]>([]);

  const referralCode = userProfile?.referralCode || 'MYCODE';
  const baseUrl = window.location.origin;
  const referralUrl = `${baseUrl}/user/register?ref=${referralCode}`;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'referrals'),
      where('referrerId', '==', currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Referral[] = [];
      snap.forEach((d) => list.push(d.data() as Referral));
      setReferralsList(list);
    });

    return () => unsub();
  }, [currentUser]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalInvited = referralsList.length;
  const totalEarnedCommissions = wallet?.totalReferralRewards || 0;

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-rose-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider mb-2">
          <Users className="w-3.5 h-3.5" />
          <span>Multi-Tier Partner Network</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
          Invite Friends & Grow Your Farm Team
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
          Share your unique invitation link. When teammates acquire digital hen coops, earn instant commission bonuses credited directly to your balance.
        </p>
      </div>

      {/* Referral Link & Code Box */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Your Unique Referral Code</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-widest mt-0.5 block">
              {referralCode}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </div>
        </div>

        {/* Full URL Box */}
        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono text-slate-300 overflow-hidden">
          <span className="truncate">{referralUrl}</span>
          <button
            onClick={handleCopy}
            className="text-emerald-400 hover:text-emerald-300 font-bold shrink-0 text-[11px]"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Network Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-emerald-500/20 p-5 rounded-3xl shadow-lg">
          <span className="text-xs text-slate-400 font-semibold block">Total Team Members</span>
          <span className="text-3xl font-black text-white font-['Outfit'] mt-1 block">
            {totalInvited} <span className="text-xs font-normal text-slate-400">Farmers</span>
          </span>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/20 p-5 rounded-3xl shadow-lg">
          <span className="text-xs text-slate-400 font-semibold block">Total Referral Commissions</span>
          <span className="text-3xl font-black text-emerald-400 font-['Outfit'] mt-1 block">
            {totalEarnedCommissions.toLocaleString()} <span className="text-xs font-normal text-emerald-300">PKR</span>
          </span>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/20 p-5 rounded-3xl shadow-lg">
          <span className="text-xs text-slate-400 font-semibold block">Active Commission Tiers</span>
          <div className="mt-1 text-xs text-slate-300 space-y-0.5">
            <p>Tier 1 (Direct): <strong className="text-amber-400">{settings.referralCommissionTier1}%</strong></p>
            <p>Tier 2: <strong className="text-teal-400">{settings.referralCommissionTier2}%</strong></p>
            <p>Tier 3: <strong className="text-purple-400">{settings.referralCommissionTier3}%</strong></p>
          </div>
        </div>
      </div>

      {/* Team Activity Table */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <h3 className="text-lg font-black text-white font-['Outfit'] flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <span>Real-Time Team Roster</span>
        </h3>

        {referralsList.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 space-y-2">
            <p>No members registered through your referral link yet.</p>
            <p className="text-[11px] text-slate-500">
              Share your link with fellow digital farmers to start building your network.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {referralsList.map((ref) => (
              <div key={ref.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">
                    {ref.refereeUsername || ref.refereeEmail}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Joined: {new Date(ref.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                    LEVEL {ref.level}
                  </span>
                  <span className="block text-[11px] text-emerald-300 font-semibold mt-0.5">
                    Commission Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DisclaimerBanner variant="compact" />
    </div>
  );
};
