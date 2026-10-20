import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';

/** Labelled slider showing its current value, with a button to reset it to its default. */
@Component({
  imports: [ButtonModule, FormsModule, SliderModule],
  selector: 'app-slider-field',
  template: `
    <div class="header">
      <span class="label">{{ label() }}</span>
      <output class="value">{{ formatted() }}</output>
      <button
        pButton
        iconOnly
        variant="text"
        severity="secondary"
        size="small"
        [attr.aria-label]="'Reset ' + label()"
        [disabled]="value() === defaultValue()"
        (click)="value.set(defaultValue())"
      >
        <i class="pi pi-undo" aria-hidden="true"></i>
      </button>
    </div>
    <p-slider
      [ngModel]="value()"
      (ngModelChange)="value.set($event)"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [ariaLabel]="label()"
      [dt]="trackTokens()"
    />
  `,
  styles: `
    :host {
      display: block;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .label {
      flex: 1;
      font-size: 0.875rem;
    }

    .value {
      font-family: ui-monospace, monospace;
      font-size: 0.8125rem;
      color: var(--p-text-muted-color);
    }

    p-slider {
      margin: 0 0.5rem;
    }
  `,
})
export class SliderField {
  readonly value = model.required<number>();
  readonly label = input.required<string>();
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly step = input(1);
  readonly defaultValue = input(0);
  readonly format = input<(value: number) => string>(String);

  protected readonly formatted = computed(() => this.format()(this.value()));
  /** Offset sliders (negative to positive) hide the filled range, which would otherwise start at the minimum. */
  protected readonly trackTokens = computed(() =>
    this.min() < 0 ? { range: { background: 'transparent' } } : undefined,
  );
}
