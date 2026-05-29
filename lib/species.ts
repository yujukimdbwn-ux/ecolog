import type { Rarity } from './types';

export function slugFromScientific(name: string): string {
  const s = name.trim().toLowerCase().replace(/\s+/g, '-');
  const slug = s.replace(/[^a-z0-9-]/g, '');
  return slug || `sp-${Date.now()}`;
}

export function normalizeRarity(r: string): Rarity {
  const x = r.toLowerCase();
  if (x === 'uncommon' || x === 'rare' || x === 'endangered' || x === 'common') {
    return x;
  }
  return 'common';
}

export function rarityLabel(r: Rarity): string {
  const map: Record<Rarity, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    endangered: 'Endangered',
  };
  return map[r] ?? r;
}

export function rarityBadgeClass(r: Rarity): string {
  const map: Record<Rarity, string> = {
    common: 'bg-emerald-100 text-emerald-900 ring-emerald-300',
    uncommon: 'bg-sky-100 text-sky-900 ring-sky-300',
    rare: 'bg-violet-100 text-violet-900 ring-violet-300',
    endangered: 'bg-rose-100 text-rose-900 ring-rose-300',
  };
  return map[r] ?? map.common;
}
