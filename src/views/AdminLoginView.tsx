import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  AlertCircle, 
  ArrowRight,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { useAuth, isAuthorizedOwnerEmail } from '../context/AuthContext';

interface Props {
  onSuccess: () => void;
  onNavigateHome: () => void;
  onNavigateOwnerLogin?: () => void;
}

export const AdminLoginView: React.FC<Props> = ({ onSuccess, onNavigateHome, onNavigateOwnerLogin }) => {
  const { loginWithEmail, userProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide your administrator email and password.');
      return;
    }

    setLoading(true);

    try {
      const profile = await loginWithEmail(email.trim(), password);
      if (profile.role === 'ADMIN' || profile.role === 'OWNER' || isAuthorizedOwnerEmail(email)) {
        onSuccess();
      } else {
        setError('Access Denied: This account does not possess Administrator privileges. Please contact the Owner.');
      }
    } catch (err: any) {
      console.error("Admin login error:", err);
      let msg = err.message || 'Authentication failed. Please verify credentials.';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        msg = 'Invalid administrator credentials. Please check your email and password.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative my-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 p-0.5 shadow-xl shadow-emerald-500/20 mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
            Administrator Portal
          </h2>
          <p className="text-xs text-emerald-400/90 font-medium mt-1">
            Restricted Operational Admin Access (/admin/login)
          </p>
        </div>

        {/* Notice Banner */}
        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] mb-5 leading-relaxed">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Administrator accounts are created exclusively by the platform Owner. Sign in with the credentials assigned to your auditor account.
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@eggsnavapro.com"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating Admin...</span>
            ) : (
              <>
                <span>Sign In to Admin Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center space-y-2 text-xs">
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-slate-400 hover:text-white transition font-medium block mx-auto"
          >
            ← Return to Farmer Store & Dashboard
          </button>
          {onNavigateOwnerLogin && (
            <button
              type="button"
              onClick={onNavigateOwnerLogin}
              className="text-amber-400 hover:text-amber-300 transition text-[11px] block mx-auto font-bold"
            >
              Are you the platform Owner? Open Owner Login →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
