import { state, updateSlot, getActiveSlot } from '../../state/store';
import { bus, Events } from '../../utils/events';
import { el } from '../../utils/dom';

export class CosmeticsPanel {
  readonly element: HTMLElement;
  private grid: HTMLElement;
  private selectedCat = 'Top';

  constructor() {
    this.grid = el('div', { className: 'cosmetic-grid' });

    this.element = el('div', { className: 'panel cosmetics-panel' }, [
      el('div', { className: 'panel-header', textContent: 'Cosmetics' }),
      el('div', { className: 'cosmetic-cats' }),
      this.grid,
    ]);

    bus.on(Events.DATA_LOADED, () => this.init());
  }

  private init(): void {
    const cosmeticsData = state.cosmeticsData;
    if (!cosmeticsData) return;

    const catContainer = this.element.querySelector('.cosmetic-cats')!;
    catContainer.innerHTML = '';

    for (const cat of cosmeticsData.categories) {
      const btn = el('button', {
        className: `tab-btn${cat.cat === this.selectedCat ? ' active' : ''}`,
        textContent: `${cat.cat} (${cat.items.length})`,
      });
      btn.addEventListener('click', () => {
        this.selectedCat = cat.cat;
        catContainer.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderGrid();
      });
      catContainer.append(btn);
    }

    this.renderGrid();
  }

  private renderGrid(): void {
    this.grid.innerHTML = '';
    const cosmeticsData = state.cosmeticsData;
    if (!cosmeticsData) return;

    const cat = cosmeticsData.categories.find((c) => c.cat === this.selectedCat);
    if (!cat) return;

    for (const item of cat.items) {
      const cell = el('div', { className: 'cosmetic-cell' });
      const img = el('img', { className: 'cosmetic-thumb' }) as HTMLImageElement;
      img.crossOrigin = 'anonymous';
      img.loading = 'lazy';
      img.alt = item.name;
      img.src = item.url;

      const label = el('span', { className: 'cosmetic-label', textContent: item.name });
      cell.append(img, label);

      cell.addEventListener('click', () => {
        const slot = getActiveSlot();
        const layers = { ...(slot.cosmeticLayers ?? {}) };
        layers[this.selectedCat] = item.id;
        updateSlot(state.activeSlotIndex, {
          type: 'cosmetic',
          spriteKey: item.name,
          spriteUrl: item.url,
          cosmeticLayers: layers,
        });
      });

      this.grid.append(cell);
    }
  }
}
