import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Check, 
  X, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Eye, 
  ExternalLink,
  Power,
  RotateCw,
  Sparkles,
  Calendar,
  Filter,
  ArrowRight
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { UserPlan, DepositRequest } from '../types';
import { HenIllustration, EggIllustration } from './FarmIllustrations';

interface Props {
  filterUserId?: string;
}

export const UserPlansManager: React.FC<Props> = ({ filterUserId }) => {
  const { 
    allUserPlans, 
    allDeposits, 
    activateUserPlan, 
    deactivateUserPlan, 
    updateUserPlanDetails,
    approveDeposit 
  } = useFarm();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPlan, setEditingPlan] = useState<UserPlan | null>(null);
  const [planToDeactivate, setPlanToDeactivate] = useState<UserPlan | null>(null);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit form state
  const [editStatus, setEditStatus] = useState<'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'>('ACTIVE');
  const [editHens, setEditHens] = useState<number>(1);
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [editDailyEggs, setEditDailyEggs] = useState<number>(1);
  const [editEggValue, setEditEggValue] = useState<number>(40);

  const displayedPlans = allUserPlans
    .filter(p => {
      if (filterUserId && p.userId !== filterUserId) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchUser = (p.userEmail || '').toLowerCase().includes(q) || (p.userName || '').toLowerCase().includes(q);
        const matchPlan = p.planName.toLowerCase().includes(q) || p.planId.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        const matchDep = (p.depositId || '').toLowerCase().includes(q);
        return matchUser || matchPlan || matchId || matchDep;
      }
      return true;
    });

  const handleOpenEdit = (plan: UserPlan) => {
    setEditingPlan(plan);
    setEditStatus(plan.status);
    setEditHens(plan.henQuantity || 1);
    setEditStartDate(plan.startDate ? plan.startDate.slice(0, 16) : new Date().toISOString().slice(0, 16));
    setEditEndDate(
      plan.endDate 
        ? plan.endDate.slice(0, 16) 
        : new Date(Date.now() + (plan.cycleDays || 60) * 86400000).toISOString().slice(0, 16)
    );
    setEditDailyEggs(plan.dailyEggs || 1);
    setEditEggValue(plan.eggValuePkr || 40);
  };

  const handleSaveEdit = async () => {
    if (!editingPlan) return;
    setActionLoading('saving');
    try {
      await updateUserPlanDetails(editingPlan.id, {
        status: editStatus,
        henQuantity: editHens,
        startDate: editStartDate ? new Date(editStartDate).toISOString() : '',
        endDate: editEndDate ? new Date(editEndDate).toISOString() : '',
        dailyEggs: editDailyEggs,
        eggValuePkr: editEggValue
      });
      setFeedback({ type: 'success', message: `Successfully updated ${editingPlan.planName}!` });
      setTimeout(() => setFeedback(null), 3000);
      setEditingPlan(null);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Failed to update plan details' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (plan: UserPlan) => {
    setActionLoading(`act_${plan.id}`);
    try {
      await activateUserPlan(plan.id);
      setFeedback({ type: 'success', message: `Activated ${plan.planName} for ${plan.userEmail || plan.userName || 'user'}!` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Activation failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (plan: UserPlan) => {
    setActionLoading(`deact_${plan.id}`);
    try {
      await deactivateUserPlan(plan.id, 'Deactivated by Administrator');
      setFeedback({ type: 'success', message: `Deactivated ${plan.planName}.` });
      setTimeout(() => setFeedback(null), 3000);
      setPlanToDeactivate(null);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Deactivation failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveLinkedDeposit = async (dep: DepositRequest) => {
    setActionLoading(`appr_dep_${dep.id}`);
    try {
      await approveDeposit(dep);
      setFeedback({ type: 'success', message: `Deposit approved! Linked plan automatically activated.` });
      setTimeout(() => setFeedback(null), 3500);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Failed to approve deposit' });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = allUserPlans.filter(p => p.status === 'PENDING').length;
  const activeCount = allUserPlans.filter(p => p.status === 'ACTIVE').length;
  const expiredCount = allUserPlans.filter(p => p.status === 'EXPIRED').length;

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 shadow-lg animate-in fade-in ${
          feedback.type === 'success'
            ? 'bg-emerald-950/90 border border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/90 border border-red-500/40 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: `All Plans (${allUserPlans.length})` },
            { id: 'PENDING', label: `Pending Activation (${pendingCount})`, highlight: pendingCount > 0 },
            { id: 'ACTIVE', label: `Active (${activeCount})` },
            { id: 'EXPIRED', label: `Expired/Inactive (${expiredCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.highlight && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search email, plan, TID, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-3">
        {displayedPlans.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800/80">
            No user purchased plans match this filter.
          </div>
        ) : (
          displayedPlans.map((plan) => {
            const isPending = plan.status === 'PENDING';
            const isActive = plan.status === 'ACTIVE';
            const henCount = plan.henQuantity || 1;
            const linkedDeposit = plan.depositId ? allDeposits.find(d => d.id === plan.depositId) : null;

            return (
              <div
                key={plan.id}
                className={`p-4 rounded-2xl border transition shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isPending
                    ? 'bg-slate-950 border-amber-500/40 ring-1 ring-amber-500/20'
                    : isActive
                    ? 'bg-slate-950/90 border-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 opacity-75'
                }`}
              >
                {/* Left: Flock & User Identification */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-black text-white font-['Outfit']">
                      {plan.planName}
                    </span>
                    <span className="text-xs font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                      🐔 {henCount} {henCount === 1 ? 'Hen' : 'Hens'}
                    </span>
                    <span className="text-xs font-black text-emerald-400 font-mono">
                      {plan.purchasePrice.toLocaleString()} PKR
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        isPending
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>

                  {/* User details */}
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <p>
                      <strong>Farmer:</strong> {plan.userName || 'User'} ({plan.userEmail || plan.userId})
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span>Daily Harvest: <strong className="text-amber-400 font-bold">{plan.dailyEggs} Eggs/Day</strong></span>
                      <span>•</span>
                      <span>Rate: <strong className="text-emerald-400 font-bold">{plan.eggValuePkr} PKR/Egg</strong></span>
                      <span>•</span>
                      <span>Cycle: <strong className="text-white font-bold">{plan.cycleDays} Days</strong></span>
                    </div>
                    {/* Dates */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span>Start: <strong className="text-slate-200">{plan.startDate ? new Date(plan.startDate).toLocaleDateString() : 'Pending Activation'}</strong></span>
                      <span>•</span>
                      <span>Expiry: <strong className="text-slate-200">{plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Collected Total: <strong className="text-amber-400">{plan.eggsCollectedTotal || 0} Eggs</strong></span>
                    </div>
                  </div>

                  {/* Linked Deposit Section */}
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <FileText className="w-3 h-3 text-emerald-400" />
                      <span>Linked Payment Deposit</span>
                    </span>
                    {linkedDeposit ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div>
                          <span className="font-bold text-white font-mono">{linkedDeposit.amount.toLocaleString()} PKR ({linkedDeposit.method})</span>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="text-amber-300 font-mono font-bold">TID: {linkedDeposit.transactionId}</span>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="text-slate-400">Sender: {linkedDeposit.senderAccount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                            linkedDeposit.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                            linkedDeposit.status === 'REJECTED' ? 'bg-red-950 text-red-300 border-red-500/40' :
                            'bg-amber-950 text-amber-300 border-amber-500/40'
                          }`}>
                            Deposit {linkedDeposit.status}
                          </span>
                          {linkedDeposit.proofUrl && (
                            <button
                              onClick={() => setPreviewProofUrl(linkedDeposit.proofUrl || null)}
                              className="text-slate-300 hover:text-white underline text-[10px]"
                            >
                              View Proof
                            </button>
                          )}
                          {linkedDeposit.status === 'PENDING' && (
                            <button
                              onClick={() => handleApproveLinkedDeposit(linkedDeposit)}
                              disabled={actionLoading === `appr_dep_${linkedDeposit.id}`}
                              className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider transition"
                            >
                              Approve & Activate
                            </button>
                          )}
                        </div>
                      </div>
                    ) : plan.depositId ? (
                      <p className="text-slate-400 text-[11px]">
                        Deposit ID: <span className="font-mono text-emerald-400">{plan.depositId}</span> (Record syncing...)
                      </p>
                    ) : (
                      <p className="text-slate-500 italic text-[11px]">
                        No deposit linked yet. User may submit a linked deposit, or Admin can manually activate.
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2 lg:self-center shrink-0">
                  {/* Manual Activate Button */}
                  {plan.status !== 'ACTIVE' && (
                    <button
                      onClick={() => handleActivate(plan)}
                      disabled={actionLoading === `act_${plan.id}`}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{actionLoading === `act_${plan.id}` ? 'Activating...' : 'Activate Plan'}</span>
                    </button>
                  )}

                  {/* Deactivate Button */}
                  {plan.status === 'ACTIVE' && (
                    <button
                      onClick={() => setPlanToDeactivate(plan)}
                      disabled={actionLoading === `deact_${plan.id}`}
                      className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-950 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Deactivate</span>
                    </button>
                  )}

                  {/* Edit Plan Button */}
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition border border-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Plan</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-lg font-black text-white font-['Outfit']">
                    Edit User Purchased Plan
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {editingPlan.planName} • ID: {editingPlan.id.slice(0, 10)}...
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Plan Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="ACTIVE">ACTIVE (Flock active in coop, producing eggs)</option>
                  <option value="PENDING">PENDING (Awaiting deposit approval)</option>
                  <option value="EXPIRED">EXPIRED (Deactivated / Cycle concluded)</option>
                  <option value="COMPLETED">COMPLETED (60-day cycle fully redeemed)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Hens Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editHens}
                  onChange={(e) => setEditHens(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Start Date</label>
                  <input
                    type="datetime-local"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Expiry Date (End Date)</label>
                  <input
                    type="datetime-local"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Daily Eggs Harvest</label>
                  <input
                    type="number"
                    min="1"
                    value={editDailyEggs}
                    onChange={(e) => setEditDailyEggs(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Egg Value (PKR/Egg)</label>
                  <input
                    type="number"
                    min="1"
                    value={editEggValue}
                    onChange={(e) => setEditEggValue(parseInt(e.target.value) || 40)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-emerald-400"
                  />
                </div>
              </div>

              {/* Linked deposit inspection */}
              {editingPlan.depositId && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Linked Deposit Reference</span>
                  <p className="font-mono text-emerald-400">{editingPlan.depositId}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingPlan(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={actionLoading === 'saving'}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {actionLoading === 'saving' ? 'Saving...' : 'Save Plan Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {planToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400">
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-white font-['Outfit']">
                  Confirm Deactivation
                </h4>
                <p className="text-xs text-slate-400">
                  {planToDeactivate.planName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              Are you sure you want to deactivate this flock? The plan status will be updated to <strong>EXPIRED</strong>, stopping daily egg yields.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPlanToDeactivate(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeactivate(planToDeactivate)}
                disabled={actionLoading === `deact_${planToDeactivate.id}`}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {actionLoading === `deact_${planToDeactivate.id}` ? 'Deactivating...' : 'Confirm Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Modal */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 max-w-lg w-full shadow-2xl relative space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Deposit Proof Screenshot</span>
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl bg-black flex items-center justify-center p-2">
              <img
                src={previewProofUrl}
                alt="Deposit Proof"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <a
                href={previewProofUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
