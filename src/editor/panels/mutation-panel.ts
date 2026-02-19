import { state, updateSlot, updateSlotSilent, beginBatchUpdate, getActiveSlot } from '../../state/store';
import { FILTERS } from '../../renderer/mutation-defs';
import { bus, Events } from '../../utils/events';
import { el } from '../../utils/dom';

export class MutationPanel {
  readonly element: HTMLElement;
  private toggleContainer: HTMLElement;
  private tintColor: HTMLInputElement;
  private tintOpacity: HTMLInputElement;

  constructor() {
    this.toggleContainer = el('div', { className: 'mutation-toggles' });

    this.tintColor = el('input', { type: 'color', value: '#ffffff', className: 'tint-color' }) as HTMLInputElement;
    this.tintOpacity = el('input', {
      type: 'range',
      min: '0',
      max: '100',
      value: '0',
      className: 'tint-opacity',
    }) as HTMLInputElement;

    const updateTint = () => {
      beginBatchUpdate();
      updateSlotSilent(state.activeSlotIndex, {
        customTint: { color: this.tintColor.value, opacity: parseInt(this.tintOpacity.value) / 100 },
      });
    };
    this.tintColor.addEventListener('input', updateTint);
    this.tintOpacity.addEventListener('input', updateTint);

    const tintSection = el('div', { className: 'tint-section' }, [
      el('label', { textContent: 'Custom Tint' }),
      el('div', { className: 'tint-controls' }, [this.tintColor, this.tintOpacity]),
    ]);

    this.element = el('div', { className: 'panel mutation-panel' }, [
      el('div', { className: 'panel-header', textContent: 'Mutations' }),
      this.toggleContainer,
      tintSection,
    ]);

    this.renderToggles();
    bus.on(Events.SLOT_SELECTED, () => this.syncFromState());
    bus.on(Events.SLOT_CHANGED, () => this.syncFromState());
  }

  private renderToggles(): void {
    this.toggleContainer.innerHTML = '';

    for (const [id, def] of Object.entries(FILTERS)) {
      const slot = getActiveSlot();
      const isActive = slot.mutations.includes(id);

      const btn = el('button', {
        className: `mutation-btn${isActive ? ' active' : ''}`,
        textContent: id,
      });

      // Color indicator
      if (def.colors.length === 1 && def.colors[0] !== 'transparent') {
        btn.style.borderLeftColor = def.colors[0];
        btn.style.borderLeftWidth = '3px';
        btn.style.borderLeftStyle = 'solid';
      } else if (def.colors.length > 1) {
        btn.style.borderImage = `linear-gradient(to bottom, ${def.colors.join(', ')}) 1`;
        btn.style.borderLeftWidth = '3px';
        btn.style.borderLeftStyle = 'solid';
      }

      btn.addEventListener('click', () => {
        const currentSlot = getActiveSlot();
        const muts = [...currentSlot.mutations];
        const idx = muts.indexOf(id);
        if (idx >= 0) {
          muts.splice(idx, 1);
        } else {
          muts.push(id);
        }
        updateSlot(state.activeSlotIndex, { mutations: muts });
      });

      this.toggleContainer.append(btn);
    }
  }

  private syncFromState(): void {
    const slot = getActiveSlot();
    this.tintColor.value = slot.customTint.color;
    this.tintOpacity.value = String(Math.round(slot.customTint.opacity * 100));
    this.renderToggles();
  }
}
