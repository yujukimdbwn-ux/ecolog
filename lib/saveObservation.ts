import {
  collection,
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import type { GeminiIdentifyResult } from './types';
import { normalizeRarity, slugFromScientific } from './species';

export async function saveIdentifiedObservation(params: {
  uid: string;
  photoUrl: string;
  lat: number | null;
  lng: number | null;
  note: string;
  gemini: GeminiIdentifyResult;
  imageUrlForSpecies?: string;
}): Promise<{ speciesId: string; firstUnlock: boolean }> {
  const { uid, photoUrl, lat, lng, note, gemini, imageUrlForSpecies } = params;
  const db = getFirestoreDb();
  const scientific = gemini.nameScientific?.trim();
  const speciesId = scientific ? slugFromScientific(scientific) : `unknown-${Date.now()}`;
  const rarity = normalizeRarity(String(gemini.rarity ?? 'common'));

  const speciesPayload = {
    nameKo: gemini.nameKo ?? '',
    nameEn: gemini.nameEn ?? '',
    nameScientific: gemini.nameScientific ?? '',
    category: gemini.category ?? 'other',
    rarity,
    description: gemini.description ?? '',
    imageUrl: imageUrlForSpecies ?? photoUrl,
    updatedAt: serverTimestamp(),
  };

  const observationRef = doc(collection(db, 'observations'));
  const speciesRef = doc(db, 'species', speciesId);
  const collectedRef = doc(db, 'myPokedex', uid, 'collected', speciesId);
  const userRef = doc(db, 'users', uid);

  let firstUnlock = false;

  await runTransaction(db, async (tx) => {
    const collectedSnap = await tx.get(collectedRef);
    firstUnlock = !collectedSnap.exists();

    tx.set(speciesRef, speciesPayload, { merge: true });

    tx.set(observationRef, {
      uid,
      speciesId,
      photoUrl,
      lat,
      lng,
      observedAt: Date.now(),
      note,
      geminiResult: gemini,
      unknown: false,
    });

    if (!collectedSnap.exists()) {
      tx.set(collectedRef, {
        firstObservedAt: Date.now(),
        count: 1,
      });
      tx.update(userRef, {
        collectedCount: increment(1),
      });
    } else {
      tx.update(collectedRef, {
        count: increment(1),
      });
    }
  });

  await bumpLevelFromCount(uid);

  return { speciesId, firstUnlock };
}

export async function saveUnknownObservation(params: {
  uid: string;
  photoUrl: string;
  lat: number | null;
  lng: number | null;
  note: string;
  detail?: string;
}): Promise<void> {
  const { uid, photoUrl, lat, lng, note, detail } = params;
  const db = getFirestoreDb();
  const observationRef = doc(collection(db, 'observations'));
  await setDoc(observationRef, {
    uid,
    speciesId: null,
    photoUrl,
    lat,
    lng,
    observedAt: Date.now(),
    note,
    geminiResult: null,
    unknown: true,
    detail: detail ?? null,
  });
}

async function bumpLevelFromCount(uid: string) {
  const db = getFirestoreDb();
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  const collectedCount = snap.data()?.collectedCount ?? 0;
  const level = Math.min(99, 1 + Math.floor(collectedCount / 5));
  await setDoc(userRef, { level }, { merge: true });
}
