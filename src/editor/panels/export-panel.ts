import { renderAll } from '../../renderer/canvas-renderer';
import { el } from '../../utils/dom';

export class ExportPanel {
  readonly element: HTMLElement;
  private status: HTMLElement;

  constructor() {
    const pngBtn = el('button', { className: 'btn export-btn', textContent: 'Export PNG' });
    pngBtn.addEventListener('click', () => this.exportPNG());

    const gifBtn = el('button', { className: 'btn export-btn', textContent: 'Export GIF' });
    gifBtn.addEventListener('click', () => this.exportGIF());

    this.status = el('div', { className: 'export-status' });

    this.element = el('div', { className: 'panel export-panel' }, [
      el('div', { className: 'panel-header', textContent: 'Export' }),
      el('div', { className: 'export-buttons' }, [pngBtn, gifBtn]),
      this.status,
    ]);
  }

  private async exportPNG(): Promise<void> {
    this.status.textContent = 'Rendering...';
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    await renderAll(canvas);

    const link = document.createElement('a');
    link.download = 'sprite.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    this.status.textContent = '';
  }

  private async exportGIF(): Promise<void> {
    this.status.textContent = 'Encoding GIF...';
    try {
      const { encodeGif } = await import('../../gif/encoder');

      // Render current state as a single-frame GIF
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      await renderAll(canvas);

      const blob = await encodeGif({
        frames: [{ canvas, delay: 100 }],
        width: 512,
        height: 512,
        onProgress: (p) => {
          this.status.textContent = `Encoding GIF... ${Math.round(p * 100)}%`;
        },
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'sprite.gif';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      this.status.textContent = '';
    } catch (err) {
      this.status.textContent = `Error: ${err instanceof Error ? err.message : err}`;
    }
  }
}
