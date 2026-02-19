import { state, updateSlot, getActiveSlot } from '../../state/store';
import { bus, Events } from '../../utils/events';
import { el } from '../../utils/dom';

export class TransformPanel {
  readonly element: HTMLElement;
  private scaleInput: HTMLInputElement;
  private rotInput: HTMLInputElement;
  private xInput: HTMLInputElement;
  private yInput: HTMLInputElement;

  constructor() {
    this.scaleInput = this.makeNumInput('1', '0.1', '10', '0.1');
    this.rotInput = this.makeNumInput('0', '-360', '360', '1');
    this.xInput = this.makeNumInput('0', '-999', '999', '1');
    this.yInput = this.makeNumInput('0', '-999', '999', '1');

    const onChange = () => {
      updateSlot(state.activeSlotIndex, {
        scale: parseFloat(this.scaleInput.value) || 1,
        rotation: parseFloat(this.rotInput.value) || 0,
        position: {
          x: parseFloat(this.xInput.value) || 0,
          y: parseFloat(this.yInput.value) || 0,
        },
      });
    };

    [this.scaleInput, this.rotInput, this.xInput, this.yInput].forEach((inp) =>
      inp.addEventListener('change', onChange),
    );

    this.element = el('div', { className: 'panel transform-panel' }, [
      el('div', { className: 'panel-header', textContent: 'Transform' }),
      this.makeRow('Scale', this.scaleInput),
      this.makeRow('Rotation', this.rotInput),
      this.makeRow('X', this.xInput),
      this.makeRow('Y', this.yInput),
    ]);

    bus.on(Events.SLOT_SELECTED, () => this.syncFromState());
    bus.on(Events.SLOT_CHANGED, () => this.syncFromState());
  }

  private makeNumInput(value: string, min: string, max: string, step: string): HTMLInputElement {
    return el('input', {
      type: 'number',
      value,
      min,
      max,
      step,
      className: 'num-input',
    }) as HTMLInputElement;
  }

  private makeRow(label: string, input: HTMLInputElement): HTMLElement {
    return el('div', { className: 'transform-row' }, [
      el('label', { textContent: label }),
      input,
    ]);
  }

  private syncFromState(): void {
    const slot = getActiveSlot();
    this.scaleInput.value = String(slot.scale);
    this.rotInput.value = String(slot.rotation);
    this.xInput.value = String(slot.position.x);
    this.yInput.value = String(slot.position.y);
  }
}
