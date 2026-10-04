import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  doc, 
  getDocFromServer,
  FirestoreError
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Strictly enforce eggs-nava-pro project configuration and sanitize any stale environment variables
const sanitizeProjectConfig = () => {
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const envAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const envAppId = import.meta.env.VITE_FIREBASE_APP_ID;
  const envStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const envSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envDbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

  return {
    projectId: (envProjectId && !envProjectId.includes('eggsverse')) 
      ? envProjectId 
      : 'eggs-nava-pro',
    authDomain: (envAuthDomain && !envAuthDomain.includes('eggsverse')) 
      ? envAuthDomain 
      : 'eggs-nava-pro.firebaseapp.com',
    appId: (envAppId && !envAppId.includes('1081536876093')) 
      ? envAppId 
      : '1:423117403168:web:3d5ef0aa70c0f5ff3ab845',
    apiKey: envApiKey || firebaseConfig.apiKey,
    firestoreDatabaseId: envDbId || firebaseConfig.firestoreDatabaseId || 'ai-studio-0c5fe44a-5202-455c-a321-28dbfa30fdd6',
    storageBucket: (envStorageBucket && !envStorageBucket.includes('eggsverse')) 
      ? envStorageBucket 
      : 'eggs-nava-pro.firebasestorage.app',
    messagingSenderId: (envSenderId && envSenderId !== '1081536876093') 
      ? envSenderId 
      : '423117403168',
  };
};

export const activeFirebaseConfig = sanitizeProjectConfig();

// Initialize Firebase with verified eggs-nava-pro configuration
const app = initializeApp(activeFirebaseConfig);

// Initialize Firestore with robust long-polling to prevent proxy disconnection in Cloud Run / iframes
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, activeFirebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Startup connection verification as prescribed by skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore connection: Client is offline or establishing connection.");
    }
  }
}

// Call after initialization settles
setTimeout(() => {
  testConnection();
}, 2000);

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
};
