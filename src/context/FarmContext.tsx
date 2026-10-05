import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import { 
  HenPlan, 
  UserPlan, 
  Wallet, 
  Transaction, 
  DepositRequest, 
  WithdrawalRequest, 
  SystemSettings, 
  NotificationItem,
  PaymentMethod,
  AdminAuditLog
} from '../types';
import { INITIAL_PLANS } from '../data/initialPlans';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';

interface FarmContextType {
  wallet: Wallet | null;
  plans: HenPlan[];
  userPlans: UserPlan[];
  transactions: Transaction[];
  notifications: NotificationItem[];
  settings: SystemSettings;
  loading: boolean;
  activeHensCount: number;
  availableHarvestCount: number;
  totalEggsHarvested: number;
  
  // User Actions
  buyPlan: (plan: HenPlan) => Promise<{ success: boolean; message: string }>;
  collectEggs: (userPlanId?: string) => Promise<{ success: boolean; collected: number; message: string }>;
  sellEggs: (eggCount: number) => Promise<{ success: boolean; pkrEarned: number; message: string }>;
  submitDeposit: (
    amount: number, 
    method: PaymentMethod, 
    senderAccount: string, 
    txId: string, 
    proofUrl?: string, 
    notes?: string,
    userPlanId?: string,
    planId?: string,
    planName?: string,
    planNumber?: number
  ) => Promise<{ success: boolean; message: string }>;
  submitWithdrawal: (
    amount: number, 
    method: PaymentMethod, 
    accountNumber: string, 
    accountTitle: string
  ) => Promise<{ success: boolean; message: string }>;
  claimDailyCheckin: () => Promise<{ success: boolean; message: string }>;
  createPendingUserPlan: (plan: HenPlan) => Promise<{ success: boolean; userPlanId?: string; message: string }>;

