import { FrameScheduler } from '../gif/frame-scheduler';
import type { GifFrame } from '../gif/decoder';
import { el } from '../utils/dom';

export class Timeline {
  readonly element: HTMLElement;
  private scheduler = new FrameScheduler();
  private scrubber: HTMLInputElement;
  private frameLabel: HTMLElement;
  private playBtn: HTMLElement;

  constructor() {
    this.playBtn = el('button', { className: 'btn-sm', textContent: 'Play' });
    this.playBtn.addEventListener('click', () => this.togglePlay());

    this.scrubber = el('input', {
      type: 'range',
      min: '0',
      max: '0',
      value: '0',
      className: 'timeline-scrubber',
    }) as HTMLInputElement;
    this.scrubber.addEventListener('input', () => {
      this.scheduler.seek(parseInt(this.scrubber.value));
    });

    this.frameLabel = el('span', { className: 'frame-label', textContent: '0/0' });

    this.element = el('div', { className: 'timeline-bar' }, [
      this.playBtn,
      this.scrubber,
      this.frameLabel,
    ]);

    this.element.style.display = 'none';
  }

  loadFrames(frames: GifFrame[], onFrame: (frame: GifFrame, index: number) => void): void {
    this.scheduler.setFrames(frames);
    this.scheduler.setCallback((frame, index) => {
      this.scrubber.value = String(index);
      this.frameLabel.textContent = `${index + 1}/${frames.length}`;
      onFrame(frame, index);
    });

    this.scrubber.max = String(frames.length - 1);
    this.frameLabel.textContent = `1/${frames.length}`;
    this.element.style.display = 'flex';
  }

  hide(): void {
    this.scheduler.stop();
    this.element.style.display = 'none';
  }

  private togglePlay(): void {
    if (this.scheduler.isPlaying) {
      this.scheduler.pause();
      this.playBtn.textContent = 'Play';
    } else {
      this.scheduler.play();
      this.playBtn.textContent = 'Pause';
    }
  }
}
