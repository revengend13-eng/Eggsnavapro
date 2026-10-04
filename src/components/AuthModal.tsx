import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Users, 
  Sparkles, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EggIllustration } from './FarmIllustrations';

interface Props {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  initialRefCode?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  initialMode = 'register',
  initialRefCode = '',
  onClose,
  onSuccess
}) => {
  const { registerWithEmail, loginWithEmail, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(initialRefCode);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    if (initialRefCode) {
      setReferralCode(initialRefCode);
    }
  }, [initialMode, initialRefCode]);

  // Check URL query parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
      setMode('register');
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide your email and password');
      return;
    }

    if (mode === 'register') {
      if (!username.trim()) {
        setError('Please enter a farmer username');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await registerWithEmail(email, username, password, referralCode.trim() || undefined);
      } else {
        await loginWithEmail(email, password);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || 'Authentication failed. Please check your credentials.';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        msg = 'Invalid email or password. Please try again.';
      } else if (msg.includes('email-already-in-use')) {
        msg = 'An account with this email already exists. Please log in.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle(referralCode.trim() || undefined);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.warn("Google sign in notice:", err);
      const errStr = String(err?.message || err);
      const code = err?.code || '';

      if (code === 'auth/network-request-failed' || errStr.includes('network-request-failed')) {
        setError(
          'Google popup connection is restricted in this preview iframe. Please register or sign in with Email & Password below.'
        );
        // Pre-fill user's email if available from metadata
        if (!email) {
          setEmail('eggsverse@gmail.com');
        }
      } else if (code === 'auth/popup-blocked' || errStr.includes('popup-blocked')) {
        setError('Popup was blocked by your browser. Please allow popups or use Email & Password below.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completion. Please try again or use Email & Password.');
      } else {
        setError(err.message || 'Google sign-in could not be completed. Please use Email/Password below.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-emerald-500 to-emerald-700 p-0.5 shadow-xl shadow-emerald-500/20 mb-3">
            <div className="w-full h-full bg-emerald-950 rounded-[14px] flex items-center justify-center">
              <EggIllustration size={34} color="#fbbf24" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
            EGGS <span className="text-emerald-400">NAVA</span> PRO
          </h2>
          <p className="text-xs text-emerald-400/90 font-medium mt-1">
            {mode === 'register' ? 'Join the Digital Poultry Farm Network' : 'Welcome back to your digital farm roost'}
          </p>
        </div>

        {/* Mode Toggle Switch */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-emerald-500/20 mb-5">
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              mode === 'register'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              mode === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Farmer Login
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Farmer Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. TariqFarmer99"
                  className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email / Gmail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Referral Code (Optional)
                  </label>
                  {referralCode && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Auto-Detected
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. EGG9241"
                    className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white uppercase placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : (mode === 'register' ? 'Register Account' : 'Sign In to Farm')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-900 px-3 text-slate-500 uppercase tracking-widest text-[10px]">
              Or Continue With
            </span>
          </div>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2.5 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="text-[11px] text-slate-500 text-center mt-5">
          By signing up, you agree to our Digital Farm Rules & Terms of Service. Passwords are encrypted securely via Firebase Authentication.
        </p>
      </div>
    </div>
  );
};
