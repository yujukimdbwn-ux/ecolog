'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  ensureFirebaseInitialized,
  getFirebaseAuth,
  getFirestoreDb,
} from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureUserProfile(u: User) {
  const db = getFirestoreDb();
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    displayName: u.displayName ?? '',
    email: u.email ?? '',
    photoURL: u.photoURL ?? '',
    collectedCount: 0,
    level: 1,
    createdAt: serverTimestamp(),
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ensureFirebaseInitialized()) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        try {
          await ensureUserProfile(u);
        } catch (e) {
          console.error('ensureUserProfile', e);
        }
      }
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!ensureFirebaseInitialized()) {
      window.alert(
        'Firebase 설정이 필요합니다.\n웹 폴더의 .env.example 을 참고해 .env.local 을 채워 주세요.',
      );
      return;
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(getFirebaseAuth(), provider);
  }, []);

  const logout = useCallback(async () => {
    if (!ensureFirebaseInitialized()) return;
    await signOut(getFirebaseAuth());
  }, []);

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, logout }),
    [user, loading, signInWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
