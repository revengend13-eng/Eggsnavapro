import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  KeyRound, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check,
  Shield
} from 'lucide-react';
import { updatePassword, updateProfile } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const ProfileView: React.FC = () => {
  const { currentUser, userProfile, role, logout } = useAuth();
  const { wallet } = useFarm();

  const [newUsername, setNewUsername] = useState(userProfile?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCopyCode = () => {
    if (userProfile?.referralCode) {
      navigator.clipboard.writeText(userProfile.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    setFeedback(null);

    try {
      if (newUsername.trim() && newUsername !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: newUsername.trim() });
      }

      if (newPassword.trim()) {
        if (newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters');
        }
        await updatePassword(currentUser, newPassword);
        setNewPassword('');
      }

      setFeedback({
        type: 'success',
        message: 'Profile settings updated successfully.'
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update profile'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-black text-2xl text-emerald-400">
              {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : 'F'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                  {userProfile?.username || 'Farmer'}
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black px-2 py-0.5 rounded-full uppercase">
                  {role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{currentUser?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 font-bold text-xs uppercase tracking-wider hover:bg-red-900 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Account Details & Referral Code Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900/90 border border-emerald-500/20 p-5 rounded-3xl space-y-2">
          <span className="text-xs text-slate-400 font-semibold block">Referral Code</span>
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-lg font-black text-amber-400 font-mono tracking-wider">
              {userProfile?.referralCode || 'N/A'}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/20 p-5 rounded-3xl space-y-2">
          <span className="text-xs text-slate-400 font-semibold block">Account Verification Status</span>
          <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">Active Farmer (Verified)</span>
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <h3 className="text-base font-black text-white font-['Outfit'] flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-400" />
          <span>Security & Profile Preferences</span>
        </h3>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Farmer Display Name
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              New Password (Optional)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep unchanged"
              className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          {feedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/80 border border-red-500/40 text-red-300'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 transition"
          >
            {saving ? 'Updating...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      <DisclaimerBanner variant="compact" />
    </div>
  );
};
