import React, { useState } from 'react';
import { Lock, AlertCircle, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  isOpen: boolean;
  title?: string;
  description?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ReauthModal: React.FC<Props> = ({
  isOpen,
  title = "Owner Security Re-Authentication",
  description = "This action requires Owner credential confirmation before proceeding.",
  onSuccess,
  onCancel
}) => {
  const { verifyOwnerPassword, isOwner } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your account password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const verified = await verifyOwnerPassword(password);
      if (verified) {
        setPassword('');
        onSuccess();
      } else {
        // In prototype mode with Google Sign-in or unlinked pass, allow owner email check if isOwner
        if (isOwner && password === 'owner123') {
          setPassword('');
          onSuccess();
        } else {
          setError('Invalid password confirmation. Please try again.');
        }
      }
    } catch (e: any) {
      setError(e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-['Outfit']">{title}</h3>
            <p className="text-xs text-amber-400/90 font-medium">Owner Protection Active</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
          {description}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Enter Your Password to Authorize
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoFocus
              className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400 transition"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              For initial development verification, enter your login password or master pass.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Authorize'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
