import { state } from '../state/store';
import { bus, Events } from '../utils/events';
import { renderAll } from '../renderer/canvas-renderer';
import { el } from '../utils/dom';
import { clamp } from '../utils/math';

export class PreviewCanvas {
  readonly container: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private slotStart = { x: 0, y: 0 };

  constructor() {
    this.canvas = el('canvas', { className: 'preview-canvas', width: '512', height: '512' });
    this.canvas.style.imageRendering = 'pixelated';

    const zoomControls = el('div', { className: 'zoom-controls' }, [
      this.makeBtn('-', () => this.zoom(-0.25)),
      el('span', { className: 'zoom-label', textContent: '1x' }),
      this.makeBtn('+', () => this.zoom(0.25)),
      this.makeBtn('Fit', () => this.resetZoom()),
    ]);

    this.container = el('div', { className: 'preview-panel' }, [
      el('div', { className: 'preview-header' }, [
        el('span', { textContent: 'Preview' }),
        zoomControls,
      ]),
      el('div', { className: 'preview-viewport' }, [this.canvas]),
    ]);

    this.setupDrag();
    bus.on(Events.RENDER_REQUEST, () => this.render());
    bus.on(Events.SLOT_CHANGED, () => this.render());
  }

  private makeBtn(label: string, onClick: () => void): HTMLElement {
    const btn = el('button', { className: 'btn-sm', textContent: label });
    btn.addEventListener('click', onClick);
    return btn;
  }

  private zoom(delta: number): void {
    state.previewZoom = clamp(state.previewZoom + delta, 0.25, 8);
    this.canvas.style.transform = `scale(${state.previewZoom})`;
    const label = this.container.querySelector('.zoom-label');
    if (label) label.textContent = `${state.previewZoom}x`;
  }

  private resetZoom(): void {
    state.previewZoom = 1;
    this.canvas.style.transform = 'scale(1)';
    const label = this.container.querySelector('.zoom-label');
    if (label) label.textContent = '1x';
  }

  private setupDrag(): void {
    this.canvas.addEventListener('mousedown', (e) => {
      const slot = state.slots[state.activeSlotIndex];
      if (slot.locked) return;
      this.isDragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.slotStart = { ...slot.position };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const slot = state.slots[state.activeSlotIndex];
      const dx = (e.clientX - this.dragStart.x) / state.previewZoom;
      const dy = (e.clientY - this.dragStart.y) / state.previewZoom;
      slot.position.x = this.slotStart.x + dx;
      slot.position.y = this.slotStart.y + dy;
      this.render();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  async render(): Promise<void> {
    await renderAll(this.canvas);
  }
}
