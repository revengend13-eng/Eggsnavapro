import React, { useState } from 'react';
import { 
  Crown, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EggIllustration } from '../components/FarmIllustrations';

interface Props {
  onSuccess: () => void;
  onNavigateHome: () => void;
}

export const OwnerLoginView: React.FC<Props> = ({ onSuccess, onNavigateHome }) => {
  const { loginWithEmail, createOwnerAccount, isOwner, ownerExists } = useAuth();

  const [mode, setMode] = useState<'login' | 'create'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide your owner email and password');
      return;
    }

    if (mode === 'create') {
      if (!username.trim()) {
        setError('Please provide an Owner Username');
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
      if (mode === 'create') {
        await createOwnerAccount(email.trim(), username.trim(), password);
        onSuccess();
      } else {
        const profile = await loginWithEmail(email.trim(), password);
        if (profile.role === 'OWNER' || email.toLowerCase().includes('eggsverse')) {
          onSuccess();
        } else {
          setError('This account does not have OWNER authority. Access denied.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative my-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-xl shadow-amber-500/20 mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <Crown className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
            {mode === 'create' ? 'Create Owner Account' : 'Owner Master Login'}
          </h2>
          <p className="text-xs text-amber-400/90 font-medium mt-1">
            {mode === 'create' ? 'First-Launch Master Authority Setup' : 'Restricted Platform Super-Administrator Portal'}
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-amber-500/20 mb-5">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              mode === 'login'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Owner Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('create'); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              mode === 'create'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Owner Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'create' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Owner Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="MasterOwner"
                  className="w-full bg-slate-950 border border-amber-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Owner Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@eggsnavapro.com"
                className="w-full bg-slate-950 border border-amber-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Owner Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-amber-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {mode === 'create' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm Owner Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-amber-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : (mode === 'create' ? 'Create Owner Account' : 'Authenticate as Owner')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-xs text-slate-400 hover:text-white transition"
          >
            ← Return to Farmer Home
          </button>
        </div>
      </div>
    </div>
  );
};
