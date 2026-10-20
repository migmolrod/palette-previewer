import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { isNoAdjustment, NO_ADJUSTMENT, type Adjustment } from '../../../palette/adjust';
import { toHex } from '../../../palette/color';
import { AdjustmentControls } from '../../../ui/adjustment-controls/adjustment-controls';
import { rampByName, type AccentResult, type ChromaticRamp } from '../generate-from-accent';

const RAMPS: readonly ChromaticRamp[] = [
  'accent',
  'red',
  'yellow',
  'green',
  'cyan',
  'blue',
  'magenta',
];

/** Picks one chromatic ramp and fine-tunes it on top of the Colors adjustment. */
@Component({
  imports: [AdjustmentControls, ButtonModule, FormsModule, SelectModule],
  selector: 'app-ramp-controls',
  template: `
    <div class="field">
      <span id="ramp-select-label" class="label">Ramp</span>
      <p-select
        ariaLabelledBy="ramp-select-label"
        [options]="options()"
        optionLabel="name"
        optionValue="name"
        [ngModel]="ramp()"
        (ngModelChange)="ramp.set($event)"
        fluid
      >
        <ng-template #selectedItem let-option>
          <span class="option">
            <span class="chip" [style.background-color]="option.hex"></span>
            {{ option.name }}
          </span>
        </ng-template>
        <ng-template #item let-option>
          <span class="option">
            <span class="chip" [style.background-color]="option.hex"></span>
            {{ option.name }}
            @if (option.edited) {
              <span class="edited">edited</span>
            }
          </span>
        </ng-template>
      </p-select>
    </div>

    <app-adjustment-controls [(adjustment)]="adjustment" />

    <button
      pButton
      type="button"
      severity="secondary"
      variant="outlined"
      size="small"
      [disabled]="!edited()"
      (click)="adjustment.set(noAdjustment)"
    >
      <i class="pi pi-undo" pButtonIcon></i>
      <span pButtonLabel>Reset {{ ramp() }} ramp</span>
    </button>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .label {
      font-size: 0.875rem;
    }

    .option {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-transform: capitalize;
    }

    .chip {
      flex: none;
      width: 1rem;
      height: 1rem;
      border-radius: 0.25rem;
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--p-text-color) 25%, transparent);
    }

    .edited {
      font-size: 0.75rem;
      color: var(--p-text-muted-color);
      text-transform: none;
    }

    button {
      align-self: start;
    }
  `,
})
export class RampControls {
  readonly ramp = model.required<ChromaticRamp>();
  /** Fine-tuning of the selected ramp. */
  readonly adjustment = model<Adjustment>(NO_ADJUSTMENT);
  readonly result = input.required<AccentResult>();
  /** Fine-tuning of every ramp, to flag the edited ones. */
  readonly adjustments = input<Partial<Record<ChromaticRamp, Adjustment>>>({});

  protected readonly noAdjustment = NO_ADJUSTMENT;
  protected readonly edited = computed(() => !isNoAdjustment(this.adjustment()));

  protected readonly options = computed(() =>
    RAMPS.map((name) => ({
      name,
      hex: toHex(rampByName(this.result(), name)[500]),
      edited: name in this.adjustments(),
    })),
  );
}
