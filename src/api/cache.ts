interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version?: string;
}

const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string, ttl = DEFAULT_TTL): T | null {
  // Try memory first
  const mem = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (mem && Date.now() - mem.timestamp < ttl) {
    return mem.data;
  }

  // Try localStorage
  try {
    const raw = localStorage.getItem(`mgsc_${key}`);
    if (raw) {
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.timestamp < ttl) {
        memoryCache.set(key, entry);
        return entry.data;
      }
      localStorage.removeItem(`mgsc_${key}`);
    }
  } catch {
    // Ignore parse errors
  }

  return null;
}

export function setCache<T>(key: string, data: T, version?: string): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now(), version };
  memoryCache.set(key, entry);
  try {
    localStorage.setItem(`mgsc_${key}`, JSON.stringify(entry));
  } catch {
    // localStorage full — memory cache still works
  }
}

export function getCachedVersion(key: string): string | undefined {
  const mem = memoryCache.get(key);
  if (mem) return mem.version;
  try {
    const raw = localStorage.getItem(`mgsc_${key}`);
    if (raw) {
      const entry: CacheEntry<unknown> = JSON.parse(raw);
      return entry.version;
    }
  } catch {
    // Ignore
  }
  return undefined;
}

export function invalidateCache(key: string): void {
  memoryCache.delete(key);
  try {
    localStorage.removeItem(`mgsc_${key}`);
  } catch {
    // Ignore
  }
}

export function invalidateAll(): void {
  memoryCache.clear();
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('mgsc_')) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore
  }
}