  // Admin / Owner Actions
  allUserPlans: UserPlan[];
  allDeposits: DepositRequest[];
  allWithdrawals: WithdrawalRequest[];
  auditLogs: AdminAuditLog[];
  approveDeposit: (deposit: DepositRequest) => Promise<void>;
  rejectDeposit: (deposit: DepositRequest, reason: string) => Promise<void>;
  updateWithdrawalStatus: (withdrawal: WithdrawalRequest, newStatus: 'PROCESSING' | 'PAID' | 'REJECTED', note?: string) => Promise<void>;
  activateUserPlan: (userPlanId: string) => Promise<void>;
  deactivateUserPlan: (userPlanId: string, reason?: string) => Promise<void>;
  updateUserPlanDetails: (userPlanId: string, updates: Partial<UserPlan>) => Promise<void>;
  savePlan: (plan: HenPlan) => Promise<void>;
  seedAll50Plans: () => Promise<void>;
  saveSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  adjustUserBalance: (targetUserId: string, amount: number, direction: 'CREDIT' | 'DEBIT', note: string) => Promise<void>;
  toggleUserStatus: (targetUserId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => Promise<void>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, isAdmin, isOwner } = useAuth();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [plans, setPlans] = useState<HenPlan[]>(INITIAL_PLANS);
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Admin specific datasets
  const [allUserPlans, setAllUserPlans] = useState<UserPlan[]>([]);
  const [allDeposits, setAllDeposits] = useState<DepositRequest[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // 1. Initialize and sync Global Settings
  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'global_config');
    const unsub = onSnapshot(settingsDocRef, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as SystemSettings);
      } else {
        setSettings(DEFAULT_SETTINGS);
        if (currentUser && isAdmin) {
          setDoc(settingsDocRef, DEFAULT_SETTINGS).catch(err => {
            console.warn("Could not bootstrap settings:", err);
          });
        }
      }
    }, (error) => {
      console.warn("Settings listener notice:", error);
    });

    return () => unsub();
  }, [currentUser, isAdmin]);

  // 2. Initialize and sync Plans catalog (all 50 plans)
  useEffect(() => {
    const plansColl = collection(db, 'plans');
    const unsub = onSnapshot(plansColl, async (snap) => {
      const loadedPlans: HenPlan[] = [];
      snap.forEach(docSnap => {
        loadedPlans.push(docSnap.data() as HenPlan);
      });

      // Ensure all 50 slots (Plan 1 to Plan 50) are present
      INITIAL_PLANS.forEach(initP => {
        const existingIdx = loadedPlans.findIndex(lp => lp.planNumber === initP.planNumber || lp.id === initP.id);
        if (existingIdx === -1) {
          loadedPlans.push(initP);
          if (currentUser && isAdmin) {
            setDoc(doc(db, 'plans', initP.id), initP).catch(e => console.warn(e));
          }
        } else {
          // Backfill images or fields if missing from previous database records
          if (!loadedPlans[existingIdx].henImage) {
            loadedPlans[existingIdx].henImage = initP.henImage;
          }
          if (!loadedPlans[existingIdx].eggImage) {
            loadedPlans[existingIdx].eggImage = initP.eggImage;
          }
          if (!loadedPlans[existingIdx].henQuantity) {
            loadedPlans[existingIdx].henQuantity = initP.henQuantity || initP.planNumber;
          }
        }
      });

      loadedPlans.sort((a, b) => a.planNumber - b.planNumber);
      setPlans(loadedPlans);
    }, (error) => {
      console.warn("Plans listener error:", error);
    });

    return () => unsub();
  }, [currentUser, isAdmin]);

  // 3. User-specific real-time listeners (Wallet, UserPlans, Transactions, Notifications)
  useEffect(() => {
    if (!currentUser) {
      setWallet(null);
      setUserPlans([]);
      setTransactions([]);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Wallet listener
    const walletDocRef = doc(db, 'wallets', currentUser.uid);
    const unsubWallet = onSnapshot(walletDocRef, (snap) => {
      if (snap.exists()) {
        setWallet(snap.data() as Wallet);
      } else {
        // Create initial wallet if missing
        const newWallet: Wallet = {
          userId: currentUser.uid,
          balance: 0,
          availableEggs: 0,
          pendingDeposits: 0,
          pendingWithdrawals: 0,
          totalDeposited: 0,
          totalWithdrawn: 0,
          totalEggRewards: 0,
          totalReferralRewards: 0,
          updatedAt: new Date().toISOString()
        };
        setDoc(walletDocRef, newWallet).catch(e => console.warn(e));
        setWallet(newWallet);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Wallet listener error:", error);
      setLoading(false);
    });

    // User Plans listener
    const userPlansQ = query(
      collection(db, 'userPlans'),
      where('userId', '==', currentUser.uid)
    );
    const unsubUserPlans = onSnapshot(userPlansQ, (snap) => {
      const plansList: UserPlan[] = [];
      snap.forEach(docSnap => {
        plansList.push(docSnap.data() as UserPlan);
      });
      setUserPlans(plansList);
    }, (error) => {
      console.warn("UserPlans listener error:", error);
    });

    // Transactions listener
    const txQ = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid)
    );
    const unsubTx = onSnapshot(txQ, (snap) => {
      const txList: Transaction[] = [];
      snap.forEach(docSnap => {
        txList.push(docSnap.data() as Transaction);
      });
      txList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(txList);
    }, (error) => {
      console.warn("Transactions listener error:", error);
    });

    // Notifications listener
    const notifQ = query(
      collection(db, 'notifications'),
      where('userId', 'in', [currentUser.uid, 'ALL'])
    );
    const unsubNotif = onSnapshot(notifQ, (snap) => {
      const nList: NotificationItem[] = [];
      snap.forEach(docSnap => {
        nList.push(docSnap.data() as NotificationItem);
      });
      nList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(nList);
    }, (error) => {
      console.warn("Notifications listener error:", error);
    });

    return () => {
      unsubWallet();
      unsubUserPlans();
      unsubTx();
      unsubNotif();
    };
  }, [currentUser]);

  // 4. Admin Listeners (UserPlans, Deposits, Withdrawals, Audit Logs)
  useEffect(() => {
    if (!currentUser || !isAdmin) {
      setAllUserPlans([]);
      setAllDeposits([]);
      setAllWithdrawals([]);
      setAuditLogs([]);
      return;
    }

    // All user plans (Pending, Active, Expired)
    const allPlansQ = collection(db, 'userPlans');
    const unsubAllPlans = onSnapshot(allPlansQ, (snap) => {
      const list: UserPlan[] = [];
      snap.forEach(d => list.push(d.data() as UserPlan));
      list.sort((a, b) => new Date(b.createdAt || b.startDate || '').getTime() - new Date(a.createdAt || a.startDate || '').getTime());
      setAllUserPlans(list);
    }, (err) => console.warn("Admin allUserPlans error:", err));

    // All deposits
    const depositsQ = collection(db, 'deposits');
    const unsubDeposits = onSnapshot(depositsQ, (snap) => {
      const list: DepositRequest[] = [];
      snap.forEach(d => list.push(d.data() as DepositRequest));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllDeposits(list);
    }, (err) => console.warn("Admin deposits error:", err));

    // All withdrawals
    const withdrawalsQ = collection(db, 'withdrawals');
    const unsubWithdrawals = onSnapshot(withdrawalsQ, (snap) => {
      const list: WithdrawalRequest[] = [];
      snap.forEach(d => list.push(d.data() as WithdrawalRequest));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllWithdrawals(list);
    }, (err) => console.warn("Admin withdrawals error:", err));

    // Audit logs
    const logsQ = collection(db, 'adminAuditLogs');
    const unsubLogs = onSnapshot(logsQ, (snap) => {
      const list: AdminAuditLog[] = [];
      snap.forEach(d => list.push(d.data() as AdminAuditLog));
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditLogs(list);
    }, (err) => console.warn("Admin logs error:", err));

    return () => {
      unsubAllPlans();
      unsubDeposits();
      unsubWithdrawals();
      unsubLogs();
    };
  }, [currentUser, isAdmin]);

  // Helper to log Admin operations
  const logAdminAction = async (action: string, targetType: string, targetId: string, details: string) => {
    if (!currentUser) return;
    try {
      const logRef = doc(collection(db, 'adminAuditLogs'));
      const logEntry: AdminAuditLog = {
        id: logRef.id,
        adminId: currentUser.uid,
        adminEmail: currentUser.email || 'Admin',
        action,
        targetType,
        targetId,
        details,
        timestamp: new Date().toISOString()
      };
      await setDoc(logRef, logEntry);
    } catch (e) {
      console.error("Failed to log admin action:", e);
    }
  };

  // Computations
  const activeHensCount = userPlans.filter(p => p.status === 'ACTIVE').length;
  
  // Calculate how many eggs are available for collection right now across active flocks
  const now = Date.now();
  let availableHarvestCount = 0;
  let totalEggsHarvested = 0;

  userPlans.forEach(plan => {
    if (plan.status === 'ACTIVE') {
      totalEggsHarvested += (plan.eggsCollectedTotal || 0);
      const lastCollect = new Date(plan.lastCollectedAt).getTime();
      const diffMs = now - lastCollect;
      // 1 digital harvest cycle every 24 hours (or proportional for game testing)
      const hoursPassed = diffMs / (1000 * 60 * 60);
      if (hoursPassed >= 0.05) { // Can collect if at least a few minutes passed since last collection or initial buy
        availableHarvestCount += plan.dailyEggs;
      }
    }
  });

  // USER ACTION: BUY PLAN
  const buyPlan = async (plan: HenPlan): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !wallet) {
      return { success: false, message: 'Please log in to purchase a digital hen plan.' };
    }

    if (plan.status !== 'ACTIVE') {
      return { success: false, message: 'This plan is currently not available.' };
    }

    if (wallet.balance < plan.price) {
      return { 
        success: false, 
        message: `Insufficient confirmed balance. You need ${plan.price.toLocaleString()} PKR. Please deposit funds first.` 
      };
    }

    try {
      // Execute atomic transaction on Firestore
      await runTransaction(db, async (transaction) => {
        const walletRef = doc(db, 'wallets', currentUser.uid);
        const walletSnap = await transaction.get(walletRef);
        
        if (!walletSnap.exists()) {
          throw new Error('Wallet not found');
        }

        const currentBal = walletSnap.data().balance || 0;
        if (currentBal < plan.price) {
          throw new Error('Insufficient funds during transaction confirmation');
        }

        const newBalance = currentBal - plan.price;
        const nowIso = new Date().toISOString();
        const endIso = new Date(Date.now() + plan.cycleDays * 24 * 60 * 60 * 1000).toISOString();

        // 1. Update wallet balance
        transaction.update(walletRef, {
          balance: newBalance,
          updatedAt: nowIso
        });

        // 2. Create UserPlan document
        const newUserPlanRef = doc(collection(db, 'userPlans'));
        const newUserPlan: UserPlan = {
          id: newUserPlanRef.id,
          userId: currentUser.uid,
          planId: plan.id,
          planName: plan.name,
          purchasePrice: plan.price,
          cycleDays: plan.cycleDays,
          dailyEggs: plan.dailyEggs,
          eggValuePkr: plan.eggValuePkr,
          eggsCollectedTotal: 0,
          lastCollectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Allow instant first harvest!
          startDate: nowIso,
          endDate: endIso,
          status: 'ACTIVE',
          henType: plan.henType,
          henColor: plan.henColor,
          eggColor: plan.eggColor,
          henImage: plan.henImage || '',
          eggImage: plan.eggImage || '',
          henQuantity: plan.henQuantity || plan.planNumber
        };
        transaction.set(newUserPlanRef, newUserPlan);

        // 3. Create immutable Transaction record
        const newTxRef = doc(collection(db, 'transactions'));
        const txRecord: Transaction = {
          id: newTxRef.id,
          userId: currentUser.uid,
          type: 'PLAN_PURCHASE',
          amount: plan.price,
          direction: 'DEBIT',
          status: 'COMPLETED',
          referenceId: newUserPlanRef.id,
          description: `Acquired ${plan.name} (${plan.cycleDays} Days Coop)`,
          createdAt: nowIso
        };
        transaction.set(newTxRef, txRecord);
      });

      // Handle referral commission if user was referred
      if (userProfile?.referredBy && settings.referralEnabled) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('referralCode', '==', userProfile.referredBy));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const referrer = snap.docs[0].data();
            const commission = Math.round(plan.price * (settings.referralCommissionTier1 / 100));
            if (commission > 0) {
              const refWalletRef = doc(db, 'wallets', referrer.uid);
              const refWalletSnap = await getDoc(refWalletRef);
              if (refWalletSnap.exists()) {
                const cur = refWalletSnap.data();
                await updateDoc(refWalletRef, {
                  balance: (cur.balance || 0) + commission,
                  totalReferralRewards: (cur.totalReferralRewards || 0) + commission,
                  updatedAt: new Date().toISOString()
                });

                // Record commission transaction
                const commTxRef = doc(collection(db, 'transactions'));
                await setDoc(commTxRef, {
                  id: commTxRef.id,
                  userId: referrer.uid,
                  type: 'REFERRAL_REWARD',
                  amount: commission,
                  direction: 'CREDIT',
                  status: 'COMPLETED',
                  referenceId: currentUser.uid,
                  description: `Referral commission from ${userProfile.username || 'team member'} purchase`,
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        } catch (commErr) {
          console.warn("Referral commission notice:", commErr);
        }
      }

      return { success: true, message: `Successfully acquired ${plan.name}! Your hen is now nesting in your coop.` };
    } catch (error: any) {
      console.error("Buy plan error:", error);
      return { success: false, message: error.message || 'Failed to complete flock purchase' };
    }
  };

  // USER ACTION: SELECT / RESERVE PENDING PLAN FOR DEPOSIT
  const createPendingUserPlan = async (plan: HenPlan): Promise<{ success: boolean; userPlanId?: string; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Please log in to purchase a digital hen plan.' };
    }

    try {
      const nowIso = new Date().toISOString();
      const henCount = plan.henQuantity || plan.planNumber;
      
      // Check if user already has an unlinked PENDING reservation for this exact plan
      const existingPending = userPlans.find(p => 
        p.userId === currentUser.uid && 
        p.planId === plan.id && 
        p.status === 'PENDING' && 
        (!p.depositId || p.depositId === '')
      );

      if (existingPending) {
        // Refresh timestamps and ensure all fields are set
        const existingRef = doc(db, 'userPlans', existingPending.id);
        await updateDoc(existingRef, {
          uid: currentUser.uid,
          planNumber: plan.planNumber,
          price: plan.price,
          purchasePrice: plan.price,
          hens: henCount,
          henQuantity: henCount,
          dailyEggs: plan.dailyEggs,
          eggValuePkr: plan.eggValuePkr || 40,
          updatedAt: nowIso
        });

        return {
          success: true,
          userPlanId: existingPending.id,
          message: `Flock ${plan.name} selected! Please submit your deposit to activate this flock.`
        };
      }

      const newUserPlanRef = doc(collection(db, 'userPlans'));
      const pendingUserPlan: UserPlan = {
        id: newUserPlanRef.id,
        userId: currentUser.uid,
        uid: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: userProfile?.username || 'Farmer',
        planId: plan.id,
        planNumber: plan.planNumber,
        planName: plan.name,
        price: plan.price,
        purchasePrice: plan.price,
        cycleDays: plan.cycleDays || 60,
        dailyEggs: plan.dailyEggs,
        eggValuePkr: plan.eggValuePkr || 40,
        eggsCollectedTotal: 0,
        lastCollectedAt: '',
        startDate: '',
        endDate: '',
        status: 'PENDING',
        henType: plan.henType || 'Heritage Layer',
        henColor: plan.henColor || '#f59e0b',
        eggColor: plan.eggColor || '#fef3c7',
        henImage: plan.henImage || '',
        eggImage: plan.eggImage || '',
        henQuantity: henCount,
        hens: henCount,
        depositId: '',
        paymentId: '',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      await setDoc(newUserPlanRef, pendingUserPlan);

      return { 
        success: true, 
        userPlanId: newUserPlanRef.id, 
        message: `Plan ${plan.name} selected! Please submit your deposit to activate this flock.` 
      };
    } catch (e: any) {
      console.error("Create pending plan error:", e);
      return { success: false, message: e.message || 'Failed to reserve plan' };
    }
  };

  // USER ACTION: COLLECT DAILY EGGS
  const collectEggs = async (targetUserPlanId?: string): Promise<{ success: boolean; collected: number; message: string }> => {
    if (!currentUser || !wallet) {
      return { success: false, collected: 0, message: 'Please log in to harvest eggs.' };
    }

    const activeFlocks = userPlans.filter(p => p.status === 'ACTIVE' && (!targetUserPlanId || p.id === targetUserPlanId));
    if (activeFlocks.length === 0) {
      return { success: false, collected: 0, message: 'No active hen flocks ready for harvest.' };
    }

    let totalHarvestedThisRun = 0;
    const nowIso = new Date().toISOString();

    try {
      const batch = writeBatch(db);

      for (const flock of activeFlocks) {
        const lastCollect = new Date(flock.lastCollectedAt).getTime();
        const diffHours = (Date.now() - lastCollect) / (1000 * 60 * 60);

        // Allow harvest if at least a few minutes passed (or 24h in strict mode)
        if (diffHours >= 0.05) {
          const eggsLaid = flock.dailyEggs;
          totalHarvestedThisRun += eggsLaid;

          const flockRef = doc(db, 'userPlans', flock.id);
          batch.update(flockRef, {
            eggsCollectedTotal: (flock.eggsCollectedTotal || 0) + eggsLaid,
            lastCollectedAt: nowIso
          });
        }
      }

      if (totalHarvestedThisRun === 0) {
        return { 
          success: false, 
          collected: 0, 
          message: 'Hens are still nesting! Please check back later for your next harvest.' 
        };
      }

      // Update wallet availableEggs
      const walletRef = doc(db, 'wallets', currentUser.uid);
      batch.update(walletRef, {
        availableEggs: (wallet.availableEggs || 0) + totalHarvestedThisRun,
        updatedAt: nowIso
      });

      // Record transaction
      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, {
        id: txRef.id,
        userId: currentUser.uid,
        type: 'REWARD',
        amount: totalHarvestedThisRun,
        direction: 'CREDIT',
        status: 'COMPLETED',
        referenceId: 'HARVEST_' + Date.now(),
        description: `Harvested ${totalHarvestedThisRun} digital eggs from active hen coops`,
        createdAt: nowIso
      });

      await batch.commit();

      return { 
        success: true, 
        collected: totalHarvestedThisRun, 
        message: `Great harvest! Successfully collected ${totalHarvestedThisRun} fresh digital eggs.` 
      };
    } catch (err: any) {
      console.error("Egg collection error:", err);
      return { success: false, collected: 0, message: 'Failed to complete egg harvest. Try again.' };
    }
  };

  // USER ACTION: SELL / REDEEM EGGS INTO PKR
  const sellEggs = async (eggCount: number): Promise<{ success: boolean; pkrEarned: number; message: string }> => {
    if (!currentUser || !wallet) {
      return { success: false, pkrEarned: 0, message: 'Please log in to redeem eggs.' };
    }

    if (eggCount <= 0 || eggCount > (wallet.availableEggs || 0)) {
      return { success: false, pkrEarned: 0, message: 'Invalid egg quantity to redeem.' };
    }

    // Default rate: 40 PKR per egg (or from first active plan)
    const eggRate = plans.find(p => p.status === 'ACTIVE')?.eggValuePkr || 40;
    const pkrValue = eggCount * eggRate;
    const nowIso = new Date().toISOString();

    try {
      const batch = writeBatch(db);
      const walletRef = doc(db, 'wallets', currentUser.uid);

      batch.update(walletRef, {
        balance: (wallet.balance || 0) + pkrValue,
        availableEggs: (wallet.availableEggs || 0) - eggCount,
        totalEggRewards: (wallet.totalEggRewards || 0) + pkrValue,
        updatedAt: nowIso
      });

      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, {
        id: txRef.id,
        userId: currentUser.uid,
        type: 'EGG_SALE',
        amount: pkrValue,
        direction: 'CREDIT',
        status: 'COMPLETED',
        referenceId: 'REDEEM_' + Date.now(),
        description: `Redeemed ${eggCount} digital eggs for ${pkrValue.toLocaleString()} PKR`,
        createdAt: nowIso
      });

      await batch.commit();

      return { 
        success: true, 
        pkrEarned: pkrValue, 
        message: `Successfully redeemed ${eggCount} eggs for ${pkrValue.toLocaleString()} PKR balance!` 
      };
    } catch (err: any) {
      console.error("Sell eggs error:", err);
      return { success: false, pkrEarned: 0, message: 'Failed to process egg redemption.' };
    }
  };

  // USER ACTION: SUBMIT DEPOSIT REQUEST
  const submitDeposit = async (
    amount: number, 
    method: PaymentMethod, 
    senderAccount: string, 
    txId: string, 
    proofUrl?: string, 
    notes?: string,
    userPlanId?: string,
    planId?: string,
    planName?: string,
    planNumber?: number
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !wallet) {
      return { success: false, message: 'Please log in to submit a deposit.' };
    }

    if (!settings.depositEnabled) {
      return { success: false, message: 'Deposits are temporarily paused for maintenance.' };
    }

    if (amount < settings.minDeposit || amount > settings.maxDeposit) {
      return { 
        success: false, 
        message: `Deposit amount must be between ${settings.minDeposit.toLocaleString()} PKR and ${settings.maxDeposit.toLocaleString()} PKR.` 
      };
    }

    if (!senderAccount.trim() || !txId.trim()) {
      return { success: false, message: 'Sender account number and Transaction ID (TID) are required.' };
    }

    try {
      const nowIso = new Date().toISOString();
      const depRef = doc(collection(db, 'deposits'));

      // If userPlanId not passed, auto-link to any unlinked pending userPlan
      let effectiveUserPlanId = userPlanId;
      let effectivePlanId = planId;
      let effectivePlanName = planName;
      let effectivePlanNumber = planNumber;

      if (!effectiveUserPlanId) {
        const pendingPlan = userPlans.find(p => p.userId === currentUser.uid && p.status === 'PENDING' && (!p.depositId || p.depositId === ''));
        if (pendingPlan) {
          effectiveUserPlanId = pendingPlan.id;
          effectivePlanId = pendingPlan.planId;
          effectivePlanName = pendingPlan.planName;
          effectivePlanNumber = pendingPlan.planNumber;
        }
      }

      const depositData: DepositRequest = {
        id: depRef.id,
        userId: currentUser.uid,
        uid: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: userProfile?.username || 'User',
        amount,
        method,
        senderAccount: senderAccount.trim(),
        transactionId: txId.trim(),
        proofUrl: proofUrl || '',
        notes: notes || '',
        status: 'PENDING',
        createdAt: nowIso,
        ...(effectiveUserPlanId ? { 
          userPlanId: effectiveUserPlanId, 
          planId: effectivePlanId, 
          planName: effectivePlanName,
          planNumber: effectivePlanNumber
        } : {})
      };

      const batch = writeBatch(db);
      batch.set(depRef, depositData);

      // If linked to a pending user plan, link depositId on the user plan document
      if (effectiveUserPlanId) {
        const uPlanRef = doc(db, 'userPlans', effectiveUserPlanId);
        batch.update(uPlanRef, {
          depositId: depRef.id,
          paymentId: depRef.id,
          updatedAt: nowIso
        });
      }

      // Increment pending deposits on wallet
      const walletRef = doc(db, 'wallets', currentUser.uid);
      batch.update(walletRef, {
        pendingDeposits: (wallet.pendingDeposits || 0) + amount,
        updatedAt: nowIso
      });

      // Record pending transaction
      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, {
        id: txRef.id,
        userId: currentUser.uid,
        type: 'DEPOSIT',
        amount,
        direction: 'CREDIT',
        status: 'PENDING',
        referenceId: depRef.id,
        description: `Deposit request via ${method} (TID: ${txId.trim()})${effectivePlanName ? ` for ${effectivePlanName}` : ''}`,
        createdAt: nowIso
      });

      await batch.commit();

      return { 
        success: true, 
        message: effectiveUserPlanId 
          ? `Deposit request submitted for ${effectivePlanName || 'your plan'}! Your flock will automatically activate once confirmed by our audit team.` 
          : 'Deposit request submitted successfully! Funds will reflect in your wallet once verified by our audit team.' 
      };
    } catch (e: any) {
      console.error("Deposit submission error:", e);
      return { success: false, message: e.message || 'Failed to submit deposit request' };
    }
  };

  // USER ACTION: SUBMIT WITHDRAWAL REQUEST
  const submitWithdrawal = async (
    amount: number, 
    method: PaymentMethod, 
    accountNumber: string, 
    accountTitle: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !wallet) {
      return { success: false, message: 'Please log in to request a withdrawal.' };
    }

    if (!settings.withdrawalEnabled) {
      return { success: false, message: 'Withdrawals are temporarily paused for maintenance.' };
    }

    if (amount < settings.minWithdrawal || amount > settings.maxWithdrawal) {
      return { 
        success: false, 
        message: `Withdrawal amount must be between ${settings.minWithdrawal.toLocaleString()} PKR and ${settings.maxWithdrawal.toLocaleString()} PKR.` 
      };
    }

    if (wallet.balance < amount) {
      return { 
        success: false, 
        message: `Insufficient confirmed balance. You have ${wallet.balance.toLocaleString()} PKR available.` 
      };
    }

    if (!accountNumber.trim() || !accountTitle.trim()) {
      return { success: false, message: 'Account number and registered Account Title are required.' };
    }

    try {
      const fee = Math.round(amount * (settings.withdrawalFeePercent / 100));
      const netAmount = amount - fee;
      const nowIso = new Date().toISOString();

      const withRef = doc(collection(db, 'withdrawals'));
      const withdrawalData: WithdrawalRequest = {
        id: withRef.id,
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: userProfile?.username || 'User',
        amount,
        fee,
        netAmount,
        method,
        accountNumber: accountNumber.trim(),
        accountTitle: accountTitle.trim(),
        status: 'PENDING',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      const batch = writeBatch(db);
      batch.set(withRef, withdrawalData);

      // Lock funds: deduct from available balance and add to pendingWithdrawals
      const walletRef = doc(db, 'wallets', currentUser.uid);
      batch.update(walletRef, {
        balance: wallet.balance - amount,
        pendingWithdrawals: (wallet.pendingWithdrawals || 0) + amount,
        updatedAt: nowIso
      });

      // Record pending transaction
      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, {
        id: txRef.id,
        userId: currentUser.uid,
        type: 'WITHDRAWAL',
        amount,
        direction: 'DEBIT',
        status: 'PENDING',
        referenceId: withRef.id,
        description: `Withdrawal request to ${accountTitle} (${method} - ${accountNumber})`,
        createdAt: nowIso
      });

      await batch.commit();

      return { 
        success: true, 
        message: `Withdrawal request for ${amount.toLocaleString()} PKR submitted! Net payout after ${settings.withdrawalFeePercent}% fee: ${netAmount.toLocaleString()} PKR.` 
      };
    } catch (e: any) {
      console.error("Withdrawal request error:", e);
      return { success: false, message: e.message || 'Failed to submit withdrawal request' };
    }
  };

  // USER ACTION: CLAIM DAILY CHECKIN
  const claimDailyCheckin = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !wallet) {
      return { success: false, message: 'Please log in to claim daily streak.' };
    }

    const bonusPkr = 20;
    const nowIso = new Date().toISOString();

    try {
      const walletRef = doc(db, 'wallets', currentUser.uid);
      await updateDoc(walletRef, {
        balance: (wallet.balance || 0) + bonusPkr,
        updatedAt: nowIso
      });

      const txRef = doc(collection(db, 'transactions'));
      await setDoc(txRef, {
        id: txRef.id,
        userId: currentUser.uid,
        type: 'REWARD',
        amount: bonusPkr,
        direction: 'CREDIT',
        status: 'COMPLETED',
        referenceId: 'CHECKIN_' + new Date().toISOString().slice(0, 10),
        description: 'Daily Farmer Check-In Bonus',
        createdAt: nowIso
      });

      return { success: true, message: `Awesome! You received ${bonusPkr} PKR daily check-in reward.` };
    } catch (e: any) {
      return { success: false, message: 'Could not claim daily reward right now.' };
    }
  };

  // ADMIN ACTION: APPROVE DEPOSIT (With automatic linked plan activation)
  const approveDeposit = async (deposit: DepositRequest) => {
    if (!isAdmin) return;
    try {
      const nowIso = new Date().toISOString();

      await runTransaction(db, async (transaction) => {
        const depRef = doc(db, 'deposits', deposit.id);
        const depSnap = await transaction.get(depRef);
        if (!depSnap.exists() || depSnap.data().status !== 'PENDING') {
          throw new Error('Deposit is already processed or not found');
        }

        const walletRef = doc(db, 'wallets', deposit.userId);
        const walletSnap = await transaction.get(walletRef);
        
        let curBal = 0;
        let curPending = 0;
        let curTotalDep = 0;

        if (walletSnap.exists()) {
          const wData = walletSnap.data();
          curBal = wData.balance || 0;
          curPending = wData.pendingDeposits || 0;
          curTotalDep = wData.totalDeposited || 0;
        }

        // Check if this deposit is linked to a userPlan
        let linkedPlanSnap: any = null;
        let linkedPlanRef: any = null;
        if (deposit.userPlanId) {
          linkedPlanRef = doc(db, 'userPlans', deposit.userPlanId);
          linkedPlanSnap = await transaction.get(linkedPlanRef);
        }

        // 1. Update deposit status
        transaction.update(depRef, {
          status: 'APPROVED',
          approvedBy: currentUser?.email || 'Admin',
          reviewedAt: nowIso
        });

        // 2. Handle linked plan activation OR normal wallet balance credit
        if (linkedPlanSnap && linkedPlanSnap.exists()) {
          const pData = linkedPlanSnap.data() as UserPlan;
          
          // Prevent duplicate activation: only activate if currently PENDING
          if (pData.status === 'PENDING') {
            const cycleDays = pData.cycleDays || 60;
            const endIso = new Date(Date.now() + cycleDays * 24 * 60 * 60 * 1000).toISOString();
            
            transaction.update(linkedPlanRef, {
              status: 'ACTIVE',
              startDate: nowIso,
              endDate: endIso,
              lastCollectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Allow instant first harvest
              activatedAt: nowIso,
              depositId: deposit.id,
              updatedAt: nowIso
            });

            // Prevent duplicate balance credit:
            // Decrement pending deposits, increment totalDeposited.
            // If the user deposited more than the plan price, credit the surplus to balance; otherwise balance is not duplicated.
            const planCost = pData.purchasePrice || deposit.amount;
            const excessAmount = Math.max(0, deposit.amount - planCost);

            transaction.update(walletRef, {
              balance: curBal + excessAmount,
              pendingDeposits: Math.max(0, curPending - deposit.amount),
              totalDeposited: curTotalDep + deposit.amount,
              updatedAt: nowIso
            });

            // Record Plan Purchase transaction
            const planTxRef = doc(collection(db, 'transactions'));
            transaction.set(planTxRef, {
              id: planTxRef.id,
              userId: deposit.userId,
              type: 'PLAN_PURCHASE',
              amount: planCost,
              direction: 'DEBIT',
              status: 'COMPLETED',
              referenceId: pData.id,
              description: `Activated ${pData.planName} via approved deposit (${deposit.transactionId})`,
              adminNote: `Deposit approved by ${currentUser?.email}`,
              createdAt: nowIso
            });
          } else {
            // Linked plan was already active (e.g. manually activated earlier)
            // Just clear pending deposit and credit totalDeposited
            transaction.update(walletRef, {
              pendingDeposits: Math.max(0, curPending - deposit.amount),
              totalDeposited: curTotalDep + deposit.amount,
              updatedAt: nowIso
            });
          }
        } else {
          // Regular unlinked deposit: credit full amount to wallet balance
          transaction.update(walletRef, {
            balance: curBal + deposit.amount,
            pendingDeposits: Math.max(0, curPending - deposit.amount),
            totalDeposited: curTotalDep + deposit.amount,
            updatedAt: nowIso
          });
        }
      });

      // Update matching transaction record
      const txQ = query(
        collection(db, 'transactions'),
        where('referenceId', '==', deposit.id)
      );
      const txSnap = await getDocs(txQ);
      if (!txSnap.empty) {
        await updateDoc(doc(db, 'transactions', txSnap.docs[0].id), {
          status: 'COMPLETED',
          adminNote: `Approved by ${currentUser?.email}`
        });
      }

      await logAdminAction(
        'APPROVE_DEPOSIT',
        'Deposit',
        deposit.id,
        `Approved deposit of ${deposit.amount} PKR for user ${deposit.userEmail} (TID: ${deposit.transactionId})${deposit.userPlanId ? ` and activated linked plan ${deposit.planName || deposit.userPlanId}` : ''}`
      );
    } catch (e) {
      console.error("Approve deposit failed:", e);
      throw e;
    }
  };

  // ADMIN ACTION: MANUALLY ACTIVATE A PENDING OR INACTIVE PLAN
  const activateUserPlan = async (userPlanId: string) => {
    if (!isAdmin) return;
    try {
      const nowIso = new Date().toISOString();
      const planRef = doc(db, 'userPlans', userPlanId);
      const planSnap = await getDoc(planRef);
      if (!planSnap.exists()) {
        throw new Error('User plan not found');
      }
      const pData = planSnap.data() as UserPlan;
      if (pData.status === 'ACTIVE') {
        throw new Error('This plan is already active.');
      }

      const cycleDays = pData.cycleDays || 60;
      const endIso = new Date(Date.now() + cycleDays * 24 * 60 * 60 * 1000).toISOString();

      await updateDoc(planRef, {
        status: 'ACTIVE',
        startDate: nowIso,
        endDate: endIso,
        lastCollectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        activatedAt: nowIso,
        updatedAt: nowIso
      });

      // If there is a linked pending deposit, mark it approved as well and adjust wallet
      if (pData.depositId) {
        try {
          const depRef = doc(db, 'deposits', pData.depositId);
          const depSnap = await getDoc(depRef);
          if (depSnap.exists() && depSnap.data().status === 'PENDING') {
            await updateDoc(depRef, {
              status: 'APPROVED',
              approvedBy: currentUser?.email || 'Admin',
              reviewedAt: nowIso
            });
            const walletRef = doc(db, 'wallets', pData.userId);
            const wSnap = await getDoc(walletRef);
            if (wSnap.exists()) {
              const curPending = wSnap.data().pendingDeposits || 0;
              const curTot = wSnap.data().totalDeposited || 0;
              await updateDoc(walletRef, {
                pendingDeposits: Math.max(0, curPending - depSnap.data().amount),
                totalDeposited: curTot + depSnap.data().amount,
                updatedAt: nowIso
              });
            }
          }
        } catch (depErr) {
          console.warn("Linked deposit sync notice:", depErr);
        }
      }

      // Record transaction
      const txRef = doc(collection(db, 'transactions'));
      await setDoc(txRef, {
        id: txRef.id,
        userId: pData.userId,
        type: 'PLAN_PURCHASE',
        amount: pData.purchasePrice,
        direction: 'DEBIT',
        status: 'COMPLETED',
        referenceId: pData.id,
        description: `Manually activated ${pData.planName} by Admin`,
        adminNote: `Activated by ${currentUser?.email}`,
        createdAt: nowIso
      });

      await logAdminAction(
        'MANUAL_ACTIVATE_PLAN',
        'UserPlan',
        userPlanId,
        `Manually activated plan ${pData.planName} for user ${pData.userEmail || pData.userId}`
      );
    } catch (e) {
      console.error("Manual plan activation failed:", e);
      throw e;
    }
  };

  // ADMIN ACTION: DEACTIVATE A PLAN
  const deactivateUserPlan = async (userPlanId: string, reason?: string) => {
    if (!isAdmin) return;
    try {
      const nowIso = new Date().toISOString();
      const planRef = doc(db, 'userPlans', userPlanId);
      const planSnap = await getDoc(planRef);
      if (!planSnap.exists()) throw new Error('User plan not found');
      const pData = planSnap.data() as UserPlan;

      await updateDoc(planRef, {
        status: 'EXPIRED',
        deactivatedAt: nowIso,
        updatedAt: nowIso
      });

      await logAdminAction(
        'DEACTIVATE_PLAN',
        'UserPlan',
        userPlanId,
        `Deactivated plan ${pData.planName} for user ${pData.userEmail || pData.userId}. Reason: ${reason || 'Admin action'}`
      );
    } catch (e) {
      console.error("Deactivate plan failed:", e);
      throw e;
    }
  };

  // ADMIN ACTION: EDIT USER PLAN DETAILS (Status, Hens, Start Date, Expiry Date, Rewards)
  const updateUserPlanDetails = async (
    userPlanId: string,
    updates: {
      status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
      henQuantity?: number;
      startDate?: string;
      endDate?: string;
      dailyEggs?: number;
      eggValuePkr?: number;
    }
  ) => {
    if (!isAdmin) return;
    try {
      const nowIso = new Date().toISOString();
      const planRef = doc(db, 'userPlans', userPlanId);
      const planSnap = await getDoc(planRef);
      if (!planSnap.exists()) throw new Error('User plan not found');
      const pData = planSnap.data() as UserPlan;

      const sanitizedUpdates: any = {
        updatedAt: nowIso
      };
      if (updates.status !== undefined) sanitizedUpdates.status = updates.status;
      if (updates.henQuantity !== undefined) sanitizedUpdates.henQuantity = Number(updates.henQuantity);
      if (updates.startDate !== undefined) sanitizedUpdates.startDate = updates.startDate;
      if (updates.endDate !== undefined) sanitizedUpdates.endDate = updates.endDate;
      if (updates.dailyEggs !== undefined) sanitizedUpdates.dailyEggs = Number(updates.dailyEggs);
      if (updates.eggValuePkr !== undefined) sanitizedUpdates.eggValuePkr = Number(updates.eggValuePkr);

      await updateDoc(planRef, sanitizedUpdates);

      await logAdminAction(
        'EDIT_USER_PLAN',
        'UserPlan',
        userPlanId,
        `Edited plan ${pData.planName} details: ${JSON.stringify(updates)}`
      );
    } catch (e) {
      console.error("Update plan details failed:", e);
      throw e;
    }
  };

  // ADMIN ACTION: REJECT DEPOSIT
  const rejectDeposit = async (deposit: DepositRequest, reason: string) => {
    if (!isAdmin) return;
    try {
      const nowIso = new Date().toISOString();
      const depRef = doc(db, 'deposits', deposit.id);

      await updateDoc(depRef, {
        status: 'REJECTED',
        approvedBy: currentUser?.email || 'Admin',
        rejectionReason: reason,
        reviewedAt: nowIso
      });

      // Clear pending amount from user wallet
      const walletRef = doc(db, 'wallets', deposit.userId);
      const wSnap = await getDoc(walletRef);
      if (wSnap.exists()) {
        const curPending = wSnap.data().pendingDeposits || 0;
        await updateDoc(walletRef, {
          pendingDeposits: Math.max(0, curPending - deposit.amount),
          updatedAt: nowIso
        });
      }

      // Update transaction status
      const txQ = query(
        collection(db, 'transactions'),
        where('referenceId', '==', deposit.id)
      );
      const txSnap = await getDocs(txQ);
      if (!txSnap.empty) {
        await updateDoc(doc(db, 'transactions', txSnap.docs[0].id), {
          status: 'CANCELLED',
          adminNote: `Rejected: ${reason}`
        });
      }

      await logAdminAction(
        'REJECT_DEPOSIT',
        'Deposit',
        deposit.id,
        `Rejected deposit of ${deposit.amount} PKR for user ${deposit.userEmail}. Reason: ${reason}`
      );
    } catch (e) {
      console.error("Reject deposit failed:", e);
      throw e;
    }
  };

  // ADMIN ACTION: UPDATE WITHDRAWAL STATUS
  const updateWithdrawalStatus = async (
    withdrawal: WithdrawalRequest, 
    newStatus: 'PROCESSING' | 'PAID' | 'REJECTED', 
    note?: string
  ) => {
    if (!isAdmin) return;
    try {
      const nowIso = new Date().toISOString();
      const withRef = doc(db, 'withdrawals', withdrawal.id);
      const walletRef = doc(db, 'wallets', withdrawal.userId);
      const wSnap = await getDoc(walletRef);

      if (newStatus === 'PAID') {
        await updateDoc(withRef, {
          status: 'PAID',
          processedBy: currentUser?.email,
          adminNote: note || 'Disbursed',
          updatedAt: nowIso
        });

        if (wSnap.exists()) {
          const curPending = wSnap.data().pendingWithdrawals || 0;
          const curWithdrawn = wSnap.data().totalWithdrawn || 0;
          await updateDoc(walletRef, {
            pendingWithdrawals: Math.max(0, curPending - withdrawal.amount),
            totalWithdrawn: curWithdrawn + withdrawal.amount,
            updatedAt: nowIso
          });
        }
      } else if (newStatus === 'REJECTED') {
        // Refund user balance!
        await updateDoc(withRef, {
          status: 'REJECTED',
          processedBy: currentUser?.email,
          adminNote: note || 'Rejected & Refunded',
          updatedAt: nowIso
        });

        if (wSnap.exists()) {
          const curBal = wSnap.data().balance || 0;
          const curPending = wSnap.data().pendingWithdrawals || 0;
          await updateDoc(walletRef, {
            balance: curBal + withdrawal.amount,
            pendingWithdrawals: Math.max(0, curPending - withdrawal.amount),
            updatedAt: nowIso
          });
        }
      } else {
        // 'PROCESSING'
        await updateDoc(withRef, {
          status: 'PROCESSING',
          processedBy: currentUser?.email,
          adminNote: note || 'Processing payout',
          updatedAt: nowIso
        });
      }

      await logAdminAction(
        `WITHDRAWAL_${newStatus}`,
        'Withdrawal',
        withdrawal.id,
        `Withdrawal ${withdrawal.id} marked ${newStatus}. Note: ${note || 'None'}`
      );
    } catch (e) {
      console.error("Update withdrawal failed:", e);
      throw e;
    }
  };

  // ADMIN ACTION: SAVE / CONFIGURE PLAN
  const savePlan = async (plan: HenPlan) => {
    // Optimistic UI state update so changes reflect immediately
    setPlans(prev => prev.map(p => (p.id === plan.id || p.planNumber === plan.planNumber) ? {
      ...p,
      ...plan,
      updatedAt: new Date().toISOString()
    } : p));

    if (!isAdmin) return;
    try {
      const planRef = doc(db, 'plans', plan.id);
      await setDoc(planRef, {
        ...plan,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await logAdminAction(
        'UPDATE_PLAN',
        'Plan',
        plan.id,
        `Updated configuration for plan ${plan.name} (${plan.price} PKR, ${plan.henQuantity} Hens)`
      );
    } catch (e) {
      console.error("Save plan failed:", e);
      throw e;
    }
  };

  // ADMIN/OWNER ACTION: SEED / SYNC ALL 50 PLANS TO FIRESTORE
  const seedAll50Plans = async () => {
    if (!isAdmin) return;
    try {
      const batch = writeBatch(db);
      for (const p of INITIAL_PLANS) {
        const planRef = doc(db, 'plans', p.id);
        batch.set(planRef, {
          ...p,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      await batch.commit();

      setPlans(INITIAL_PLANS);

      await logAdminAction(
        'SEED_PLANS',
        'Plan',
        'ALL_50',
        'Synchronized all 50 plans to Firestore with realistic visuals'
      );
    } catch (e) {
      console.warn("Batch plan sync fallback to individual:", e);
      for (const p of INITIAL_PLANS) {
        setDoc(doc(db, 'plans', p.id), p, { merge: true }).catch(err => console.warn(err));
      }
    }
  };

  // ADMIN ACTION: SAVE SETTINGS
  const saveSettings = async (newSettings: Partial<SystemSettings>) => {
    if (!isAdmin) return;
    try {
      const setRef = doc(db, 'settings', 'global_config');
      await updateDoc(setRef, newSettings);

      await logAdminAction(
        'UPDATE_SETTINGS',
        'SystemSettings',
        'global_config',
        `Updated platform settings`
      );
    } catch (e) {
      console.error("Save settings failed:", e);
      throw e;
    }
  };

  // ADMIN ACTION: ADJUST USER BALANCE
  const adjustUserBalance = async (targetUserId: string, amount: number, direction: 'CREDIT' | 'DEBIT', note: string) => {
    if (!isAdmin) return;
    try {
      const nowIso = new Date().toISOString();
      const walletRef = doc(db, 'wallets', targetUserId);
      const wSnap = await getDoc(walletRef);
      if (!wSnap.exists()) throw new Error('User wallet not found');

      const curBal = wSnap.data().balance || 0;
      const newBal = direction === 'CREDIT' ? curBal + amount : Math.max(0, curBal - amount);

      await updateDoc(walletRef, {
        balance: newBal,
        updatedAt: nowIso
      });

      const txRef = doc(collection(db, 'transactions'));
      await setDoc(txRef, {
        id: txRef.id,
        userId: targetUserId,
        type: 'ADJUSTMENT',
        amount,
        direction,
        status: 'COMPLETED',
        referenceId: 'ADMIN_ADJ_' + Date.now(),
        description: `Admin balance adjustment: ${note}`,
        adminNote: `By ${currentUser?.email}: ${note}`,
        createdAt: nowIso
      });

      await logAdminAction(
        'ADJUST_BALANCE',
        'UserWallet',
        targetUserId,
        `Adjusted balance ${direction} ${amount} PKR. Note: ${note}`
      );
    } catch (e) {
      console.error("Adjust balance failed:", e);
      throw e;
    }
  };

  // ADMIN ACTION: SUSPEND OR ACTIVATE USER
  const toggleUserStatus = async (targetUserId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      await logAdminAction(
        'TOGGLE_USER_STATUS',
        'User',
        targetUserId,
        `Changed user status to ${newStatus}`
      );
    } catch (e) {
      console.error("Toggle user status failed:", e);
      throw e;
    }
  };

  return (
    <FarmContext.Provider
      value={{
        wallet,
        plans,
        userPlans,
        transactions,
        notifications,
        settings,
        loading,
        activeHensCount,
        availableHarvestCount,
        totalEggsHarvested,
        buyPlan,
        collectEggs,
        sellEggs,
        submitDeposit,
        submitWithdrawal,
        claimDailyCheckin,
        createPendingUserPlan,
        allUserPlans,
        allDeposits,
        allWithdrawals,
        auditLogs,
        approveDeposit,
        rejectDeposit,
        updateWithdrawalStatus,
        activateUserPlan,
        deactivateUserPlan,
        updateUserPlanDetails,
        savePlan,
        seedAll50Plans,
        saveSettings,
        adjustUserBalance,
        toggleUserStatus
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
