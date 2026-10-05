import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileText, 
  Search, 
  Check, 
  X, 
  AlertCircle, 
  ShoppingBag, 
  ExternalLink, 
  Lock, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Eye, 
  UserCheck, 
  UserX, 
  Award, 
  Sparkles, 
  Filter,
  CreditCard,
  Layers,
  ArrowRight
} from 'lucide-react';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { 
  DepositRequest, 
  WithdrawalRequest, 
  UserProfile, 
  Wallet, 
  Transaction,
  UserPlan,
  HenPlan
} from '../types';
import { HenIllustration, EggIllustration } from '../components/FarmIllustrations';
import { UserPlansManager } from '../components/UserPlansManager';

export const AdminView: React.FC = () => {
  const { currentUser, userProfile, isOwner } = useAuth();
  const { 
    plans,
    allUserPlans,
    allDeposits, 
    allWithdrawals, 
    transactions, 
    approveDeposit, 
    rejectDeposit, 
    updateWithdrawalStatus,
    toggleUserStatus
  } = useFarm();

  const perms = isOwner ? {
    canApproveDeposits: true,
    canProcessWithdrawals: true,
    canManageUsers: true,
    canViewTransactions: true,
    canViewReferrals: true
  } : (userProfile?.adminPermissions || {
    canApproveDeposits: true,
    canProcessWithdrawals: true,
    canManageUsers: true,
    canViewTransactions: true,
    canViewReferrals: true
  });

  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'users' | 'transactions' | 'plans' | 'user-plans' | 'referrals'>('deposits');

  // Filter states
  const [depositFilter, setDepositFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [depositSearch, setDepositSearch] = useState('');

  const [withdrawalFilter, setWithdrawalFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED'>('PENDING');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState<{ type: 'deposit' | 'withdrawal'; item: any } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Screenshot preview modal
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  // Users Directory state
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUserWallet, setSelectedUserWallet] = useState<Wallet | null>(null);
  const [selectedUserPlans, setSelectedUserPlans] = useState<UserPlan[]>([]);
  const [selectedUserDeposits, setSelectedUserDeposits] = useState<DepositRequest[]>([]);
  const [selectedUserWithdrawals, setSelectedUserWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Referrals state
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // Plans search state
  const [planSearch, setPlanSearch] = useState('');

  const loadUsers = async () => {
    if (!perms.canManageUsers) return;
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach(d => list.push(d.data() as UserProfile));
      list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      setUsersList(list);
    } catch (e) {
      console.warn("Load users notice:", e);
    }
  };

  const loadReferrals = async () => {
    if (!perms.canViewReferrals) return;
    setLoadingReferrals(true);
    try {
      const snap = await getDocs(collection(db, 'referrals'));
      const list: any[] = [];
      snap.forEach(d => list.push(d.data()));
      setReferralsList(list);
    } catch (e) {
      console.warn("Load referrals notice:", e);
    } finally {
      setLoadingReferrals(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'referrals') {
      loadReferrals();
    }
  }, [activeTab]);

  const handleSelectUser = async (u: UserProfile) => {
    setSelectedUser(u);
    setLoadingUserDetails(true);
    try {
      // 1. Fetch wallet
      const wSnap = await getDoc(doc(db, 'wallets', u.uid));
      if (wSnap.exists()) {
        setSelectedUserWallet(wSnap.data() as Wallet);
      } else {
        setSelectedUserWallet(null);
      }

      // 2. Fetch user plans
      const pQ = query(collection(db, 'userPlans'), where('userId', '==', u.uid));
      const pSnap = await getDocs(pQ);
      const plansData: UserPlan[] = [];
      pSnap.forEach(d => plansData.push(d.data() as UserPlan));
      setSelectedUserPlans(plansData);

      // 3. User deposits and withdrawals from already synced state
      setSelectedUserDeposits(allDeposits.filter(d => d.userId === u.uid));
      setSelectedUserWithdrawals(allWithdrawals.filter(w => w.userId === u.uid));
    } catch (e) {
      console.warn("User detail fetch notice:", e);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    const reason = rejectionReason.trim() || 'Verification declined by Administrator';
    if (rejectingItem.type === 'deposit') {
      await rejectDeposit(rejectingItem.item, reason);
    } else {
      await updateWithdrawalStatus(rejectingItem.item, 'REJECTED', reason);
    }
    setRejectingItem(null);
    setRejectionReason('');
  };

  const pendingDeposits = allDeposits.filter(d => d.status === 'PENDING');
  const pendingWithdrawals = allWithdrawals.filter(w => w.status === 'PENDING' || w.status === 'PROCESSING');

  // Filtered deposits
  const filteredDeposits = allDeposits.filter(d => {
    if (depositFilter !== 'ALL' && d.status !== depositFilter) return false;
    if (depositSearch.trim()) {
      const q = depositSearch.toLowerCase().trim();
      return (
        d.userEmail.toLowerCase().includes(q) ||
        (d.userName && d.userName.toLowerCase().includes(q)) ||
        d.transactionId.toLowerCase().includes(q) ||
        d.method.toLowerCase().includes(q) ||
        String(d.amount).includes(q)
      );
    }
    return true;
  });

  // Filtered withdrawals
  const filteredWithdrawals = allWithdrawals.filter(w => {
    if (withdrawalFilter !== 'ALL' && w.status !== withdrawalFilter) return false;
    if (withdrawalSearch.trim()) {
      const q = withdrawalSearch.toLowerCase().trim();
      return (
        w.userEmail.toLowerCase().includes(q) ||
        (w.userName && w.userName.toLowerCase().includes(q)) ||
        w.accountNumber.toLowerCase().includes(q) ||
        w.accountTitle.toLowerCase().includes(q) ||
        w.method.toLowerCase().includes(q) ||
        String(w.amount).includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              OPERATIONAL ADMIN DASHBOARD (/admin)
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
            Assigned Administrator Workspace
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Audit payment receipts, verify Transaction IDs, disburse withdrawal requests, and monitor farmer activity.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-emerald-500/30 p-3.5 rounded-2xl text-xs space-y-1.5 shrink-0">
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Admin Account</span>
          <span className="font-mono font-bold text-white block">{currentUser?.email}</span>
          <div className="flex flex-wrap gap-1 text-[9px] pt-1">
            {perms.canApproveDeposits && <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">Deposits</span>}
            {perms.canProcessWithdrawals && <span className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold">Withdrawals</span>}
            {perms.canManageUsers && <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-bold">Users</span>}
            {perms.canViewTransactions && <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">Ledger</span>}
            {perms.canViewReferrals && <span className="bg-teal-950 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30 font-bold">Teams</span>}
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {perms.canApproveDeposits && (
          <button
            onClick={() => setActiveTab('deposits')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'deposits'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposits ({pendingDeposits.length})</span>
            {pendingDeposits.length > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {pendingDeposits.length}
              </span>
            )}
          </button>
        )}

        {perms.canProcessWithdrawals && (
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'withdrawals'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdrawals ({pendingWithdrawals.length})</span>
            {pendingWithdrawals.length > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {pendingWithdrawals.length}
              </span>
            )}
          </button>
        )}

        {perms.canManageUsers && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management ({usersList.length})</span>
          </button>
        )}

        {perms.canViewTransactions && (
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'transactions'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Transactions Ledger</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'plans'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Plans Overview (50)</span>
        </button>

        <button
          onClick={() => setActiveTab('user-plans')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'user-plans'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>User Purchased Plans ({allUserPlans.length})</span>
          {allUserPlans.filter(p => p.status === 'PENDING').length > 0 && (
            <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
              {allUserPlans.filter(p => p.status === 'PENDING').length} Pending
            </span>
          )}
        </button>

        {perms.canViewReferrals && (
          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'referrals'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Referral Activity</span>
          </button>
        )}
      </div>

      {/* 1. DEPOSITS TAB */}
      {activeTab === 'deposits' && perms.canApproveDeposits && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-black text-white font-['Outfit']">
                Deposit Management
              </h3>
              <p className="text-xs text-slate-400">
                Review payment receipts, confirm Transaction IDs (TID), and approve funds to user balance.
              </p>
            </div>

            {/* Filter chips & Search */}
            <div className="flex flex-wrap items-center gap-2">
              {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setDepositFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    depositFilter === status
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {status} ({status === 'ALL' ? allDeposits.length : allDeposits.filter(d => d.status === status).length})
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by user email, TID, method, or amount..."
              value={depositSearch}
              onChange={(e) => setDepositSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-3">
            {filteredDeposits.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No deposit requests match this filter.
              </div>
            ) : (
              filteredDeposits.map((dep) => {
                const isPending = dep.status === 'PENDING';
                return (
                  <div
                    key={dep.id}
                    className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isPending 
                        ? 'bg-slate-950 border-amber-500/40 ring-1 ring-amber-500/20' 
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white font-['Outfit']">
                          {dep.amount.toLocaleString()} PKR
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          {dep.method}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          dep.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          dep.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {dep.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 space-y-0.5">
                        <p><strong>Farmer:</strong> {dep.userName || 'User'} ({dep.userEmail})</p>
                        {dep.planName && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold my-1">
                            <span>🐔 Linked Plan:</span>
                            <span className="font-black text-white">{dep.planName}</span>
                            <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">Auto-Activates</span>
                          </div>
                        )}
                        <p><strong>Sender Phone / Acct:</strong> <span className="font-mono text-emerald-400">{dep.senderAccount}</span></p>
                        <p><strong>Transaction ID (TID):</strong> <span className="font-mono text-amber-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{dep.transactionId}</span></p>
                        {dep.notes && <p className="text-slate-400 italic">"{dep.notes}"</p>}
                        <p className="text-[10px] text-slate-500">{new Date(dep.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:self-center">
                      {dep.proofUrl && (
                        <button
                          onClick={() => setPreviewProofUrl(dep.proofUrl || null)}
                          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </button>
                      )}

                      {isPending && (
                        <>
                          <button
                            onClick={() => approveDeposit(dep)}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1 shadow-lg shadow-emerald-500/20 transition active:scale-95"
                          >
                            <Check className="w-4 h-4" />
                            <span>{dep.planName || dep.userPlanId ? 'Approve & Activate Flock' : 'Approve'}</span>
                          </button>
                          <button
                            onClick={() => setRejectingItem({ type: 'deposit', item: dep })}
                            className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-950 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-1 transition active:scale-95"
                          >
                            <X className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. WITHDRAWALS TAB */}
      {activeTab === 'withdrawals' && perms.canProcessWithdrawals && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-black text-white font-['Outfit']">
                Withdrawal Payout Management
              </h3>
              <p className="text-xs text-slate-400">
                Disburse verified farmer balances to Easypaisa or JazzCash recipient accounts.
              </p>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-2">
              {(['PENDING', 'PROCESSING', 'PAID', 'REJECTED', 'ALL'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setWithdrawalFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    withdrawalFilter === status
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {status} ({status === 'ALL' ? allWithdrawals.length : allWithdrawals.filter(w => w.status === status).length})
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by user email, account number, or amount..."
              value={withdrawalSearch}
              onChange={(e) => setWithdrawalSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-3">
            {filteredWithdrawals.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No withdrawal requests found for this filter.
              </div>
            ) : (
              filteredWithdrawals.map((w) => {
                const isPendingOrProc = w.status === 'PENDING' || w.status === 'PROCESSING';
                return (
                  <div
                    key={w.id}
                    className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isPendingOrProc 
                        ? 'bg-slate-950 border-purple-500/40 ring-1 ring-purple-500/20' 
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white font-['Outfit']">
                          {w.amount.toLocaleString()} PKR
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-500/30">
                          {w.method}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          w.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          w.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                          w.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {w.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 space-y-0.5">
                        <p><strong>Recipient:</strong> {w.accountTitle} ({w.userEmail})</p>
                        <p><strong>Account Number:</strong> <span className="font-mono text-purple-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{w.accountNumber}</span></p>
                        {w.adminNote && <p className="text-slate-400 italic">Admin Note: "{w.adminNote}"</p>}
                        <p className="text-[10px] text-slate-500">{new Date(w.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:self-center">
                      {isPendingOrProc && (
                        <>
                          <button
                            onClick={() => updateWithdrawalStatus(w, 'PAID', 'Disbursed via App')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1 shadow transition active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Paid</span>
                          </button>
                          {w.status !== 'PROCESSING' && (
                            <button
                              onClick={() => updateWithdrawalStatus(w, 'PROCESSING', 'Processing in Banking Queue')}
                              className="px-3 py-2 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-300 font-bold text-xs flex items-center gap-1 border border-blue-500/30 transition"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Processing</span>
                            </button>
                          )}
                          <button
                            onClick={() => setRejectingItem({ type: 'withdrawal', item: w })}
                            className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-950 text-red-300 font-bold text-xs flex items-center gap-1 border border-red-500/30 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject & Refund</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. USER MANAGEMENT TAB */}
      {activeTab === 'users' && perms.canManageUsers && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-black text-white font-['Outfit']">
                User Management Directory
              </h3>
              <p className="text-xs text-slate-400">
                View user profiles, inspect wallet balances, audit transactions, and activate or suspend accounts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setUserStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    userStatusFilter === st
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by username, email, referral code, or UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[550px] overflow-y-auto">
            {usersList
              .filter(u => {
                if (userStatusFilter !== 'ALL' && u.status !== userStatusFilter) return false;
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase().trim();
                  return (
                    u.email.toLowerCase().includes(q) ||
                    u.username.toLowerCase().includes(q) ||
                    (u.referralCode && u.referralCode.toLowerCase().includes(q)) ||
                    u.uid.toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .map((u) => {
                const isActive = u.status === 'ACTIVE';
                return (
                  <div key={u.uid} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{u.username}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          u.role === 'OWNER' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {u.role}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-red-500/20 text-red-300 border-red-500/40'
                        }`}>
                          {u.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
                        <span>Email: <strong className="text-slate-200">{u.email}</strong></span>
                        <span>Ref Code: <strong className="font-mono text-emerald-400">{u.referralCode}</strong></span>
                        {u.referredBy && <span>Referred By: <strong className="font-mono text-amber-400">{u.referredBy}</strong></span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectUser(u)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      {u.role !== 'OWNER' && (
                        <button
                          onClick={() => toggleUserStatus(u.uid, u.status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            isActive
                              ? 'bg-red-950/60 hover:bg-red-950 text-red-300 border border-red-500/30'
                              : 'bg-emerald-950/60 hover:bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          <span>{isActive ? 'Suspend' : 'Activate'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 4. TRANSACTIONS TAB */}
      {activeTab === 'transactions' && perms.canViewTransactions && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-black text-white font-['Outfit']">System Financial Ledger</h3>
              <p className="text-xs text-slate-400">Real-time immutable ledger of deposits, withdrawals, purchases, and rewards.</p>
            </div>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-500/30">
              {transactions.length} Recorded Transactions
            </span>
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No transactions recorded yet.</div>
            ) : (
              transactions.map((t) => (
                <div key={t.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs flex justify-between items-center">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{t.description}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">{t.type}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      User: {t.userId.slice(0, 8)}... | Ref: {t.referenceId || 'N/A'} | {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`font-black text-sm font-['Outfit'] ${
                    t.direction === 'CREDIT' ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {t.direction === 'CREDIT' ? '+' : '-'}{t.amount.toLocaleString()} PKR
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. PLANS OVERVIEW TAB */}
      {activeTab === 'plans' && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase mb-1">
                <ShoppingBag className="w-3 h-3" />
                <span>Owner Master Catalog</span>
              </div>
              <h3 className="text-lg font-black text-white font-['Outfit']">
                50 Hen Plans Catalog Overview
              </h3>
              <p className="text-xs text-slate-400">
                Current status, pricing, and yield statistics for all 50 slots. (Full edits managed in Owner Panel).
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search plan # or price..."
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 max-h-[600px] overflow-y-auto pr-1">
            {plans
              .filter(p => {
                if (planSearch.trim()) {
                  const q = planSearch.toLowerCase().trim();
                  return p.name.toLowerCase().includes(q) || String(p.planNumber) === q || String(p.price).includes(q);
                }
                return true;
              })
              .map((p) => {
                const isActive = p.status === 'ACTIVE';
                const henCount = p.henQuantity || p.planNumber;
                return (
                  <div key={p.id} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-amber-400">{p.name}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <HenIllustration color={p.henColor} size={42} quantity={henCount} image={p.henImage} />
                      <div>
                        <h5 className="font-bold text-white text-xs">{henCount} {henCount === 1 ? 'Hen' : 'Hens'}</h5>
                        <p className="text-emerald-400 font-extrabold text-sm">{p.price.toLocaleString()} PKR</p>
                        <p className="text-[10px] text-slate-400">{p.cycleDays} Days Cycle</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-2 rounded-xl text-[11px] text-slate-300 flex justify-between">
                      <span>Daily Harvest:</span>
                      <span className="font-bold text-amber-400">{p.dailyEggs} Eggs/Day</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 6. REFERRAL ACTIVITY TAB */}
      {activeTab === 'referrals' && perms.canViewReferrals && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-black text-white font-['Outfit']">Referral Network Activity</h3>
              <p className="text-xs text-slate-400">Track user invitation linkages and referral commission bonuses.</p>
            </div>
            <button
              onClick={loadReferrals}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loadingReferrals ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {referralsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No referral connections recorded yet.</div>
            ) : (
              referralsList.map((ref, idx) => (
                <div key={ref.id || idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white">Farmer: {ref.refereeUsername || ref.refereeEmail}</span>
                    <p className="text-[11px] text-slate-400">
                      Referred by UID: <span className="font-mono text-emerald-400">{ref.referrerId}</span> | Level: {ref.level || 1}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-400">
                    +{ref.totalCommissionEarned || 0} PKR Commission
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* USER PURCHASED PLANS MANAGEMENT TAB */}
      {activeTab === 'user-plans' && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="pb-2 border-b border-slate-800">
            <h3 className="text-lg font-black text-white font-['Outfit']">
              User Purchased Plans & Roost Management
            </h3>
            <p className="text-xs text-slate-400">
              Audit all user flocks: view pending/active/expired plans, activate or deactivate roosts, edit plan status/hens/dates, and inspect linked deposits.
            </p>
          </div>
          <UserPlansManager />
        </div>
      )}

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl relative my-8 space-y-4">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Farmer Audit File</span>
                <h4 className="text-xl font-black text-white font-['Outfit']">{selectedUser.username}</h4>
                <span className="text-xs text-slate-400 font-mono">{selectedUser.email} (UID: {selectedUser.uid})</span>
              </div>
            </div>

            {loadingUserDetails ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading farmer records...</div>
            ) : (
              <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
                {/* Financial Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Balance</span>
                    <span className="text-base font-black text-emerald-400 font-['Outfit']">
                      {(selectedUserWallet?.balance || 0).toLocaleString()} PKR
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Inventory Eggs</span>
                    <span className="text-base font-black text-amber-400 font-['Outfit']">
                      {(selectedUserWallet?.availableEggs || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Deposited</span>
                    <span className="text-base font-bold text-white font-['Outfit']">
                      {(selectedUserWallet?.totalDeposited || 0).toLocaleString()} PKR
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Withdrawn</span>
                    <span className="text-base font-bold text-white font-['Outfit']">
                      {(selectedUserWallet?.totalWithdrawn || 0).toLocaleString()} PKR
                    </span>
                  </div>
                </div>

                {/* Profile attributes */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <p><strong>Account Status:</strong> <span className={selectedUser.status === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{selectedUser.status}</span></p>
                  <p><strong>Referral Code:</strong> <span className="font-mono text-emerald-400">{selectedUser.referralCode}</span></p>
                  {selectedUser.referredBy && <p><strong>Invited By:</strong> <span className="font-mono text-amber-400">{selectedUser.referredBy}</span></p>}
                  <p><strong>Registered:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>

                {/* Active Roosts / Purchased Plans */}
                <div className="space-y-2">
                  <h5 className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>User Purchased Plans & Roosts</span>
                  </h5>
                  <UserPlansManager filterUserId={selectedUser.uid} />
                </div>

                {/* Deposits by this user */}
                <div className="space-y-2">
                  <h5 className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                    <span>User Deposits ({selectedUserDeposits.length})</span>
                  </h5>
                  {selectedUserDeposits.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">No deposits submitted.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {selectedUserDeposits.map(d => (
                        <div key={d.id} className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-[11px]">
                          <span>{d.amount.toLocaleString()} PKR ({d.method}) - TID: {d.transactionId}</span>
                          <span className={`font-bold ${
                            d.status === 'APPROVED' ? 'text-emerald-400' : d.status === 'REJECTED' ? 'text-red-400' : 'text-amber-400'
                          }`}>{d.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Withdrawals by this user */}
                <div className="space-y-2">
                  <h5 className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
                    <span>User Withdrawals ({selectedUserWithdrawals.length})</span>
                  </h5>
                  {selectedUserWithdrawals.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">No withdrawal requests.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {selectedUserWithdrawals.map(w => (
                        <div key={w.id} className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-[11px]">
                          <span>{w.amount.toLocaleString()} PKR ({w.method}) - Acct: {w.accountNumber}</span>
                          <span className={`font-bold ${
                            w.status === 'PAID' ? 'text-emerald-400' : w.status === 'REJECTED' ? 'text-red-400' : 'text-amber-400'
                          }`}>{w.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold"
              >
                Close Audit File
              </button>
              {selectedUser.role !== 'OWNER' && (
                <button
                  onClick={async () => {
                    await toggleUserStatus(selectedUser.uid, selectedUser.status);
                    setSelectedUser({ ...selectedUser, status: selectedUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' });
                    loadUsers();
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                    selectedUser.status === 'ACTIVE'
                      ? 'bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/40'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                  }`}
                >
                  {selectedUser.status === 'ACTIVE' ? 'Suspend Farmer Account' : 'Activate Farmer Account'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h4 className="text-base font-black text-white font-['Outfit']">
                Confirm Rejection ({rejectingItem.type === 'deposit' ? 'Deposit' : 'Withdrawal'})
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {rejectingItem.type === 'deposit'
                ? `You are declining the deposit of ${rejectingItem.item.amount} PKR for ${rejectingItem.item.userEmail}.`
                : `You are declining the withdrawal of ${rejectingItem.item.amount} PKR. The full amount will be refunded to the user's confirmed balance.`}
            </p>

            <div>
              <label className="block text-slate-400 mb-1 text-xs font-semibold">Reason for Rejection</label>
              <textarea
                rows={3}
                placeholder="e.g. Invalid Transaction ID, Screenshot unreadable, Account mismatch..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition active:scale-95"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROOF SCREENSHOT PREVIEW MODAL */}
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
