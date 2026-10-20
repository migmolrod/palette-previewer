import { Component, inject, signal } from '@angular/core';
import { FieldsetModule } from 'primeng/fieldset';
import { NO_ADJUSTMENT } from '../../palette/adjust';
import { STOPS } from '../../palette/ramp';
import { SLOTS } from '../../palette/terminal-palette';
import { TerminalPreview } from '../../preview/terminal-preview/terminal-preview';
import { AdjustmentControls } from '../../ui/adjustment-controls/adjustment-controls';
import { ColorInput } from '../../ui/color-input/color-input';
import { Swatch } from '../../ui/swatch/swatch';
import { AccentStore } from './accent-store';
import type { ChromaticRamp, HueName } from './generate-from-accent';
import { RampControls } from './ramp-controls/ramp-controls';
import { TintControls } from './tint-controls/tint-controls';

@Component({
  imports: [
    AdjustmentControls,
    ColorInput,
    FieldsetModule,
    RampControls,
    Swatch,
    TerminalPreview,
    TintControls,
  ],
  providers: [AccentStore],
  selector: 'app-accent-tool',
  styleUrl: './accent-tool.scss',
  templateUrl: './accent-tool.html',
})
export class AccentTool {
  protected readonly store = inject(AccentStore);

  protected readonly stops = STOPS;
  protected readonly hueNames: readonly HueName[] = [
    'red',
    'yellow',
    'green',
    'cyan',
    'blue',
    'magenta',
  ];
  protected readonly slots = SLOTS;

  protected readonly noAdjustment = NO_ADJUSTMENT;

  /** Ramp edited by the per-ramp controls. */
  protected readonly selectedRamp = signal<ChromaticRamp>('accent');
}
