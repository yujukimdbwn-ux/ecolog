'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  GoogleMap,
  Marker,
  Circle,
  useJsApiLoader,
} from '@react-google-maps/api';
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirestoreDb } from '@/lib/firebase';
import type { ObservationDoc } from '@/lib/types';

const mapContainerStyle = {
  width: '100%',
  height: 'min(420px, 55vh)',
};

const defaultCenter = { lat: 37.5665, lng: 126.978 };

const LIBRARIES: any[] = ['visualization'];

export function ObservationMap({ uid }: { uid: string }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'ecolog-google-maps',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const [mine, setMine] = useState<ObservationDoc[]>([]);
  const [allPoints, setAllPoints] = useState<{ lat: number; lng: number }[]>([]);

  useEffect(() => {
    if (!ensureFirebaseInitialized()) return;
    const db = getFirestoreDb();
    const qMine = query(
      collection(db, 'observations'),
      where('uid', '==', uid),
      limit(200),
    );
    const unsubMine = onSnapshot(qMine, (snap) => {
      const rows: ObservationDoc[] = [];
      snap.forEach((d) => rows.push(d.data() as ObservationDoc));
      setMine(rows);
    });

    const qAll = query(collection(db, 'observations'), limit(400));
    const unsubAll = onSnapshot(qAll, (snap) => {
      const pts: { lat: number; lng: number }[] = [];
      snap.forEach((d) => {
        const o = d.data() as ObservationDoc;
        if (typeof o.lat === 'number' && typeof o.lng === 'number') {
          pts.push({ lat: o.lat, lng: o.lng });
        }
      });
      setAllPoints(pts);
    });

    return () => {
      unsubMine();
      unsubAll();
    };
  }, [uid]);

  const center = useMemo(() => {
    const m = mine.find((x) => x.lat != null && x.lng != null);
    if (m?.lat != null && m?.lng != null) return { lat: m.lat, lng: m.lng };
    return defaultCenter;
  }, [mine]);

  if (!apiKey) {
    return (
      <div className="rounded-2xl border border-dashed border-eco-mint bg-white/70 p-6 text-sm text-eco-mid">
        지도를 보려면 <code className="rounded bg-eco-pale px-1">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code>를
        설정하세요. (Google Cloud에서 Maps JavaScript API 활성화)
      </div>
    );
  }

  if (loadError) {
    return (
      <p className="text-sm text-rose-700">
        Google Maps 스크립트를 불러오지 못했습니다.
      </p>
    );
  }

  if (!isLoaded) {
    return <p className="text-sm text-eco-mid">지도를 불러오는 중…</p>;
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={mine.length ? 12 : 11}
      options={{
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
      }}
    >
      {allPoints.map((p, idx) => (
        <Circle
          key={`all-pts-${idx}`}
          center={p}
          radius={200}
          options={{
            strokeColor: '#3B82F6',
            strokeOpacity: 0.3,
            strokeWeight: 1,
            fillColor: '#3B82F6',
            fillOpacity: 0.15,
            clickable: false,
          }}
        />
      ))}
      {mine.map((o, i) =>
        o.lat != null && o.lng != null ? (
          <Marker
            key={`${o.photoUrl}-${i}`}
            position={{ lat: o.lat, lng: o.lng }}
            title={o.geminiResult?.nameKo ?? '관찰'}
          />
        ) : null,
      )}
    </GoogleMap>
  );
}
