'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ensureFirebaseInitialized } from '@/lib/firebase';
import type { GeminiIdentifyResult } from '@/lib/types';
import { saveIdentifiedObservation, saveUnknownObservation } from '@/lib/saveObservation';

type Props = {
  onObserved: (payload: { firstUnlock: boolean; nameKo?: string }) => void;
};

function parseGeminiPayload(raw: unknown): GeminiIdentifyResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const nameKo = String(o.nameKo ?? '');
  const nameEn = String(o.nameEn ?? '');
  const nameScientific = String(o.nameScientific ?? '');
  if (!nameKo && !nameScientific) return null;
  return {
    nameKo,
    nameEn,
    nameScientific,
    category: String(o.category ?? 'other'),
    rarity: String(o.rarity ?? 'common'),
    description: String(o.description ?? ''),
    confidence:
      o.confidence === 'high' || o.confidence === 'low' || o.confidence === 'unknown'
        ? o.confidence
        : 'unknown',
  };
}

export function UploadObservation({ onObserved }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const getLocation = useCallback((): Promise<{ lat: number | null; lng: number | null }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: null, lng: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
      );
    });
  }, []);

  const onPick = useCallback(
    async (file: File | null) => {
      if (!file || !user) return;
      setBusy(true);
      setStatus('위치 정보를 확인하는 중…');
      const { lat, lng } = await getLocation();

      setStatus('이미지를 업로드하는 중…');
      if (!ensureFirebaseInitialized()) {
        setStatus('Firebase가 설정되지 않았습니다. .env.local 을 확인하세요.');
        setBusy(false);
        return;
      }

      let photoUrl = '';
      try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error ?? 'upload_failed');
        }

        const blobData = await uploadRes.json();
        photoUrl = blobData.url;
      } catch (e) {
        console.error(e);
        setStatus('이미지 업로드에 실패했습니다.');
        setBusy(false);
        return;
      }

      const url = URL.createObjectURL(file);
      setPreview(url);

      setStatus('AI가 종을 분석하는 중…');
      let gemini: GeminiIdentifyResult | null = null;
      try {
        const res = await fetch('/api/identify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: photoUrl }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("Identify API error response:", data);
          throw new Error(data.detail ? `${data.error}: ${data.detail}` : (data.error ?? 'identify_http_error'));
        }
        gemini = parseGeminiPayload(data);
      } catch (e) {
        console.error(e);
        setStatus('AI 인식에 실패했어요. 제보 카드로 저장할게요.');
        await saveUnknownObservation({
          uid: user.uid,
          photoUrl,
          lat,
          lng,
          note: '',
          detail: String(e),
        });
        onObserved({ firstUnlock: false, nameKo: undefined });
        setBusy(false);
        return;
      }

      if (!gemini) {
        setStatus('종 정보를 확정하지 못했어요. 제보 카드로 저장할게요.');
        await saveUnknownObservation({
          uid: user.uid,
          photoUrl,
          lat,
          lng,
          note: '',
          detail: 'empty_gemini_payload',
        });
        onObserved({ firstUnlock: false });
        setBusy(false);
        return;
      }

      setStatus('도감에 기록하는 중…');
      const { firstUnlock } = await saveIdentifiedObservation({
        uid: user.uid,
        photoUrl,
        lat,
        lng,
        note: '',
        gemini,
        imageUrlForSpecies: photoUrl,
      });

      setStatus(firstUnlock ? '새 종을 발견했어요!' : '관찰을 추가했어요!');
      onObserved({ firstUnlock, nameKo: gemini.nameKo });
      setBusy(false);
    },
    [getLocation, onObserved, user],
  );

  if (!user) return null;

  return (
    <section className="rounded-2xl border border-eco-mint bg-white/90 p-4 shadow-sm backdrop-blur">
      <h2 className="text-lg font-semibold text-eco-deep">관찰 올리기</h2>
      <p className="mt-1 text-sm text-eco-mid">
        사진 한 장이면 AI가 종 정보를 채워 줍니다. (HTTPS 환경에서 카메라·GPS가 안정적입니다.)
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="tap-target inline-flex cursor-pointer items-center justify-center rounded-xl bg-eco-mid px-4 py-3 text-sm font-medium text-white shadow hover:bg-eco-deep">
          갤러리 / 사진 찍기
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={busy}
            onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {preview && (
        <div className="relative mt-4 aspect-video w-full max-w-md overflow-hidden rounded-xl border border-eco-mint bg-eco-cream">
          <Image src={preview} alt="" fill className="object-cover" unoptimized />
        </div>
      )}

      {busy && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-eco-mint">
          <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-eco-pale via-eco-soft to-eco-pale bg-[length:200%_100%]" />
        </div>
      )}

      {status && <p className="mt-3 text-sm text-eco-mid">{status}</p>}
    </section>
  );
}
