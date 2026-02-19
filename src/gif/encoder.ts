/**
 * GIF encoder using gif.js (loaded from CDN).
 * gif.js requires a Web Worker, so we load it dynamically.
 */

// gif.js global type
interface GifJSInstance {
  addFrame(canvas: HTMLCanvasElement, options: { delay: number; copy: boolean }): void;
  on(event: 'finished', handler: (blob: Blob) => void): void;
  on(event: 'progress', handler: (p: number) => void): void;
  render(): void;
}

interface GifJSConstructor {
  new (options: {
    workers: number;
    quality: number;
    width: number;
    height: number;
    workerScript: string;
    transparent?: number;
  }): GifJSInstance;
}

declare const GIF: GifJSConstructor | undefined;

const GIF_JS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
const GIF_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js';

let gifJsLoaded = false;
let workerBlobUrl: string | null = null;

async function loadGifJs(): Promise<void> {
  if (gifJsLoaded) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIF_JS_CDN;
    script.onload = () => {
      gifJsLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load gif.js'));
    document.head.append(script);
  });
}

/**
 * Fetch gif.worker.js from CDN and return a same-origin Blob URL.
 *
 * Browsers block `new Worker('https://...')` for cross-origin URLs (same-origin
 * policy for Workers). Fetching the script text and wrapping it in a Blob URL
 * gives the Worker a same-origin URL, bypassing that restriction.
 * The CDN serves the file with `Access-Control-Allow-Origin: *` so the fetch succeeds.
 */
async function getWorkerBlobUrl(): Promise<string> {
  if (workerBlobUrl) return workerBlobUrl;
  const res = await fetch(GIF_WORKER_CDN);
  if (!res.ok) throw new Error(`Failed to fetch gif worker: ${res.status}`);
  const text = await res.text();
  const blob = new Blob([text], { type: 'application/javascript' });
  workerBlobUrl = URL.createObjectURL(blob);
  return workerBlobUrl;
}

export interface EncodeOptions {
  frames: { canvas: HTMLCanvasElement; delay: number }[];
  width: number;
  height: number;
  quality?: number;
  onProgress?: (progress: number) => void;
}

export async function encodeGif(options: EncodeOptions): Promise<Blob> {
  const [, blobUrl] = await Promise.all([loadGifJs(), getWorkerBlobUrl()]);

  if (typeof GIF === 'undefined') {
    throw new Error('gif.js not loaded');
  }

  return new Promise((resolve, reject) => {
    try {
      const gif = new GIF({
        workers: 4,
        quality: options.quality ?? 10,
        width: options.width,
        height: options.height,
        workerScript: blobUrl,
        transparent: 0x000000,
      });

      for (const frame of options.frames) {
        gif.addFrame(frame.canvas, { delay: frame.delay, copy: true });
      }

      gif.on('finished', (blob: Blob) => resolve(blob));
      if (options.onProgress) {
        gif.on('progress', options.onProgress);
      }

      gif.render();
    } catch (err) {
      reject(err);
    }
  });
}
