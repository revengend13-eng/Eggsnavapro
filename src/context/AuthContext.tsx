import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole, Wallet, AdminPermissions } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isOwner: boolean;
  isAdmin: boolean;
  ownerExists: boolean;
  loading: boolean;
  registerWithEmail: (email: string, username: string, pass: string, refCode?: string) => Promise<UserProfile>;
  loginWithEmail: (email: string, pass: string) => Promise<UserProfile>;
  loginWithGoogle: (refCode?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  verifyOwnerPassword: (password: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  createOwnerAccount: (email: string, username: string, pass: string) => Promise<void>;
  createAdminAccount: (email: string, username: string, pass: string, permissions: AdminPermissions) => Promise<void>;
  updateAdminPermissions: (adminUid: string, permissions: AdminPermissions) => Promise<void>;
  deleteAdminAccount: (adminUid: string) => Promise<void>;
  toggleAdminStatus: (adminUid: string, currentStatus: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INITIAL_OWNER_EMAIL = (import.meta.env.VITE_INITIAL_OWNER_EMAIL || 'eggsverse@gmail.com').toLowerCase();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [ownerExists, setOwnerExists] = useState(true);
  const [loading, setLoading] = useState(true);

  // Helper to generate a unique random referral code
  const generateReferralCode = (username: string) => {
    const clean = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${clean || 'EGG'}${rand}`;
  };

  // Check if at least one OWNER account exists
  const checkOwnerExistence = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'OWNER'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setOwnerExists(true);
      } else {
        // If no owner document in Firestore, check if initial owner email has signed up
        setOwnerExists(false);
      }
    } catch (e) {
      // In case of permission errors on unauthenticated read, default to true
      setOwnerExists(true);
    }
  };

  // Sync or create user profile and wallet in Firestore
  const initUserRecord = async (user: User, customUsername?: string, refCode?: string, forceRole?: UserRole, customPermissions?: AdminPermissions): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', user.uid);
    let docSnap;
    try {
      docSnap = await getDoc(userDocRef);
    } catch (err) {
      console.warn("User get doc notice:", err);
    }

    const email = (user.email || '').toLowerCase();
    const isOwnerByEmail = email === INITIAL_OWNER_EMAIL || email === 'eggsverse@gmail.com';

    if (docSnap && docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      if (isOwnerByEmail && data.role !== 'OWNER') {
        const updated: UserProfile = { ...data, role: 'OWNER', updatedAt: new Date().toISOString() };
        try {
          await updateDoc(userDocRef, { role: 'OWNER', updatedAt: serverTimestamp() });
        } catch (e) {
          console.warn("Owner role update skipped:", e);
        }
        return updated;
      }
      return data;
    }

    // New User profile
    const username = customUsername || user.displayName || user.email?.split('@')[0] || `Farmer_${user.uid.slice(0, 5)}`;
    const myReferralCode = generateReferralCode(username);
    const assignedRole: UserRole = forceRole || (isOwnerByEmail ? 'OWNER' : 'USER');

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      username,
      role: assignedRole,
      status: 'ACTIVE',
      referralCode: myReferralCode,
      referredBy: refCode || undefined,
      adminPermissions: customPermissions || (assignedRole === 'ADMIN' ? {
        canApproveDeposits: true,
        canProcessWithdrawals: true,
        canManageUsers: true,
        canViewTransactions: true,
        canViewReferrals: true
      } : undefined),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(userDocRef, newProfile);
      if (assignedRole === 'OWNER') setOwnerExists(true);
    } catch (err) {
      console.warn("User record write notice:", err);
    }

    // Initialize clean user wallet
    const walletDocRef = doc(db, 'wallets', user.uid);
    const initialWallet: Wallet = {
      userId: user.uid,
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

    try {
      await setDoc(walletDocRef, initialWallet);
    } catch (err) {
      console.warn("Wallet creation error:", err);
    }

    // If referred by someone, record referral connection
    if (refCode) {
      try {
        const usersRef = collection(db, 'users');
        const qRef = query(usersRef, where('referralCode', '==', refCode.trim()));
        const querySnap = await getDocs(qRef);
        if (!querySnap.empty) {
          const referrerDoc = querySnap.docs[0];
          const referrerData = referrerDoc.data() as UserProfile;
          const refDocRef = doc(collection(db, 'referrals'));
          await setDoc(refDocRef, {
            id: refDocRef.id,
            referrerId: referrerData.uid,
            refereeId: user.uid,
            refereeEmail: user.email,
            refereeUsername: username,
            level: 1,
            totalCommissionEarned: 0,
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.warn("Referral connection processing notice:", e);
      }
    }

    return newProfile;
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  useEffect(() => {
    checkOwnerExistence();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await initUserRecord(user);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error setting up user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registerWithEmail = async (email: string, username: string, pass: string, refCode?: string): Promise<UserProfile> => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (username.trim()) {
      await updateProfile(cred.user, { displayName: username.trim() });
    }
    const profile = await initUserRecord(cred.user, username.trim(), refCode);
    setUserProfile(profile);
    return profile;
  };

  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const profile = await initUserRecord(cred.user);
    setUserProfile(profile);
    return profile;
  };

  const loginWithGoogle = async (refCode?: string): Promise<UserProfile> => {
    const cred = await signInWithPopup(auth, googleProvider);
    const profile = await initUserRecord(cred.user, undefined, refCode);
    setUserProfile(profile);
    return profile;
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const verifyOwnerPassword = async (password: string): Promise<boolean> => {
    if (!currentUser || !currentUser.email) return false;
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      return true;
    } catch (e) {
      console.warn("Owner reauth notice:", e);
      return false;
    }
  };

  // FIRST LAUNCH: Create Owner Account
  const createOwnerAccount = async (email: string, username: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (username.trim()) {
      await updateProfile(cred.user, { displayName: username.trim() });
    }
    const profile = await initUserRecord(cred.user, username.trim(), undefined, 'OWNER');
    setUserProfile(profile);
    setOwnerExists(true);
  };

  // OWNER ACTION: Create Admin Account
  const createAdminAccount = async (email: string, username: string, pass: string, permissions: AdminPermissions) => {
    // Generate clean admin ID doc in Firestore
    const adminDocRef = doc(collection(db, 'users'));
    const adminCode = generateReferralCode(username);

    const adminProfile: UserProfile = {
      uid: adminDocRef.id,
      email: email.trim(),
      username: username.trim(),
      role: 'ADMIN',
      status: 'ACTIVE',
      referralCode: adminCode,
      adminPermissions: permissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(adminDocRef, adminProfile);

    // Initial wallet
    await setDoc(doc(db, 'wallets', adminDocRef.id), {
      userId: adminDocRef.id,
      balance: 0,
      availableEggs: 0,
      pendingDeposits: 0,
      pendingWithdrawals: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalEggRewards: 0,
      totalReferralRewards: 0,
      updatedAt: new Date().toISOString()
    });
  };

  // OWNER ACTION: Update Admin Permissions
  const updateAdminPermissions = async (adminUid: string, permissions: AdminPermissions) => {
    await updateDoc(doc(db, 'users', adminUid), {
      adminPermissions: permissions,
      updatedAt: new Date().toISOString()
    });
  };

  // OWNER ACTION: Delete Admin Account
  const deleteAdminAccount = async (adminUid: string) => {
    await deleteDoc(doc(db, 'users', adminUid));
  };

  // OWNER ACTION: Toggle Admin Suspension
  const toggleAdminStatus = async (adminUid: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await updateDoc(doc(db, 'users', adminUid), {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    });
  };

  const userEmail = (currentUser?.email || '').toLowerCase();
  const isSuperOwner = userEmail === INITIAL_OWNER_EMAIL || userEmail === 'eggsverse@gmail.com' || userProfile?.role === 'OWNER';
  const role: UserRole = isSuperOwner ? 'OWNER' : (userProfile?.role || 'USER');
  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN' || isOwner;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        isOwner,
        isAdmin,
        ownerExists,
        loading,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        logout,
        verifyOwnerPassword,
        refreshProfile,
        createOwnerAccount,
        createAdminAccount,
        updateAdminPermissions,
        deleteAdminAccount,
        toggleAdminStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
