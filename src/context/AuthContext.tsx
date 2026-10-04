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
  reauthenticateWithCredential,
  getAuth
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
import { initializeApp, getApps } from 'firebase/app';
import { auth, db, googleProvider, activeFirebaseConfig, handleFirestoreError, OperationType } from '../firebase';
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

// Recognized Master Owner Email addresses across all deployment environments (AI Studio & Netlify live)
export const KNOWN_OWNER_EMAILS = [
  'eggsverse@gmail.com',
  'revengend13@gmail.com',
  (import.meta.env.VITE_INITIAL_OWNER_EMAIL || '').toLowerCase().trim(),
].filter(Boolean);

export const isAuthorizedOwnerEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return KNOWN_OWNER_EMAILS.includes(clean) || clean.includes('eggsverse');
};

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

  // Check if at least one OWNER account exists in Firestore
  const checkOwnerExistence = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'OWNER'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setOwnerExists(true);
      } else {
        setOwnerExists(false);
      }
    } catch {
      // In case of unauthenticated permission constraints, default to true
      setOwnerExists(true);
    }
  };

  // Sync or create user profile and wallet in Firestore with authoritative role detection
  const initUserRecord = async (
    user: User, 
    customUsername?: string, 
    refCode?: string, 
    forceRole?: UserRole, 
    customPermissions?: AdminPermissions
  ): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', user.uid);
    let docSnap;
    try {
      docSnap = await getDoc(userDocRef);
    } catch (err) {
      console.warn("User get doc notice:", err);
    }

    const email = (user.email || '').toLowerCase().trim();
    const isOwnerByEmail = isAuthorizedOwnerEmail(email);

    // Check if user has an authority document in 'owners' or 'admins'
    let isOwnerByCollection = false;
    let isAdminByCollection = false;
    try {
      const ownerSnap = await getDoc(doc(db, 'owners', user.uid));
      if (ownerSnap.exists()) isOwnerByCollection = true;
    } catch {}

    try {
      const adminSnap = await getDoc(doc(db, 'admins', user.uid));
      if (adminSnap.exists()) isAdminByCollection = true;
    } catch {}

    if (docSnap && docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      const shouldBeOwner = isOwnerByEmail || isOwnerByCollection || data.role === 'OWNER';
      const shouldBeAdmin = shouldBeOwner || isAdminByCollection || data.role === 'ADMIN';

      if (shouldBeOwner && data.role !== 'OWNER') {
        const updated: UserProfile = { ...data, role: 'OWNER', updatedAt: new Date().toISOString() };
        try {
          await updateDoc(userDocRef, { role: 'OWNER', updatedAt: serverTimestamp() });
          await setDoc(doc(db, 'owners', user.uid), { uid: user.uid, email, updatedAt: new Date().toISOString() }, { merge: true });
          await setDoc(doc(db, 'admins', user.uid), { uid: user.uid, email, updatedAt: new Date().toISOString() }, { merge: true });
        } catch (e) {
          console.warn("Owner role update skipped:", e);
        }
        try {
          localStorage.setItem(`eggs_role_${user.uid}`, 'OWNER');
        } catch {}
        return updated;
      }

      if (!shouldBeOwner && shouldBeAdmin && data.role !== 'ADMIN') {
        const updated: UserProfile = { ...data, role: 'ADMIN', updatedAt: new Date().toISOString() };
        try {
          await updateDoc(userDocRef, { role: 'ADMIN', updatedAt: serverTimestamp() });
        } catch (e) {
          console.warn("Admin role update notice:", e);
        }
        try {
          localStorage.setItem(`eggs_role_${user.uid}`, 'ADMIN');
        } catch {}
        return updated;
      }

      try {
        localStorage.setItem(`eggs_role_${user.uid}`, data.role || 'USER');
      } catch {}
      return data;
    }

    // Check if an admin invitation or pre-created record exists for this email
    let preAssignedRole: UserRole = forceRole || (isOwnerByEmail ? 'OWNER' : (isAdminByCollection ? 'ADMIN' : 'USER'));
    let preAssignedPermissions: AdminPermissions | undefined = customPermissions;

    try {
      const qAdmin = query(collection(db, 'admins'), where('email', '==', email));
      const adminMatches = await getDocs(qAdmin);
      if (!adminMatches.empty) {
        preAssignedRole = 'ADMIN';
        const adminData = adminMatches.docs[0].data();
        if (adminData.permissions) {
          preAssignedPermissions = adminData.permissions;
        }
      }
    } catch {}

    // New User profile initialization
    const username = customUsername || user.displayName || user.email?.split('@')[0] || `Farmer_${user.uid.slice(0, 5)}`;
    const myReferralCode = generateReferralCode(username);
    const assignedRole: UserRole = preAssignedRole;

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      username,
      role: assignedRole,
      status: 'ACTIVE',
      referralCode: myReferralCode,
      referredBy: refCode || undefined,
      adminPermissions: preAssignedPermissions || (assignedRole === 'ADMIN' ? {
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
      if (assignedRole === 'OWNER') {
        setOwnerExists(true);
        await setDoc(doc(db, 'owners', user.uid), { uid: user.uid, email, createdAt: new Date().toISOString() });
        await setDoc(doc(db, 'admins', user.uid), { uid: user.uid, email, createdAt: new Date().toISOString() });
      } else if (assignedRole === 'ADMIN') {
        await setDoc(doc(db, 'admins', user.uid), { 
          uid: user.uid, 
          email, 
          permissions: newProfile.adminPermissions, 
          createdAt: new Date().toISOString() 
        });
      }
    } catch (err) {
      console.warn("User record write notice:", err);
    }

    try {
      localStorage.setItem(`eggs_role_${user.uid}`, assignedRole);
    } catch {}

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
        const data = snap.data() as UserProfile;
        setUserProfile(data);
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
    if (currentUser) {
      try {
        localStorage.removeItem(`eggs_role_${currentUser.uid}`);
      } catch {}
    }
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

  // FIRST LAUNCH / OWNER CREATION: Create Owner Account
  const createOwnerAccount = async (email: string, username: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (username.trim()) {
      await updateProfile(cred.user, { displayName: username.trim() });
    }
    const profile = await initUserRecord(cred.user, username.trim(), undefined, 'OWNER');
    setUserProfile(profile);
    setOwnerExists(true);
    try {
      await setDoc(doc(db, 'owners', cred.user.uid), {
        uid: cred.user.uid,
        email: email.trim(),
        username: username.trim(),
        createdAt: new Date().toISOString()
      });
      await setDoc(doc(db, 'admins', cred.user.uid), {
        uid: cred.user.uid,
        email: email.trim(),
        username: username.trim(),
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Owner collection sync notice:", e);
    }
  };

  // OWNER ACTION: Create Admin Account
  const createAdminAccount = async (email: string, username: string, pass: string, permissions: AdminPermissions) => {
    const cleanEmail = email.trim().toLowerCase();
    const adminCode = generateReferralCode(username);

    // Check if user already exists in Firestore users
    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const existingDoc = snap.docs[0];
        const adminUid = existingDoc.id;
        await updateDoc(doc(db, 'users', adminUid), {
          role: 'ADMIN',
          adminPermissions: permissions,
          status: 'ACTIVE',
          updatedAt: new Date().toISOString()
        });
        await setDoc(doc(db, 'admins', adminUid), {
          uid: adminUid,
          email: cleanEmail,
          username: username.trim(),
          permissions,
          createdAt: new Date().toISOString()
        });
        return;
      }
    } catch (e) {
      console.warn("Admin lookup notice:", e);
    }

    // Create Firebase Auth user via secondary app so the owner stays logged in
    let adminUid: string | null = null;
    try {
      const secondaryName = 'SecondaryAdminCreator';
      const existingApp = getApps().find(a => a.name === secondaryName);
      const secondaryApp = existingApp || initializeApp(activeFirebaseConfig, secondaryName);
      const secondaryAuth = getAuth(secondaryApp);
      const secCred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, pass);
      adminUid = secCred.user.uid;
      if (username.trim()) {
        await updateProfile(secCred.user, { displayName: username.trim() });
      }
      await signOut(secondaryAuth);
    } catch (secErr: any) {
      console.warn("Secondary auth creation:", secErr);
    }

    const finalUid = adminUid || doc(collection(db, 'users')).id;

    const adminProfile: UserProfile = {
      uid: finalUid,
      email: cleanEmail,
      username: username.trim(),
      role: 'ADMIN',
      status: 'ACTIVE',
      referralCode: adminCode,
      adminPermissions: permissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', finalUid), adminProfile);
    await setDoc(doc(db, 'admins', finalUid), {
      uid: finalUid,
      email: cleanEmail,
      username: username.trim(),
      permissions,
      createdAt: new Date().toISOString()
    });

    // Initial wallet
    await setDoc(doc(db, 'wallets', finalUid), {
      userId: finalUid,
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
    try {
      await updateDoc(doc(db, 'admins', adminUid), {
        permissions,
        updatedAt: new Date().toISOString()
      });
    } catch {}
  };

  // OWNER ACTION: Delete Admin Account
  const deleteAdminAccount = async (adminUid: string) => {
    await deleteDoc(doc(db, 'users', adminUid));
    try {
      await deleteDoc(doc(db, 'admins', adminUid));
    } catch {}
  };

  // OWNER ACTION: Toggle Admin Suspension
  const toggleAdminStatus = async (adminUid: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await updateDoc(doc(db, 'users', adminUid), {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    });
  };

  // Authoritative Role Detection logic:
  // Recognizes Owner by verified email, Firestore role, or explicit owner registration
  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const cachedRole = currentUser ? localStorage.getItem(`eggs_role_${currentUser.uid}`) : null;

  const isSuperOwner = 
    isAuthorizedOwnerEmail(userEmail) || 
    userProfile?.role === 'OWNER' ||
    cachedRole === 'OWNER';

  const role: UserRole = isSuperOwner 
    ? 'OWNER' 
    : (userProfile?.role || (cachedRole === 'ADMIN' ? 'ADMIN' : 'USER'));

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
