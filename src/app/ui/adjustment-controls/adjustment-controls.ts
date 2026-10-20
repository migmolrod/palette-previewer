import { Component, model } from '@angular/core';
import type { Adjustment } from '../../palette/adjust';
import { SliderField } from '../slider-field/slider-field';

const signed = (value: number, digits: number) => `${value > 0 ? '+' : ''}${value.toFixed(digits)}`;

/** Lightness / chroma / hue offset sliders for one {@link Adjustment}. */
@Component({
  imports: [SliderField],
  selector: 'app-adjustment-controls',
  template: `
    <app-slider-field
      label="Lightness"
      [min]="-0.3"
      [max]="0.3"
      [step]="0.005"
      [format]="formatLightness"
      [value]="adjustment().lightness"
      (valueChange)="patch({ lightness: $event })"
    />
    <app-slider-field
      label="Chroma"
      [min]="-0.15"
      [max]="0.15"
      [step]="0.005"
      [format]="formatChroma"
      [value]="adjustment().chroma"
      (valueChange)="patch({ chroma: $event })"
    />
    <app-slider-field
      label="Hue"
      [min]="-180"
      [max]="180"
      [format]="formatHue"
      [value]="adjustment().hue"
      (valueChange)="patch({ hue: $event })"
    />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `,
})
export class AdjustmentControls {
  readonly adjustment = model.required<Adjustment>();

  protected readonly formatLightness = (value: number) => signed(value * 100, 1);
  protected readonly formatChroma = (value: number) => signed(value, 3);
  protected readonly formatHue = (value: number) => `${signed(value, 0)}°`;

  protected patch(change: Partial<Adjustment>): void {
    this.adjustment.update((current) => ({ ...current, ...change }));
  }
}
