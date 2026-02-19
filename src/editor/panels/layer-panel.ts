import { state, setActiveSlot, updateSlot, clearSlot, reorderSlots } from '../../state/store';
import { bus, Events } from '../../utils/events';
import { el } from '../../utils/dom';

export class LayerPanel {
  readonly element: HTMLElement;
  private list: HTMLElement;
  private dragIdx: number | null = null;

  constructor() {
    this.list = el('div', { className: 'layer-list' });

    this.element = el('div', { className: 'panel layer-panel' }, [
      el('div', { className: 'panel-header', textContent: 'Layers' }),
      this.list,
    ]);

    this.render();
    bus.on(Events.SLOT_CHANGED, () => this.render());
    bus.on(Events.SLOT_SELECTED, () => this.render());
  }

  private render(): void {
    this.list.innerHTML = '';

    for (let i = state.slots.length - 1; i >= 0; i--) {
      const slot = state.slots[i];
      const isActive = i === state.activeSlotIndex;
      const hasContent = !!slot.spriteUrl;

      const row = el('div', {
        className: `layer-row${isActive ? ' active' : ''}${hasContent ? '' : ' empty'}`,
        draggable: 'true',
      });

      // Visibility toggle
      const visBtn = el('button', {
        className: `layer-vis${slot.visible ? ' on' : ''}`,
        textContent: slot.visible ? '👁' : '·',
      });
      visBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateSlot(i, { visible: !slot.visible });
      });

      // Label
      const label = el('span', {
        className: 'layer-label',
        textContent: hasContent ? `${i + 1}: ${slot.spriteKey}` : `${i + 1}: (empty)`,
      });

      // Clear button
      const clearBtn = el('button', { className: 'layer-clear', textContent: '×' });
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSlot(i);
      });

      row.append(visBtn, label);
      if (hasContent) row.append(clearBtn);

      row.addEventListener('click', () => setActiveSlot(i));

      // Drag reorder
      row.addEventListener('dragstart', () => { this.dragIdx = i; });
      row.addEventListener('dragover', (e) => e.preventDefault());
      row.addEventListener('drop', () => {
        if (this.dragIdx !== null && this.dragIdx !== i) {
          reorderSlots(this.dragIdx, i);
        }
        this.dragIdx = null;
      });

      this.list.append(row);
    }
  }
}
