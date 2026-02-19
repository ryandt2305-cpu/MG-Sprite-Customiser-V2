import type { GameData, SpriteDataResponse, CosmeticsResponse } from './types';
import { getCached, setCache, getCachedVersion, invalidateCache } from './cache';

const IS_DEV = import.meta.env.DEV;
const API_BASE = IS_DEV ? '/api' : 'https://mg-api.ariedam.fr';

async function fetchJSON<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

function extractVersion(data: GameData | SpriteDataResponse | CosmeticsResponse): string | null {
  // Extract version hash from any sprite URL (e.g. "?v=465ff44")
  const urls: string[] = [];

  if ('categories' in data) {
    for (const cat of data.categories) {
      for (const item of cat.items) {
        if ('url' in item && item.url) {
          urls.push(item.url);
        }
      }
    }
  } else {
    // GameData — check mutations or plants for sprite URLs
    for (const m of Object.values(data.mutations)) {
      if (m.sprite) urls.push(m.sprite);
    }
    if (urls.length === 0) {
      for (const p of Object.values(data.plants)) {
        if (p.plant.sprite) urls.push(p.plant.sprite);
      }
    }
  }

  for (const u of urls) {
    const match = u.match(/[?&]v=([a-f0-9]+)/i);
    if (match) return match[1];
  }

  // Try extracting from path-based versioning: /version/HASH/
  for (const u of urls) {
    const match = u.match(/\/version\/([a-f0-9]+)\//i);
    if (match) return match[1];
  }

  return null;
}

export async function fetchGameData(): Promise<GameData> {
  const cached = getCached<GameData>('gameData');
  if (cached) return cached;

  const data = await fetchJSON<GameData>('/data');
  const version = extractVersion(data);
  setCache('gameData', data, version ?? undefined);
  return data;
}

export async function fetchSpriteData(): Promise<SpriteDataResponse> {
  const cached = getCached<SpriteDataResponse>('spriteData');
  if (cached) return cached;

  const data = await fetchJSON<SpriteDataResponse>('/assets/sprite-data');
  const version = extractVersion(data);
  setCache('spriteData', data, version ?? undefined);
  return data;
}

export async function fetchCosmetics(): Promise<CosmeticsResponse> {
  const cached = getCached<CosmeticsResponse>('cosmetics');
  if (cached) return cached;

  const data = await fetchJSON<CosmeticsResponse>('/assets/cosmetics');
  const version = extractVersion(data);
  setCache('cosmetics', data, version ?? undefined);
  return data;
}

/**
 * Check if game version has changed since last load.
 * Returns the new version string, or null if unchanged.
 */
export async function checkVersionChange(): Promise<string | null> {
  const oldVersion = getCachedVersion('gameData') ?? getCachedVersion('spriteData');
  const spriteData = await fetchJSON<SpriteDataResponse>('/assets/sprite-data');
  const newVersion = extractVersion(spriteData);

  if (!newVersion) return null;
  if (oldVersion && oldVersion !== newVersion) {
    // Version changed — invalidate caches
    invalidateCache('gameData');
    invalidateCache('spriteData');
    invalidateCache('cosmetics');
    return newVersion;
  }
  return null;
}

export { API_BASE };
