'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirestoreDb } from '@/lib/firebase';

export function UserProgress({ uid }: { uid: string }) {
  const [count, setCount] = useState(0);
  const goal = Number(process.env.NEXT_PUBLIC_TOTAL_SPECIES_GOAL ?? 50) || 50;

  useEffect(() => {
    if (!ensureFirebaseInitialized()) return;
    const db = getFirestoreDb();
    const ref = doc(db, 'users', uid);
    return onSnapshot(ref, (snap) => {
      const n = snap.data()?.collectedCount ?? 0;
      setCount(typeof n === 'number' ? n : 0);
    });
  }, [uid]);

  const pct = useMemo(() => Math.min(100, Math.round((count / goal) * 100)), [count, goal]);

  return (
    <div className="rounded-2xl border border-eco-mint bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-eco-deep">수집 진행도</p>
        <p className="text-sm text-eco-mid">
          <span className="font-semibold text-eco-deep">{count}</span> / {goal} 종
        </p>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-eco-pale">
        <div
          className="h-full rounded-full bg-gradient-to-r from-eco-soft to-eco-mid transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-eco-soft">
        목표 종 수는 `.env`의 `NEXT_PUBLIC_TOTAL_SPECIES_GOAL`로 조정할 수 있어요.
      </p>
    </div>
  );
}
