import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { NO_ADJUSTMENT, type Adjustment } from '../../../palette/adjust';
import { toHex } from '../../../palette/color';
import { STOPS, type Stop } from '../../../palette/ramp';
import { SLOTS, type SlotId } from '../../../palette/terminal-palette';
import { AdjustmentControls } from '../../../ui/adjustment-controls/adjustment-controls';
import {
  rampByName,
  SLOT_SOURCES,
  type AccentResult,
  type SlotOverride,
} from '../generate-from-accent';

/** Picks one slot and edits its override: ramp stop plus lightness / chroma / hue offsets. */
@Component({
  imports: [AdjustmentControls, ButtonModule, FormsModule, SelectModule],
  selector: 'app-slot-controls',
  template: `
    <div class="field">
      <span id="slot-select-label" class="label">Slot</span>
      <p-select
        ariaLabelledBy="slot-select-label"
        [options]="slotOptions()"
        optionLabel="label"
        optionValue="id"
        [ngModel]="slot()"
        (ngModelChange)="slot.set($event)"
        fluid
      >
        <ng-template #selectedItem let-option>
          <span class="option">
            <span class="chip" [style.background-color]="option.hex"></span>
            {{ option.label }}
          </span>
        </ng-template>
        <ng-template #item let-option>
          <span class="option">
            <span class="chip" [style.background-color]="option.hex"></span>
            {{ option.label }}
            @if (option.edited) {
              <span class="edited">edited</span>
            }
          </span>
        </ng-template>
      </p-select>
    </div>

    <div class="field">
      <span id="stop-select-label" class="label">Ramp stop</span>
      <p-select
        ariaLabelledBy="stop-select-label"
        [options]="stopOptions()"
        optionLabel="label"
        optionValue="stop"
        [ngModel]="stop()"
        (ngModelChange)="setStop($event)"
        fluid
      >
        <ng-template #selectedItem let-option>
          <span class="option">
            <span class="chip" [style.background-color]="option.hex"></span>
            {{ option.label }}
          </span>
        </ng-template>
        <ng-template #item let-option>
          <span class="option">
            <span class="chip" [style.background-color]="option.hex"></span>
            {{ option.label }}
          </span>
        </ng-template>
      </p-select>
    </div>

    <app-adjustment-controls
      [adjustment]="adjustment()"
      (adjustmentChange)="setAdjustment($event)"
    />

    <button
      pButton
      type="button"
      severity="secondary"
      variant="outlined"
      size="small"
      [disabled]="!edited()"
      (click)="override.set({})"
    >
      <i class="pi pi-undo" pButtonIcon></i>
      <span pButtonLabel>Reset slot</span>
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
    }

    button {
      align-self: start;
    }
  `,
})
export class SlotControls {
  readonly slot = model.required<SlotId>();
  /** Override of the selected slot; `{}` means none. */
  readonly override = model<SlotOverride>({});
  readonly result = input.required<AccentResult>();
  readonly slots = input<Partial<Record<SlotId, SlotOverride>>>({});

  private readonly source = computed(() => SLOT_SOURCES[this.slot()]);

  protected readonly edited = computed(() => Object.keys(this.override()).length > 0);
  protected readonly stop = computed(() => this.override().stop ?? this.source().stop);
  protected readonly adjustment = computed<Adjustment>(() => {
    const { lightness, chroma, hue } = { ...NO_ADJUSTMENT, ...this.override() };
    return { lightness, chroma, hue };
  });

  protected readonly slotOptions = computed(() =>
    SLOTS.map(({ id, label }) => ({
      id,
      label,
      hex: toHex(this.result().palette[id]),
      edited: id in this.slots(),
    })),
  );

  protected readonly stopOptions = computed(() => {
    const ramp = rampByName(this.result(), this.source().ramp);
    const defaultStop = this.source().stop;
    return STOPS.map((stop) => ({
      stop,
      label: stop === defaultStop ? `${stop} (default)` : `${stop}`,
      hex: toHex(ramp[stop]),
    }));
  });

  protected setStop(stop: Stop): void {
    const { stop: _previous, ...rest } = this.override();
    this.override.set(stop === this.source().stop ? rest : { ...rest, stop });
  }

  protected setAdjustment(adjustment: Adjustment): void {
    this.override.update((current) => ({ ...current, ...adjustment }));
  }
}
