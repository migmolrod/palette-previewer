import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import type { Oklch } from '../../../palette/color';
import { ColorInput } from '../../../ui/color-input/color-input';
import { SliderField } from '../../../ui/slider-field/slider-field';
import type { TintSettings } from '../generate-from-accent';

type TintSource = 'accent' | 'custom';

/** Tint source (accent or a custom color) and its strength on colors and neutrals. */
@Component({
  imports: [ColorInput, FormsModule, SelectButtonModule, SliderField],
  selector: 'app-tint-controls',
  template: `
    <span id="tint-source-label" class="label">Source</span>
    <p-selectbutton
      ariaLabelledBy="tint-source-label"
      optionLabel="label"
      optionValue="value"
      [options]="sources"
      [allowEmpty]="false"
      [ngModel]="source()"
      (ngModelChange)="setSource($event)"
    />
    @if (tint().color; as color) {
      <app-color-input
        label="Tint color"
        inputId="tint-color"
        [color]="color"
        (colorChange)="patch({ color: $event })"
      />
    }
    <app-slider-field
      label="Strength on colors"
      [min]="0"
      [max]="1"
      [step]="0.01"
      [format]="formatPercent"
      [value]="tint().amount"
      (valueChange)="patch({ amount: $event })"
    />
    <app-slider-field
      label="Strength on neutrals"
      [min]="0"
      [max]="1"
      [step]="0.01"
      [format]="formatPercent"
      [value]="tint().neutralAmount"
      (valueChange)="patch({ neutralAmount: $event })"
    />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .label {
      font-size: 0.875rem;
      margin-bottom: -0.5rem;
    }
  `,
})
export class TintControls {
  readonly tint = model.required<TintSettings>();
  /** Starting point when switching to a custom tint color. */
  readonly accent = input.required<Oklch>();

  protected readonly sources: { label: string; value: TintSource }[] = [
    { label: 'Accent', value: 'accent' },
    { label: 'Custom', value: 'custom' },
  ];
  protected readonly source = computed<TintSource>(() => (this.tint().color ? 'custom' : 'accent'));
  protected readonly formatPercent = (value: number) => `${Math.round(value * 100)}%`;

  protected setSource(source: TintSource): void {
    this.patch({ color: source === 'custom' ? this.accent() : null });
  }

  protected patch(change: Partial<TintSettings>): void {
    this.tint.update((current) => ({ ...current, ...change }));
  }
}
