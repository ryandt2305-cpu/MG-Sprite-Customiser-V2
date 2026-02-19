import { state } from '../state/store';
import { bus, Events } from '../utils/events';

export function initTheme(): void {
  applyTheme(state.theme);
}

export function toggleTheme(): void {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.theme);
  bus.emit(Events.THEME_CHANGED, state.theme);
}

function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', theme);
}
