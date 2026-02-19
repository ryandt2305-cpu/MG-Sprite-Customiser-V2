// ── Game Data (/data) ──

export interface GameData {
  plants: Record<string, PlantData>;
  pets: Record<string, PetData>;
  items: Record<string, ItemData>;
  decor: Record<string, DecorData>;
  eggs: Record<string, EggData>;
  mutations: Record<string, MutationData>;
  abilities: Record<string, AbilityData>;
  weathers: Record<string, WeatherData>;
}

export interface PlantData {
  seed: {
    name: string;
    coinPrice: number;
    creditPrice: number;
    rarity: string;
    sprite: string;
  };
  plant: {
    name: string;
    harvestType: 'Single' | 'Multiple';
    baseTileScale: number;
    sprite: string;
    slotOffsets?: { x: number; y: number; rotation: number }[];
    secondsToMature?: number;
  };
  crop: {
    name: string;
    baseSellPrice: number;
    baseWeight: number;
    baseTileScale: number;
    maxScale: number;
    sprite: string;
  };
}

export interface PetData {
  name: string;
  coinsToFullyReplenishHunger: number;
  innateAbilityWeights: Record<string, number>;
  maxScale: number;
  maturitySellPrice: number;
  matureWeight: number;
  moveProbability: number;
  hoursToMature: number;
  rarity: string;
  diet: string[];
  sprite: string;
}

export interface ItemData {
  name: string;
  coinPrice: number;
  creditPrice: number;
  rarity: string;
  isOneTimePurchase: boolean;
  baseTileScale: number;
  maxInventoryQuantity: number;
  sprite: string;
}

export interface DecorData {
  name: string;
  coinPrice: number;
  creditPrice: number;
  rarity: string;
  baseTileScale: number;
  isOneTimePurchase: boolean;
  sprite: string;
}

export interface EggData {
  name: string;
  coinPrice: number;
  creditPrice: number;
  rarity: string;
  secondsToHatch: number;
  faunaSpawnWeights: Record<string, number>;
  sprite: string;
}

export interface MutationData {
  name: string;
  baseChance: number;
  coinMultiplier: number;
  sprite?: string;
}

export interface AbilityData {
  name: string;
  trigger: string;
  baseProbability: number;
  baseParameters: Record<string, number>;
}

export interface WeatherData {
  groupId: string;
  name: string;
  mutator: {
    mutation: string;
    chancePerMinutePerCrop: number;
  };
  sprite: string;
}

// ── Sprite Atlas Data (/assets/sprite-data) ──

export interface SpriteDataResponse {
  baseUrl: string;
  count: number;
  categories: SpriteCategory[];
}

export interface SpriteCategory {
  cat: string;
  items: SpriteEntry[];
}

export type SpriteEntry = SpriteFrame | SpriteAnimation;

export interface SpriteFrame {
  type: 'frame';
  id: string;
  name: string;
  url: string;
  frame: { x: number; y: number; w: number; h: number };
  anchor?: { x: number; y: number };
}

export interface SpriteAnimation {
  type: 'animation';
  id: string;
  name: string;
  url: string;
  frames: string[];
}

// ── Cosmetics (/assets/cosmetics) ──

export interface CosmeticsResponse {
  baseUrl: string;
  count: number;
  categories: CosmeticCategory[];
}

export interface CosmeticCategory {
  cat: string;
  items: CosmeticItem[];
}

export interface CosmeticItem {
  id: string;
  name: string;
  url: string;
}
