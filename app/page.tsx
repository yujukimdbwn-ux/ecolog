'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { PokedexGrid } from '@/components/PokedexGrid';
import { UnlockBanner } from '@/components/UnlockBanner';
import { UploadObservation } from '@/components/UploadObservation';
import { UserProgress } from '@/components/UserProgress';

const ObservationMap = dynamic(
  () => import('@/components/ObservationMap').then((m) => m.ObservationMap),
  { ssr: false, loading: () => <p className="text-sm font-medium text-[#2D6A4F] animate-pulse">🗺️ 지도를 준비하는 중…</p> },
);

export default function HomePage() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockName, setUnlockName] = useState<string | undefined>();

  const onObserved = useCallback((payload: { firstUnlock: boolean; nameKo?: string }) => {
    if (payload.firstUnlock) {
      setUnlockName(payload.nameKo);
      setUnlockOpen(true);
    }
  }, []);

  // 로딩 화면
  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4">
        <div className="text-4xl animate-bounce">🌱</div>
        <p className="text-base font-bold text-[#1B4332]">모험을 준비하고 있어요...</p>
      </main>
    );
  }

  // 로그인 전 타이틀 화면
  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 text-center">
        <header className="space-y-3">
          <span className="inline-block rounded-full bg-[#E8F5E9] border border-[#52B788] px-3 py-1 text-xs font-bold text-[#2D6A4F] shadow-sm">
            🌿 SDGs Goal 15 — Life on Land
          </span>
          <h1 className="text-5xl font-black tracking-tight text-[#1B4332] drop-shadow-sm">
            EcoLog
          </h1>
          <p className="text-base font-medium text-[#2D6A4F] leading-relaxed">
            나만의 생태 도감 탐험하기<br />
            사진 한 장으로 시작하는 자연 수집 여행!
          </p>
        </header>

        <button
          type="button"
          className="tap-target w-full max-w-sm rounded-2xl border-[3px] border-[#1B4332] bg-[#FFD166] px-6 py-4 text-lg font-black text-[#1B4332] shadow-[4px_4px_0px_0px_rgba(27,67,50,1)] transition-all hover:bg-[#FFC233] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(27,67,50,1)]"
          onClick={() => void signInWithGoogle()}
        >
          🎮 Google로 모험 시작하기
        </button>

        <p className="text-xs font-medium text-[#40916C] max-w-xs bg-white/60 p-3 rounded-xl border border-[#52B788]/40">
          📍 로그인 후 사진 업로드 · 도감 · 지도가 활성화됩니다.
        </p>
      </main>
    );
  }

  // 로그인 후 메인 대시보드 화면
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-6 pb-20">
      
      {/* 상단 프로필 바 */}
      <header className="flex items-center justify-between gap-4 rounded-3xl border-[3px] border-[#1B4332] bg-white p-4 shadow-[4px_4px_0px_0px_rgba(27,67,50,1)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#1B4332] bg-[#E8F5E9] text-2xl shadow-inner">
            🧑‍🌾
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#40916C] bg-[#E8F5E9] px-1.5 py-0.5 rounded-md border border-[#52B788]/40">
              EcoLog 어드벤처
            </span>
            <h1 className="text-xl font-black text-[#1B4332] tracking-tight mt-0.5">
              안녕하세요, {user.displayName ?? '탐험가'}님!
            </h1>
          </div>
        </div>
        
        <button
          type="button"
          className="rounded-xl border-2 border-[#1B4332] bg-white px-3 py-1.5 text-xs font-bold text-[#1B4332] shadow-[2px_2px_0px_0px_rgba(27,67,50,1)] transition-all hover:bg-red-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(27,67,50,1)]"
          onClick={() => void logout()}
        >
          로그아웃
        </button>
      </header>

      {/* 수집 진행도 섹션 */}
      <section className="space-y-2">
        <UserProgress uid={user.uid} />
      </section>

      {/* 관찰 올리기 섹션 */}
      <section className="space-y-2">
        <UploadObservation onObserved={onObserved} />
      </section>

      {/* 관찰 지도 섹션 */}
      <section className="space-y-3 rounded-3xl border-[3px] border-[#1B4332] bg-white p-5 shadow-[4px_4px_0px_0px_rgba(27,67,50,1)]">
        <h2 className="text-lg font-black text-[#1B4332] flex items-center gap-1.5">
          🗺️ 생물 발견 지도
        </h2>
        <div className="overflow-hidden rounded-2xl border-2 border-[#52B788]/60 shadow-inner">
          <ObservationMap uid={user.uid} />
        </div>
        <div className="rounded-xl bg-[#F4F9F4] p-2.5 border border-[#52B788]/30">
          <p className="text-xs font-bold text-[#2D6A4F] flex items-center gap-1">
            🔍 <span className="text-blue-500">파란 히트맵</span>은 전체 발견지, <span className="text-red-500">빨간 핀</span>은 내 발자국이에요!
          </p>
        </div>
      </section>

      {/* 내 도감 섹션 */}
      <section className="space-y-4">
        <h2 className="text-xl font-black text-[#1B4332] flex items-center gap-2 px-1">
          📖 나의 생태 도감
        </h2>
        <PokedexGrid uid={user.uid} />
      </section>

      {/* 도감 잠금 해제 알림 팝업 */}
      <UnlockBanner open={unlockOpen} name={unlockName} onClose={() => setUnlockOpen(false)} />
    </main>
  );
}