const MAX_ENTRIES = 300;

interface CacheEntry {
  canvas: HTMLCanvasElement;
  lastUsed: number;
}

export class RenderCache {
  private entries = new Map<string, CacheEntry>();

  static makeKey(
    spriteUrl: string,
    mutations: string[],
    options: { icons: boolean; overlays: boolean },
    scale: number,
    rotation: number,
    frameIndex?: number,
  ): string {
    return `${spriteUrl}|${[...mutations].sort().join(',')}|${options.icons}|${options.overlays}|${scale}|${rotation}|${frameIndex ?? 0}`;
  }

  get(key: string): HTMLCanvasElement | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    entry.lastUsed = Date.now();
    return entry.canvas;
  }

  set(key: string, canvas: HTMLCanvasElement): void {
    if (this.entries.size >= MAX_ENTRIES) {
      this.evictLru();
    }
    this.entries.set(key, { canvas, lastUsed: Date.now() });
  }

  private evictLru(): void {
    let oldest = Infinity;
    let oldestKey = '';
    for (const [k, v] of this.entries) {
      if (v.lastUsed < oldest) {
        oldest = v.lastUsed;
        oldestKey = k;
      }
    }
    if (oldestKey) {
      const entry = this.entries.get(oldestKey);
      if (entry) {
        // Free GPU memory
        entry.canvas.width = 0;
        entry.canvas.height = 0;
      }
      this.entries.delete(oldestKey);
    }
  }

  clear(): void {
    for (const entry of this.entries.values()) {
      entry.canvas.width = 0;
      entry.canvas.height = 0;
    }
    this.entries.clear();
  }
}

export const renderCache = new RenderCache();
