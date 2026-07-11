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
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

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

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedCard(null);
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

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
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map(({ speciesId, collected, species }) => {
        const title = species?.nameKo || species?.nameScientific || speciesId;
        const rarity = normalizeRarity(String(species?.rarity ?? 'common')) as Rarity;
        return (
          <button
            key={speciesId}
            type="button"
            onClick={() => setSelectedCard({ speciesId, collected, species })}
            className="overflow-hidden rounded-2xl border border-eco-mint bg-white/95 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-eco-mint"
            aria-label={`${title} 상세 보기`}
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
          </button>
        );
        })}
      </div>

      {selectedCard && (
        <SpeciesDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </>
  );
}

function SpeciesDetailModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const { speciesId, collected, species } = card;
  const title = species?.nameKo || species?.nameScientific || speciesId;
  const rarity = normalizeRarity(String(species?.rarity ?? 'common')) as Rarity;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-eco-deep/50 p-4 sm:items-center sm:justify-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="species-detail-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-eco-mint bg-white shadow-2xl"
      >
        <div className="relative aspect-[4/3] bg-eco-cream">
          {species?.imageUrl ? (
            <Image
              src={species.imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 32rem"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-eco-mid">이미지가 없습니다</div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl font-semibold text-eco-deep shadow-sm transition hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-eco-mint"
            aria-label="상세 보기 닫기"
          >
            ×
          </button>
          <span
            className={`absolute bottom-3 left-3 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${rarityBadgeClass(rarity)}`}
          >
            {rarityLabel(rarity)}
          </span>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-eco-soft">EcoLog 도감</p>
            <h3 id="species-detail-title" className="mt-1 text-2xl font-bold text-eco-deep">{title}</h3>
            {species?.nameScientific && <p className="mt-1 text-sm italic text-eco-soft">{species.nameScientific}</p>}
            {species?.nameEn && <p className="mt-1 text-sm text-eco-mid">{species.nameEn}</p>}
          </div>

          {species?.description && (
            <div>
              <h4 className="text-sm font-bold text-eco-deep">생물 소개</h4>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-eco-mid">{species.description}</p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-eco-cream p-4 text-sm">
            <div>
              <dt className="text-xs text-eco-soft">분류</dt>
              <dd className="mt-1 font-semibold text-eco-deep">{species?.category || '정보 없음'}</dd>
            </div>
            <div>
              <dt className="text-xs text-eco-soft">관찰 횟수</dt>
              <dd className="mt-1 font-semibold text-eco-deep">{collected.count}회</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-eco-soft">처음 만난 날</dt>
              <dd className="mt-1 font-semibold text-eco-deep">{new Date(collected.firstObservedAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
