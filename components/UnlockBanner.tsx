'use client';

type Props = {
  open: boolean;
  name?: string;
  onClose: () => void;
};

export function UnlockBanner({ open, name, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="animate-unlockPop w-full max-w-md rounded-2xl border border-eco-mint bg-eco-cream p-6 shadow-xl"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-eco-soft">도감 등록</p>
        <h3 className="mt-2 text-2xl font-bold text-eco-deep">새 종을 발견했어요!</h3>
        {name && <p className="mt-2 text-lg text-eco-mid">{name}</p>}
        <button
          type="button"
          className="tap-target mt-6 w-full rounded-xl bg-eco-mid py-3 text-center text-sm font-semibold text-white hover:bg-eco-deep"
          onClick={onClose}
        >
          확인
        </button>
      </div>
    </div>
  );
}
