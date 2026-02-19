import type { GifFrame } from './decoder';

export class FrameScheduler {
  private frames: GifFrame[] = [];
  private currentIndex = 0;
  private animationId: number | null = null;
  private lastFrameTime = 0;
  private playing = false;
  private onFrame: ((frame: GifFrame, index: number) => void) | null = null;

  setFrames(frames: GifFrame[]): void {
    this.stop();
    this.frames = frames;
    this.currentIndex = 0;
  }

  setCallback(cb: (frame: GifFrame, index: number) => void): void {
    this.onFrame = cb;
  }

  play(): void {
    if (this.frames.length === 0 || this.playing) return;
    this.playing = true;
    this.lastFrameTime = performance.now();
    this.tick();
  }

  pause(): void {
    this.playing = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  stop(): void {
    this.pause();
    this.currentIndex = 0;
  }

  seek(index: number): void {
    this.currentIndex = Math.max(0, Math.min(index, this.frames.length - 1));
    if (this.onFrame && this.frames[this.currentIndex]) {
      this.onFrame(this.frames[this.currentIndex], this.currentIndex);
    }
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  get frameCount(): number {
    return this.frames.length;
  }

  get currentFrameIndex(): number {
    return this.currentIndex;
  }

  private tick = (): void => {
    if (!this.playing) return;

    const now = performance.now();
    const frame = this.frames[this.currentIndex];
    if (!frame) return;

    if (now - this.lastFrameTime >= frame.delay) {
      this.lastFrameTime = now;
      this.currentIndex = (this.currentIndex + 1) % this.frames.length;
      if (this.onFrame) {
        this.onFrame(this.frames[this.currentIndex], this.currentIndex);
      }
    }

    this.animationId = requestAnimationFrame(this.tick);
  };
}
