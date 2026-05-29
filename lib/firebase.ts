import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

/** True if env looks filled (still may be invalid at runtime until init). */
export function firebaseEnvConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

let app: FirebaseApp | null = null;

/**
 * Initialize Firebase on the browser only. Safe to call from useEffect / event handlers.
 * Returns false when env is missing or init fails (e.g. invalid key during dev).
 */
export function ensureFirebaseInitialized(): boolean {
  if (typeof window === 'undefined') return false;
  if (app) return true;
  if (!firebaseEnvConfigured()) return false;
  try {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
    return true;
  } catch (e) {
    console.error('Firebase init failed', e);
    app = null;
    return false;
  }
}

function requireFirebaseApp(): FirebaseApp {
  if (!ensureFirebaseInitialized() || !app) {
    throw new Error(
      'Firebase가 설정되지 않았습니다. web/.env.local에 NEXT_PUBLIC_FIREBASE_* 변수를 채워 주세요.',
    );
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  return getAuth(requireFirebaseApp());
}

export function getFirestoreDb(): Firestore {
  return getFirestore(requireFirebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(requireFirebaseApp());
}
