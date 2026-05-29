export type Rarity = 'common' | 'uncommon' | 'rare' | 'endangered';

export type GeminiIdentifyResult = {
  nameKo: string;
  nameEn: string;
  nameScientific: string;
  category: string;
  rarity: Rarity | string;
  description: string;
  confidence?: 'high' | 'low' | 'unknown';
};

export type SpeciesDoc = GeminiIdentifyResult & {
  imageUrl?: string;
};

export type ObservationDoc = {
  uid: string;
  speciesId: string | null;
  photoUrl: string;
  lat: number | null;
  lng: number | null;
  observedAt: number;
  note: string;
  geminiResult: GeminiIdentifyResult | null;
  unknown?: boolean;
};

export type CollectedDoc = {
  firstObservedAt: number;
  count: number;
};
