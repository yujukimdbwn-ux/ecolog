'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirestoreDb } from '@/lib/firebase';
import type { CollectedDoc, SpeciesDoc } from '@/lib/types';
import { rarityBadgeClass, rarityLabel, normalizeRarity } from '@/lib/species';
import type { Rarity } from '@/lib/types';

type Card = {
  speciesId: string;
  collected: CollectedDoc;
  species: SpeciesDoc | null;
};

export function PokedexGrid({ uid }: { uid: string }) {
  const [items, setItems] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ensureFirebaseInitialized()) {
      setLoading(false);
      return;
    }
    const db = getFirestoreDb();
    return onSnapshot(collection(db, 'myPokedex', uid, 'collected'), async (snap) => {
      const next: Card[] = [];
      for (const d of snap.docs) {
        const speciesId = d.id;
        const collected = d.data() as CollectedDoc;
        const sSnap = await getDoc(doc(db, 'species', speciesId));
        const species = sSnap.exists() ? (sSnap.data() as SpeciesDoc) : null;
        next.push({ speciesId, collected, species });
      }
      next.sort((a, b) => (b.collected.firstObservedAt ?? 0) - (a.collected.firstObservedAt ?? 0));
      setItems(next);
      setLoading(false);
    });
  }, [uid]);

  if (loading) {
    return <p className="text-sm text-eco-mid">도감을 불러오는 중…</p>;
  }

  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-eco-mint bg-white/60 p-6 text-center text-sm text-eco-mid">
        아직 수집한 종이 없어요. 사진을 한 장 올려 보세요!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map(({ speciesId, collected, species }) => {
        const title = species?.nameKo || species?.nameScientific || speciesId;
        const rarity = normalizeRarity(String(species?.rarity ?? 'common')) as Rarity;
        return (
          <article
            key={speciesId}
            className="overflow-hidden rounded-2xl border border-eco-mint bg-white/95 shadow-sm"
          >
            <div className="relative aspect-[4/3] w-full bg-eco-cream">
              {species?.imageUrl ? (
                <Image
                  src={species.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-eco-mid">
                  이미지 없음
                </div>
              )}
              <span
                className={`absolute right-3 top-3 rounded-full px-2 py-1 text-xs font-semibold ring-1 ${rarityBadgeClass(rarity)}`}
              >
                {rarityLabel(rarity)}
              </span>
            </div>
            <div className="space-y-1 p-4">
              <h3 className="text-lg font-semibold text-eco-deep">{title}</h3>
              {species?.nameScientific && (
                <p className="text-xs italic text-eco-soft">{species.nameScientific}</p>
              )}
              <p className="text-sm text-eco-mid line-clamp-3">{species?.description}</p>
              <p className="text-xs text-eco-soft">
                관찰 {collected.count}회 · 첫 관찰{' '}
                {new Date(collected.firstObservedAt).toLocaleString()}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
