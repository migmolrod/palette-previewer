import { Component, computed, input } from '@angular/core';
import { toHex, type Oklch } from '../../palette/color';

/** A color chip labelled with its name and hex value. */
@Component({
  selector: 'app-swatch',
  template: `
    <span class="label">{{ label() }}</span>
    <span class="hex">{{ hex() }}</span>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      min-height: 4rem;
      padding: 0.375rem 0.5rem;
      border-radius: var(--p-content-border-radius);
      font-size: 0.75rem;
      line-height: 1.3;
    }

    .hex {
      font-family: ui-monospace, monospace;
    }
  `,
  host: {
    '[style.background-color]': 'hex()',
    '[style.color]': 'textColor()',
  },
})
export class Swatch {
  readonly color = input.required<Oklch>();
  readonly label = input('');

  protected readonly hex = computed(() => toHex(this.color()));
  /** Black or white label, whichever reads better on the chip. */
  protected readonly textColor = computed(() => (this.color().l > 0.62 ? '#000' : '#fff'));
}
