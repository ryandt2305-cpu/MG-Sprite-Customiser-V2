import { state, type Slot } from './store';

const STORAGE_KEY = 'mgsc_editor_state';
const SCHEMA_VERSION = 5; // Bump to invalidate stale persisted data

interface PersistedState {
  _v?: number;
  slots: Slot[];
  activeSlotIndex: number;
  theme: 'light' | 'dark';
  selectedCategory: string;
  previewZoom: number;
}

export function saveState(): void {
  // Strip non-serializable GIF data from slots before persisting
  const cleanSlots = state.slots.map(s => {
    const { gifFrames, _gifFrameIdx, ...rest } = s;
    return { ...rest, isAnimated: false };
  });
  const data: PersistedState = {
    _v: SCHEMA_VERSION,
    slots: cleanSlots as Slot[],
    activeSlotIndex: state.activeSlotIndex,
    theme: state.theme,
    selectedCategory: state.selectedCategory,
    previewZoom: state.previewZoom,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full
  }
}

export function restoreState(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data: PersistedState = JSON.parse(raw);
    if (data._v !== SCHEMA_VERSION) {
      // Stale schema — wipe and start fresh
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    if (data.slots) {
      // Sanitize: clear blob URLs that can't survive across sessions
      for (const slot of data.slots) {
        if (slot.spriteUrl && slot.spriteUrl.startsWith('blob:')) {
          slot.spriteUrl = '';
          slot.isAnimated = false;
        }
      }
      state.slots = data.slots;
    }
    if (typeof data.activeSlotIndex === 'number') state.activeSlotIndex = data.activeSlotIndex;
    if (data.theme) state.theme = data.theme;
    if (data.selectedCategory) state.selectedCategory = data.selectedCategory;
    if (typeof data.previewZoom === 'number') state.previewZoom = data.previewZoom;
  } catch {
    // Corrupt data, ignore
  }
}
