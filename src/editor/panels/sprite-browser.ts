import { state, updateSlot } from '../../state/store';
import { bus, Events } from '../../utils/events';
import { el } from '../../utils/dom';

// Prefix used for cosmetic category keys in state.selectedCategory
const COSMETIC_PREFIX = 'cosmetic:';

export class SpriteBrowser {
  readonly element: HTMLElement;
  private grid: HTMLElement;
  private searchInput: HTMLInputElement;
  private categoryBtns: HTMLElement;

  constructor() {
    this.searchInput = el('input', {
      type: 'text',
      placeholder: 'Search sprites...',
      className: 'search-input',
    }) as HTMLInputElement;
    this.searchInput.addEventListener('input', () => {
      state.searchQuery = this.searchInput.value;
      this.renderGrid();
    });

    this.categoryBtns = el('div', { className: 'category-tabs' });
    this.grid = el('div', { className: 'sprite-grid' });

    this.element = el('div', { className: 'panel sprite-browser' }, [
      el('div', { className: 'panel-header', textContent: 'Sprites' }),
      this.searchInput,
      this.categoryBtns,
      this.grid,
    ]);

    bus.on(Events.DATA_LOADED, () => this.init());
  }

  private init(): void {
    this.renderCategoryTabs();
    this.renderGrid();
  }

  private addTab(label: string, key: string): void {
    const btn = el('button', {
      className: `tab-btn${key === state.selectedCategory ? ' active' : ''}`,
      textContent: label,
    });
    btn.addEventListener('click', () => {
      state.selectedCategory = key;
      this.categoryBtns.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.renderGrid();
    });
    this.categoryBtns.append(btn);
  }

  private renderCategoryTabs(): void {
    this.categoryBtns.innerHTML = '';
    const spriteData = state.spriteData;
    if (!spriteData) return;

    // ── Sprite-data categories ──
    for (const cat of spriteData.categories) {
      this.addTab(cat.cat, cat.cat);
    }

    // ── Game-data categories not already in sprite-data ──
    if (state.gameData) {
      const existingCats = new Set(spriteData.categories.map((c) => c.cat));
      for (const key of ['plants', 'pets', 'items', 'decor', 'eggs'] as const) {
        const data = state.gameData[key];
        if (!data || Object.keys(data).length === 0) continue;
        if (existingCats.has(key)) continue;
        this.addTab(key, key);
      }
    }

    // ── Blobling / cosmetics categories ──
    if (state.cosmeticsData && state.cosmeticsData.categories.length > 0) {
      const separator = el('div', { className: 'tab-section-label', textContent: 'Blobling' });
      this.categoryBtns.append(separator);

      for (const cat of state.cosmeticsData.categories) {
        const key = COSMETIC_PREFIX + cat.cat;
        this.addTab(`${cat.cat} (${cat.items.length})`, key);
      }
    }
  }

  private renderGrid(): void {
    this.grid.innerHTML = '';
    const query = state.searchQuery.toLowerCase();

    // Cosmetic category
    if (state.selectedCategory.startsWith(COSMETIC_PREFIX)) {
      this.renderCosmeticsGrid(query);
      return;
    }

    // Sprite-data categories
    const spriteData = state.spriteData;
    if (!spriteData) return;

    const cat = spriteData.categories.find((c) => c.cat === state.selectedCategory);
    if (!cat) {
      this.renderGameDataGrid(query);
      return;
    }

    const items = cat.items.filter((item) => {
      if (item.type !== 'frame') return false;
      if (query && !item.name.toLowerCase().includes(query)) return false;
      return true;
    });

    for (const item of items) {
      if (item.type !== 'frame') continue;
      const parts = item.id.split('/');
      const category = parts[1];
      const name = parts[2] ?? item.name;

      const vMatch = item.url.match(/\/version\/([a-f0-9]+)\//i);
      const version = vMatch?.[1] ?? state.gameVersion ?? '';
      const spriteUrl = `https://mg-api.ariedam.fr/assets/sprites/${category}/${name}.png${version ? `?v=${version}` : ''}`;

      const cell = this.createSpriteCell(item.name, spriteUrl, item.id);
      this.grid.append(cell);
    }
  }

  private renderCosmeticsGrid(query: string): void {
    const cosmeticsData = state.cosmeticsData;
    if (!cosmeticsData) return;

    const catKey = state.selectedCategory.slice(COSMETIC_PREFIX.length);
    const cat = cosmeticsData.categories.find((c) => c.cat === catKey);
    if (!cat) return;

    for (const item of cat.items) {
      if (query && !item.name.toLowerCase().includes(query)) continue;
      const cell = this.createSpriteCell(item.name, item.url, item.id);
      this.grid.append(cell);
    }
  }

  private renderGameDataGrid(query: string): void {
    const gameData = state.gameData;
    if (!gameData) return;

    const cat = state.selectedCategory;
    let entries: [string, { sprite?: string; name?: string }][] = [];

    if (cat === 'plants' && gameData.plants) {
      entries = Object.entries(gameData.plants).map(([k, v]) => [k, { sprite: v.plant.sprite, name: v.plant.name }]);
    } else if (cat === 'pets' && gameData.pets) {
      entries = Object.entries(gameData.pets).map(([k, v]) => [k, { sprite: v.sprite, name: v.name }]);
    } else if (cat === 'items' && gameData.items) {
      entries = Object.entries(gameData.items).map(([k, v]) => [k, { sprite: v.sprite, name: v.name }]);
    } else if (cat === 'decor' && gameData.decor) {
      entries = Object.entries(gameData.decor).map(([k, v]) => [k, { sprite: v.sprite, name: v.name }]);
    } else if (cat === 'eggs' && gameData.eggs) {
      entries = Object.entries(gameData.eggs).map(([k, v]) => [k, { sprite: v.sprite, name: v.name }]);
    }

    for (const [key, data] of entries) {
      const name = data.name ?? key;
      if (query && !name.toLowerCase().includes(query)) continue;
      if (!data.sprite) continue;
      const cell = this.createSpriteCell(name, data.sprite, key);
      this.grid.append(cell);
    }
  }

  private createSpriteCell(name: string, spriteUrl: string, spriteKey: string): HTMLElement {
    const cell = el('div', { className: 'sprite-cell' });
    const img = el('img', { className: 'sprite-thumb' }) as HTMLImageElement;
    img.crossOrigin = 'anonymous';
    img.loading = 'lazy';
    img.alt = name;
    img.style.imageRendering = 'pixelated';
    img.src = spriteUrl;
    img.addEventListener('error', () => {
      img.style.display = 'none';
    });

    const label = el('span', { className: 'sprite-label', textContent: name });

    cell.append(img, label);
    cell.addEventListener('click', () => {
      updateSlot(state.activeSlotIndex, {
        spriteKey,
        spriteUrl,
        type: 'sprite',
      });
    });

    return cell;
  }
}
