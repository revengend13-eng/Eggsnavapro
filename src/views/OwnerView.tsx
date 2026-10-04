import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  ShieldCheck, 
  Settings, 
  CreditCard, 
  ShoppingBag, 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileText, 
  Check, 
  X, 
  Search, 
  Edit3, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  Trash2, 
  UserPlus, 
  Lock, 
  ExternalLink,
  RotateCw,
  Power,
  Globe,
  DollarSign,
  TrendingUp,
  Sliders,
  BellRing,
  Sparkles
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { 
  HenPlan, 
  DepositRequest, 
  WithdrawalRequest, 
  SystemSettings, 
  UserProfile, 
  Wallet,
  AdminPermissions 
} from '../types';
import { ReauthModal } from '../components/ReauthModal';
import { HenIllustration, EggIllustration } from '../components/FarmIllustrations';
import { PRESET_HEN_OPTIONS, PRESET_EGG_OPTIONS } from '../data/henAssets';

export const OwnerView: React.FC = () => {
  const { 
    currentUser, 
    isOwner, 
    createAdminAccount, 
    updateAdminPermissions, 
    deleteAdminAccount, 
    toggleAdminStatus 
  } = useAuth();

  const { 
    plans, 
    settings, 
    allDeposits, 
    allWithdrawals, 
    auditLogs, 
    approveDeposit, 
    rejectDeposit, 
    updateWithdrawalStatus, 
    savePlan, 
    seedAll50Plans,
    saveSettings,
    adjustUserBalance,
    toggleUserStatus
  } = useFarm();

  const [activeTab, setActiveTab] = useState<
    'kpis' | 'plans' | 'website' | 'payments' | 'referrals' | 'system' | 'admins' | 'users' | 'deposits' | 'withdrawals' | 'audit'
  >('kpis');

  // Reauth modal state
  const [reauthOpen, setReauthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Users and Admins list
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUserWallet, setSelectedUserWallet] = useState<Wallet | null>(null);

  // Plan editing modal
  const [editingPlan, setEditingPlan] = useState<HenPlan | null>(null);
  const [ownerPlanFilter, setOwnerPlanFilter] = useState<'all' | 'active' | 'inactive' | '1-10' | '11-25' | '26-50'>('all');
  const [ownerPlanSearch, setOwnerPlanSearch] = useState('');
  const [planSaveToast, setPlanSaveToast] = useState<string | null>(null);
  const [seedingPlans, setSeedingPlans] = useState(false);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<SystemSettings>(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Admin creation form
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPerms, setAdminPerms] = useState<AdminPermissions>({
    canApproveDeposits: true,
    canProcessWithdrawals: true,
    canManageUsers: true,
    canViewTransactions: true,
    canViewReferrals: true
  });
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  // Selected admin for permission editing
  const [editingAdmin, setEditingAdmin] = useState<UserProfile | null>(null);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const loadAllUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach(d => list.push(d.data() as UserProfile));
      setAllUsers(list);
    } catch (e) {
      console.warn("Load users notice:", e);
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, [activeTab]);

  const handleSelectUser = async (user: UserProfile) => {
    setSelectedUser(user);
    try {
      const wSnap = await getDoc(doc(db, 'wallets', user.uid));
      if (wSnap.exists()) {
        setSelectedUserWallet(wSnap.data() as Wallet);
      } else {
        setSelectedUserWallet(null);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const executeGuarded = (action: () => void) => {
    setPendingAction(() => action);
    setReauthOpen(true);
  };

  const handleReauthSuccess = () => {
    setReauthOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Calculations
  const adminsList = allUsers.filter(u => u.role === 'ADMIN');
  const regularUsersList = allUsers.filter(u => u.role === 'USER');
  const activeUsersCount = allUsers.filter(u => u.status === 'ACTIVE').length;
  const verifiedDepositsTotal = allDeposits.filter(d => d.status === 'APPROVED').reduce((sum, d) => sum + d.amount, 0);
  const pendingDeposits = allDeposits.filter(d => d.status === 'PENDING');
  const disbursedWithdrawalsTotal = allWithdrawals.filter(w => w.status === 'PAID').reduce((sum, w) => sum + w.amount, 0);
  const pendingWithdrawals = allWithdrawals.filter(w => w.status === 'PENDING' || w.status === 'PROCESSING');
  const activePlansCount = plans.filter(p => p.status === 'ACTIVE').length;

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminUsername.trim() || !adminPassword) {
      setAdminFeedback('All fields are required');
      return;
    }
    try {
      await createAdminAccount(adminEmail.trim(), adminUsername.trim(), adminPassword, adminPerms);
      setAdminFeedback('Admin account created successfully!');
      setTimeout(() => {
        setShowCreateAdminModal(false);
        setAdminEmail('');
        setAdminUsername('');
        setAdminPassword('');
        setAdminFeedback(null);
        loadAllUsers();
      }, 1500);
    } catch (err: any) {
      setAdminFeedback(err.message || 'Failed to create admin');
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Super Owner Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-emerald-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              OWNER MASTER CONTROL PANEL (/owner)
            </span>
            <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
              Root Level
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
            EGGS NAVA PRO — Platform Super-Admin
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Full governance suite: Configure all 30 hen plans, payment rails, admin permissions, user ledgers, and site switches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 text-xs text-slate-300">
            <span className="text-amber-400 block text-[10px] uppercase font-black">Authorized Owner</span>
            <span className="font-mono font-bold text-white">{currentUser?.email}</span>
          </div>
        </div>
      </div>

      {/* Owner Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'kpis', label: 'Dashboard KPIs', icon: TrendingUp },
          { id: 'plans', label: `Plan Management (50)`, icon: ShoppingBag, badge: activePlansCount },
          { id: 'payments', label: 'Payment Gateways', icon: CreditCard },
          { id: 'website', label: 'Website Settings', icon: Globe },
          { id: 'referrals', label: 'Referral Tiers', icon: Users },
          { id: 'system', label: 'System Controls', icon: Sliders },
          { id: 'admins', label: `Admins (${adminsList.length})`, icon: ShieldCheck },
          { id: 'users', label: `Farmers (${regularUsersList.length})`, icon: Users },
          { id: 'deposits', label: `Deposits (${pendingDeposits.length})`, icon: ArrowDownLeft, badge: pendingDeposits.length || undefined },
          { id: 'withdrawals', label: `Withdrawals (${pendingWithdrawals.length})`, icon: ArrowUpRight, badge: pendingWithdrawals.length || undefined },
          { id: 'audit', label: 'Audit Trail', icon: FileText },
        ].map((tab) => {
          const IconC = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <IconC className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. KPIS TAB */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-emerald-500/30 p-5 rounded-3xl">
              <span className="text-xs text-slate-400 block font-semibold">Total Verified Deposits</span>
              <span className="text-2xl font-black text-emerald-400 font-['Outfit'] mt-1 block">
                {verifiedDepositsTotal.toLocaleString()} PKR
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Pending: {pendingDeposits.length} ({pendingDeposits.reduce((s,d)=>s+d.amount,0).toLocaleString()} PKR)
              </span>
            </div>

            <div className="bg-slate-900/90 border border-purple-500/30 p-5 rounded-3xl">
              <span className="text-xs text-slate-400 block font-semibold">Total Disbursed Withdrawals</span>
              <span className="text-2xl font-black text-purple-400 font-['Outfit'] mt-1 block">
                {disbursedWithdrawalsTotal.toLocaleString()} PKR
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Pending: {pendingWithdrawals.length} requests
              </span>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/30 p-5 rounded-3xl">
              <span className="text-xs text-slate-400 block font-semibold">Total Users & Active Farmers</span>
              <span className="text-2xl font-black text-white font-['Outfit'] mt-1 block">
                {allUsers.length} <span className="text-sm font-normal text-slate-400">Total</span>
              </span>
              <span className="text-[11px] text-emerald-400 mt-1 block">
                {activeUsersCount} Active / {adminsList.length} Appointed Admins
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl">
              <span className="text-xs text-slate-400 block font-semibold">Configured Hen Plans</span>
              <span className="text-2xl font-black text-amber-400 font-['Outfit'] mt-1 block">
                {activePlansCount} / 50 Active
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                50 dynamic slots in Firestore
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. PLAN MANAGEMENT (ALL 50 PLANS) */}
      {activeTab === 'plans' && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="text-lg font-black text-white font-['Outfit']">
                  PLAN MANAGEMENT (50 HEN FLOCK SLOTS)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Edit prices, hen quantities, cycle days, daily eggs, egg values, colors, images, and active switches. All changes save directly to Firestore.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-emerald-400 font-bold bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-500/30">
                {activePlansCount} of 50 Active in Store
              </span>
              <button
                onClick={async () => {
                  setSeedingPlans(true);
                  await seedAll50Plans();
                  setSeedingPlans(false);
                  setPlanSaveToast('All 50 plans successfully synchronized and saved to Firestore!');
                  setTimeout(() => setPlanSaveToast(null), 3500);
                }}
                disabled={seedingPlans}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
              >
                <RotateCw className={`w-3.5 h-3.5 ${seedingPlans ? 'animate-spin' : ''}`} />
                <span>{seedingPlans ? 'Syncing...' : 'Sync All 50 Plans to Firestore'}</span>
              </button>
            </div>
          </div>

          {planSaveToast && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{planSaveToast}</span>
              </div>
              <button onClick={() => setPlanSaveToast(null)} className="text-emerald-400/80 hover:text-emerald-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: `All 50 Plans (${plans.length})` },
                { id: '1-10', label: 'Plans 1–10' },
                { id: '11-25', label: 'Plans 11–25' },
                { id: '26-50', label: 'Plans 26–50' },
                { id: 'active', label: `Active (${plans.filter(p => p.status === 'ACTIVE').length})` },
                { id: 'inactive', label: `Inactive (${plans.filter(p => p.status === 'INACTIVE').length})` },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setOwnerPlanFilter(chip.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    ownerPlanFilter === chip.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search plan #, hens, or PKR..."
                value={ownerPlanSearch}
                onChange={(e) => setOwnerPlanSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* 50 Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plans
              .filter(p => {
                if (ownerPlanFilter === 'active' && p.status !== 'ACTIVE') return false;
                if (ownerPlanFilter === 'inactive' && p.status !== 'INACTIVE') return false;
                if (ownerPlanFilter === '1-10' && (p.planNumber < 1 || p.planNumber > 10)) return false;
                if (ownerPlanFilter === '11-25' && (p.planNumber < 11 || p.planNumber > 25)) return false;
                if (ownerPlanFilter === '26-50' && (p.planNumber < 26 || p.planNumber > 50)) return false;

                if (ownerPlanSearch.trim()) {
                  const q = ownerPlanSearch.toLowerCase().trim();
                  return (
                    p.name.toLowerCase().includes(q) ||
                    String(p.planNumber) === q ||
                    String(p.price).includes(q) ||
                    `${p.henQuantity || p.planNumber}`.includes(q) ||
                    (p.henType || '').toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .map((p) => {
                const isActive = p.status === 'ACTIVE';
                const henCount = p.henQuantity || p.planNumber;
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition shadow-lg relative flex flex-col justify-between ${
                      isActive 
                        ? 'bg-slate-950 border-emerald-500/40 ring-1 ring-emerald-500/20' 
                        : 'bg-slate-950/60 border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-amber-400">
                          {p.name}
                        </span>
                        <button
                          onClick={() => {
                            const updated: HenPlan = {
                              ...p,
                              status: isActive ? 'INACTIVE' : 'ACTIVE'
                            };
                            savePlan(updated);
                          }}
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border transition ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {isActive ? 'ACTIVE' : 'INACTIVE'} (Toggle)
                        </button>
                      </div>

                      <div className="flex items-center gap-3 py-1">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          <HenIllustration color={p.henColor} size={36} quantity={henCount} image={p.henImage} />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{p.name}</h4>
                          <p className="text-[11px] text-amber-400 font-semibold">{henCount} {henCount === 1 ? 'Hen' : 'Hens'}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{p.henType || 'Heritage Layer'}</p>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Price:</span>
                          <span className="font-extrabold text-white">{p.price.toLocaleString()} PKR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cycle:</span>
                          <span className="font-bold text-white">{p.cycleDays} Days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Daily Harvest:</span>
                          <span className="font-bold text-amber-400">{p.dailyEggs} Eggs/Day</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Egg Value:</span>
                          <span className="font-bold text-emerald-400">{p.eggValuePkr} PKR/Egg</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        onClick={() => setEditingPlan(p)}
                        className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Plan Settings</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Edit Plan Modal */}
          {editingPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
              <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4 my-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-amber-400" />
                    <h4 className="text-lg font-black text-white font-['Outfit']">
                      Configure {editingPlan.name} (Slot #{editingPlan.planNumber})
                    </h4>
                  </div>
                  <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
                  {/* Live Visual Preview Card */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <HenIllustration 
                        color={editingPlan.henColor} 
                        size={56} 
                        quantity={editingPlan.henQuantity || editingPlan.planNumber}
                        image={editingPlan.henImage} 
                      />
                      <div>
                        <span className="text-amber-400 font-mono text-[10px] font-bold block">
                          Slot #{editingPlan.planNumber} • {editingPlan.henQuantity || editingPlan.planNumber} {editingPlan.henQuantity === 1 ? 'Hen' : 'Hens'}
                        </span>
                        <h5 className="font-black text-white text-sm">{editingPlan.name}</h5>
                        <span className="text-[11px] text-emerald-400 font-bold">
                          {editingPlan.price.toLocaleString()} PKR • {editingPlan.cycleDays} Days
                        </span>
                      </div>
                    </div>
                    <div className="text-right border-l border-slate-800 pl-3">
                      <span className="text-[10px] text-slate-400 block">Daily Harvest</span>
                      <span className="text-xs font-black text-amber-400 flex items-center justify-end gap-1">
                        <EggIllustration size={14} color={editingPlan.eggColor || '#fef3c7'} image={editingPlan.eggImage} />
                        {editingPlan.dailyEggs} Eggs
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold block">
                        {(editingPlan.dailyEggs * editingPlan.eggValuePkr).toLocaleString()} PKR/day
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Plan Display Name</label>
                      <input
                        type="text"
                        value={editingPlan.name}
                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Hen Quantity (Count)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={editingPlan.henQuantity || editingPlan.planNumber}
                        onChange={(e) => setEditingPlan({ ...editingPlan, henQuantity: parseInt(e.target.value) || 1 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Price (PKR)</label>
                      <input
                        type="number"
                        value={editingPlan.price}
                        onChange={(e) => setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Cycle Duration (Days)</label>
                      <input
                        type="number"
                        value={editingPlan.cycleDays}
                        onChange={(e) => setEditingPlan({ ...editingPlan, cycleDays: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>
                  </div>

                  {/* Reward Configuration Box */}
                  <div className="p-3 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 space-y-2.5">
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Reward & Egg Production Configuration</span>
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Daily Eggs Produced</label>
                        <input
                          type="number"
                          value={editingPlan.dailyEggs}
                          onChange={(e) => setEditingPlan({ ...editingPlan, dailyEggs: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Egg Value (PKR/Egg)</label>
                        <input
                          type="number"
                          value={editingPlan.eggValuePkr}
                          onChange={(e) => setEditingPlan({ ...editingPlan, eggValuePkr: parseInt(e.target.value) || 40 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-emerald-400"
                        />
                      </div>
                    </div>
                    {/* Live Calculated Reward Summary */}
                    <div className="p-2 bg-slate-950/80 rounded-xl border border-emerald-500/20 text-[11px] flex justify-between items-center">
                      <span className="text-slate-400">Total Cycle Estimated Yield:</span>
                      <span className="font-black text-emerald-400">
                        {(editingPlan.dailyEggs * editingPlan.eggValuePkr * editingPlan.cycleDays).toLocaleString()} PKR ({editingPlan.cycleDays} Days)
                      </span>
                    </div>
                  </div>

                  {/* Realistic Hen Visual Selection */}
                  <div className="space-y-1.5 p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                    <label className="block text-slate-400 font-semibold">Hen Image (Realistic Preset or Custom URL)</label>
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {PRESET_HEN_OPTIONS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setEditingPlan({ ...editingPlan, henImage: preset.url })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border ${
                            editingPlan.henImage === preset.url
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste custom image URL: https://..."
                      value={editingPlan.henImage || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, henImage: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-[11px]"
                    />
                  </div>

                  {/* Realistic Egg Visual Selection */}
                  <div className="space-y-1.5 p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                    <label className="block text-slate-400 font-semibold">Egg Image (Realistic Preset or Custom URL)</label>
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {PRESET_EGG_OPTIONS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setEditingPlan({ ...editingPlan, eggImage: preset.url })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border ${
                            editingPlan.eggImage === preset.url
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste custom image URL: https://..."
                      value={editingPlan.eggImage || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, eggImage: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-[11px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Hen Feather Color</label>
                      <input
                        type="color"
                        value={editingPlan.henColor || '#f59e0b'}
                        onChange={(e) => setEditingPlan({ ...editingPlan, henColor: e.target.value })}
                        className="w-full h-9 bg-slate-950 border border-slate-700 rounded-xl p-1"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Egg Shell Color</label>
                      <input
                        type="color"
                        value={editingPlan.eggColor || '#fef3c7'}
                        onChange={(e) => setEditingPlan({ ...editingPlan, eggColor: e.target.value })}
                        className="w-full h-9 bg-slate-950 border border-slate-700 rounded-xl p-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Store Status</label>
                    <select
                      value={editingPlan.status}
                      onChange={(e) => setEditingPlan({ ...editingPlan, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      <option value="ACTIVE">ACTIVE (Visible in User Store with BUY button)</option>
                      <option value="INACTIVE">INACTIVE (Hidden / Disabled)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Description</label>
                    <textarea
                      rows={2}
                      value={editingPlan.description}
                      onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Plan Terms & Conditions</label>
                    <textarea
                      rows={2}
                      value={editingPlan.terms}
                      onChange={(e) => setEditingPlan({ ...editingPlan, terms: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditingPlan(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await savePlan(editingPlan);
                      setPlanSaveToast(`Changes to ${editingPlan.name} saved to Firestore!`);
                      setTimeout(() => setPlanSaveToast(null), 3500);
                      setEditingPlan(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg transition active:scale-95"
                  >
                    Save Changes to Firestore
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PAYMENT GATEWAYS SETTINGS */}
      {activeTab === 'payments' && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white font-['Outfit']">
                Easypaisa & JazzCash Gateway Settings
              </h3>
              <p className="text-xs text-slate-400">
                Configure account numbers, recipient titles, limits, fees, and deposit/withdrawal switches.
              </p>
            </div>

            <button
              onClick={() => {
                executeGuarded(async () => {
                  await saveSettings(settingsForm);
                  setSettingsSaved(true);
                  setTimeout(() => setSettingsSaved(false), 3000);
                });
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

          {settingsSaved && (
            <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Payment configurations saved to Firestore!</span>
            </div>
          )}

          {/* Master Payment Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">User Deposits ON / OFF</span>
                <span className="text-slate-400 text-[11px]">Allow users to submit new deposit requests</span>
              </div>
              <button
                type="button"
                onClick={() => setSettingsForm({ ...settingsForm, depositEnabled: !settingsForm.depositEnabled })}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
                  settingsForm.depositEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-red-950 text-red-400 border border-red-500/40'
                }`}
              >
                {settingsForm.depositEnabled ? 'ENABLED' : 'PAUSED'}
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">User Withdrawals ON / OFF</span>
                <span className="text-slate-400 text-[11px]">Allow users to submit payout requests</span>
              </div>
              <button
                type="button"
                onClick={() => setSettingsForm({ ...settingsForm, withdrawalEnabled: !settingsForm.withdrawalEnabled })}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
                  settingsForm.withdrawalEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-red-950 text-red-400 border border-red-500/40'
                }`}
              >
                {settingsForm.withdrawalEnabled ? 'ENABLED' : 'PAUSED'}
              </button>
            </div>
          </div>

          {/* Account Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <span className="font-bold text-emerald-400 text-sm block">Easypaisa Channel</span>
              <div>
                <label className="block text-slate-400 mb-1">Mobile Account Number</label>
                <input
                  type="text"
                  value={settingsForm.easypaisaNumber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, easypaisaNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Account Title</label>
                <input
                  type="text"
                  value={settingsForm.easypaisaTitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, easypaisaTitle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <span className="font-bold text-amber-400 text-sm block">JazzCash Channel</span>
              <div>
                <label className="block text-slate-400 mb-1">Mobile Account Number</label>
                <input
                  type="text"
                  value={settingsForm.jazzcashNumber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, jazzcashNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Account Title</label>
                <input
                  type="text"
                  value={settingsForm.jazzcashTitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, jazzcashTitle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Limits and fees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-slate-400 font-semibold">Min / Max Deposit (PKR)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={settingsForm.minDeposit}
                  onChange={(e) => setSettingsForm({ ...settingsForm, minDeposit: parseInt(e.target.value) || 0 })}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
                <input
                  type="number"
                  value={settingsForm.maxDeposit}
                  onChange={(e) => setSettingsForm({ ...settingsForm, maxDeposit: parseInt(e.target.value) || 0 })}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-slate-400 font-semibold">Min / Max Withdrawal (PKR)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={settingsForm.minWithdrawal}
                  onChange={(e) => setSettingsForm({ ...settingsForm, minWithdrawal: parseInt(e.target.value) || 0 })}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
                <input
                  type="number"
                  value={settingsForm.maxWithdrawal}
                  onChange={(e) => setSettingsForm({ ...settingsForm, maxWithdrawal: parseInt(e.target.value) || 0 })}
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-slate-400 font-semibold">Withdrawal Fee (%)</label>
              <input
                type="number"
                value={settingsForm.withdrawalFeePercent}
                onChange={(e) => setSettingsForm({ ...settingsForm, withdrawalFeePercent: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. WEBSITE SETTINGS */}
      {activeTab === 'website' && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white font-['Outfit']">
              Website & Branding Identity
            </h3>
            <button
              onClick={() => {
                executeGuarded(async () => {
                  await saveSettings(settingsForm);
                  setSettingsSaved(true);
                  setTimeout(() => setSettingsSaved(false), 3000);
                });
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save Website Info</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Website Display Name</label>
              <input
                type="text"
                value={settingsForm.appName}
                onChange={(e) => setSettingsForm({ ...settingsForm, appName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Primary Currency</label>
              <input
                type="text"
                value={settingsForm.currency}
                onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Support WhatsApp</label>
              <input
                type="text"
                value={settingsForm.whatsappNumber}
                onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Support Email</label>
              <input
                type="email"
                value={settingsForm.supportEmail}
                onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. REFERRAL SETTINGS */}
      {activeTab === 'referrals' && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white font-['Outfit']">
              Multi-Tier Referral Commission Rules
            </h3>
            <button
              onClick={() => {
                executeGuarded(async () => {
                  await saveSettings(settingsForm);
                  setSettingsSaved(true);
                  setTimeout(() => setSettingsSaved(false), 3000);
                });
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save Referral Rules</span>
            </button>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white block">Referral Network System</span>
              <span className="text-slate-400 text-[11px]">Enable multi-tier commission credits on flock purchases</span>
            </div>
            <button
              type="button"
              onClick={() => setSettingsForm({ ...settingsForm, referralEnabled: !settingsForm.referralEnabled })}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
                settingsForm.referralEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-red-950 text-red-400 border border-red-500/40'
              }`}
            >
              {settingsForm.referralEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <label className="block text-slate-400 font-semibold">Tier 1 (Direct) Commission %</label>
              <input
                type="number"
                value={settingsForm.referralCommissionTier1}
                onChange={(e) => setSettingsForm({ ...settingsForm, referralCommissionTier1: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <label className="block text-slate-400 font-semibold">Tier 2 Commission %</label>
              <input
                type="number"
                value={settingsForm.referralCommissionTier2}
                onChange={(e) => setSettingsForm({ ...settingsForm, referralCommissionTier2: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <label className="block text-slate-400 font-semibold">Tier 3 Commission %</label>
              <input
                type="number"
                value={settingsForm.referralCommissionTier3}
                onChange={(e) => setSettingsForm({ ...settingsForm, referralCommissionTier3: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. SYSTEM SETTINGS & CONTROLS */}
      {activeTab === 'system' && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white font-['Outfit']">
              Platform Master System Switches
            </h3>
            <button
              onClick={() => {
                executeGuarded(async () => {
                  await saveSettings(settingsForm);
                  setSettingsSaved(true);
                  setTimeout(() => setSettingsSaved(false), 3000);
                });
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save System Controls</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Platform Maintenance Mode</span>
                <span className="text-slate-400 text-[11px]">Display maintenance notice to general users</span>
              </div>
              <button
                type="button"
                onClick={() => setSettingsForm({ ...settingsForm, maintenanceMode: !settingsForm.maintenanceMode })}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
                  settingsForm.maintenanceMode ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settingsForm.maintenanceMode ? 'ACTIVE' : 'OFF'}
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">New User Registrations</span>
                <span className="text-slate-400 text-[11px]">Allow new farmer accounts to register</span>
              </div>
              <button
                type="button"
                onClick={() => setSettingsForm({ ...settingsForm, registrationEnabled: !settingsForm.registrationEnabled })}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
                  settingsForm.registrationEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-red-950 text-red-400'
                }`}
              >
                {settingsForm.registrationEnabled ? 'OPEN' : 'CLOSED'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. ADMIN MANAGEMENT (OWNER EXCLUSIVE) */}
      {activeTab === 'admins' && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white font-['Outfit']">
                  Appointed Admins & Granular Permissions
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                OWNER can create admin accounts and assign exact permissions. Admins do NOT have Owner settings access.
              </p>
            </div>

            <button
              onClick={() => setShowCreateAdminModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Admin</span>
            </button>
          </div>

          {/* Admins List */}
          <div className="space-y-3">
            {adminsList.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No sub-admins appointed yet. Click 'Create New Admin' to delegate operational tasks.
              </p>
            ) : (
              adminsList.map((adm) => (
                <div
                  key={adm.uid}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{adm.username}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30">
                        ADMIN
                      </span>
                      <span className={`text-[10px] font-bold ${adm.status === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {adm.status}
                      </span>
                    </div>
                    <p className="text-slate-400 font-mono text-[11px]">{adm.email}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                      {adm.adminPermissions?.canApproveDeposits && (
                        <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                          Deposits
                        </span>
                      )}
                      {adm.adminPermissions?.canProcessWithdrawals && (
                        <span className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                          Withdrawals
                        </span>
                      )}
                      {adm.adminPermissions?.canManageUsers && (
                        <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                          Users
                        </span>
                      )}
                      {adm.adminPermissions?.canViewTransactions && (
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          Transactions
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingAdmin(adm)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold"
                    >
                      Permissions
                    </button>
                    <button
                      onClick={() => toggleAdminStatus(adm.uid, adm.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        adm.status === 'ACTIVE'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {adm.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete admin account ${adm.email}?`)) {
                          deleteAdminAccount(adm.uid);
                          loadAllUsers();
                        }
                      }}
                      className="p-1.5 rounded-xl bg-red-950/60 text-red-400 hover:bg-red-900 border border-red-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create Admin Modal */}
          {showCreateAdminModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-white font-['Outfit']">
                    Appoint New Admin
                  </h4>
                  <button onClick={() => setShowCreateAdminModal(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Admin Email</label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@eggsnavapro.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Admin Username</label>
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Moderator_Ali"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Temporary Password</label>
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  {/* Permission Checkboxes */}
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="font-bold text-white block">Assigned Permissions</span>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={adminPerms.canApproveDeposits}
                        onChange={(e) => setAdminPerms({ ...adminPerms, canApproveDeposits: e.target.checked })}
                      />
                      <span>Can Approve & Reject Deposits</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={adminPerms.canProcessWithdrawals}
                        onChange={(e) => setAdminPerms({ ...adminPerms, canProcessWithdrawals: e.target.checked })}
                      />
                      <span>Can Process & Disburse Withdrawals</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={adminPerms.canManageUsers}
                        onChange={(e) => setAdminPerms({ ...adminPerms, canManageUsers: e.target.checked })}
                      />
                      <span>Can View Directory & Suspend Users</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={adminPerms.canViewTransactions}
                        onChange={(e) => setAdminPerms({ ...adminPerms, canViewTransactions: e.target.checked })}
                      />
                      <span>Can View Transaction Ledger</span>
                    </label>
                  </div>

                  {adminFeedback && (
                    <p className="text-amber-400 text-xs font-semibold">{adminFeedback}</p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateAdminModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow"
                    >
                      Confirm Appointment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Admin Permissions Modal */}
          {editingAdmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">
                    Permissions: {editingAdmin.username}
                  </h4>
                  <button onClick={() => setEditingAdmin(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingAdmin.adminPermissions?.canApproveDeposits ?? false}
                      onChange={(e) => setEditingAdmin({
                        ...editingAdmin,
                        adminPermissions: {
                          ...(editingAdmin.adminPermissions || {
                            canApproveDeposits: false,
                            canProcessWithdrawals: false,
                            canManageUsers: false,
                            canViewTransactions: false,
                            canViewReferrals: false
                          }),
                          canApproveDeposits: e.target.checked
                        }
                      })}
                    />
                    <span>Can Approve & Reject Deposits</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingAdmin.adminPermissions?.canProcessWithdrawals ?? false}
                      onChange={(e) => setEditingAdmin({
                        ...editingAdmin,
                        adminPermissions: {
                          ...(editingAdmin.adminPermissions || {
                            canApproveDeposits: false,
                            canProcessWithdrawals: false,
                            canManageUsers: false,
                            canViewTransactions: false,
                            canViewReferrals: false
                          }),
                          canProcessWithdrawals: e.target.checked
                        }
                      })}
                    />
                    <span>Can Process & Disburse Withdrawals</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingAdmin.adminPermissions?.canManageUsers ?? false}
                      onChange={(e) => setEditingAdmin({
                        ...editingAdmin,
                        adminPermissions: {
                          ...(editingAdmin.adminPermissions || {
                            canApproveDeposits: false,
                            canProcessWithdrawals: false,
                            canManageUsers: false,
                            canViewTransactions: false,
                            canViewReferrals: false
                          }),
                          canManageUsers: e.target.checked
                        }
                      })}
                    />
                    <span>Can View & Suspend Users</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditingAdmin(null)}
                    className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (editingAdmin.adminPermissions) {
                        await updateAdminPermissions(editingAdmin.uid, editingAdmin.adminPermissions);
                        setEditingAdmin(null);
                        loadAllUsers();
                      }
                    }}
                    className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black"
                  >
                    Save Permissions
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-black text-white font-['Outfit']">Farmer Directory</h3>
            <input
              type="text"
              placeholder="Search user email or username..."
              value={searchUserQuery}
              onChange={(e) => setSearchUserQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
            {allUsers
              .filter(u => u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) || u.username.toLowerCase().includes(searchUserQuery.toLowerCase()))
              .map((u) => (
                <div key={u.uid} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{u.username}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-amber-400">
                        {u.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleUserStatus(u.uid, u.status)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold ${
                        u.status === 'ACTIVE' ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 9. DEPOSITS AUDIT */}
      {activeTab === 'deposits' && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-3">
          <h3 className="text-lg font-black text-white font-['Outfit']">Deposit Audit</h3>
          <div className="space-y-3">
            {allDeposits.map((dep) => (
              <div key={dep.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-white">{dep.amount.toLocaleString()} PKR ({dep.method})</span>
                  <p className="text-slate-400 font-mono text-[11px]">User: {dep.userEmail} | TID: {dep.transactionId}</p>
                </div>
                {dep.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <button onClick={() => approveDeposit(dep)} className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold">
                      Approve
                    </button>
                    <button onClick={() => rejectDeposit(dep, 'Invalid TID')} className="px-3 py-1.5 rounded-xl bg-red-950 text-red-400 font-bold">
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                    {dep.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. WITHDRAWALS AUDIT */}
      {activeTab === 'withdrawals' && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-3">
          <h3 className="text-lg font-black text-white font-['Outfit']">Withdrawal Disbursals</h3>
          <div className="space-y-3">
            {allWithdrawals.map((w) => (
              <div key={w.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-white">{w.amount.toLocaleString()} PKR ({w.method})</span>
                  <p className="text-slate-400 font-mono text-[11px]">Account: {w.accountNumber} ({w.accountTitle})</p>
                </div>
                {w.status === 'PENDING' || w.status === 'PROCESSING' ? (
                  <div className="flex gap-2">
                    <button onClick={() => updateWithdrawalStatus(w, 'PAID', 'Disbursed')} className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold">
                      Mark Paid
                    </button>
                    <button onClick={() => updateWithdrawalStatus(w, 'REJECTED', 'Refunded')} className="px-3 py-1.5 rounded-xl bg-red-950 text-red-400 font-bold">
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                    {w.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-3">
          <h3 className="text-lg font-black text-white font-['Outfit']">ADMIN_AUDIT_LOG Records</h3>
          <div className="space-y-2 divide-y divide-slate-800">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-white">{log.action}</span>
                  <p className="text-slate-400 text-[11px]">{log.details}</p>
                </div>
                <div className="text-right text-[10px] text-slate-500 font-mono">
                  <span>{log.adminEmail}</span>
                  <span className="block">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Re-Authentication Guard Modal */}
      <ReauthModal
        isOpen={reauthOpen}
        onSuccess={handleReauthSuccess}
        onCancel={() => {
          setReauthOpen(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
};
