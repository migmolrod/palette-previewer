import { Component, inject, signal } from '@angular/core';
import { FieldsetModule } from 'primeng/fieldset';
import { STOPS } from '../../palette/ramp';
import { SLOTS, type SlotId } from '../../palette/terminal-palette';
import { TerminalPreview } from '../../preview/terminal-preview/terminal-preview';
import { AdjustmentControls } from '../../ui/adjustment-controls/adjustment-controls';
import { ColorInput } from '../../ui/color-input/color-input';
import { Swatch } from '../../ui/swatch/swatch';
import { AccentStore } from './accent-store';
import type { HueName } from './generate-from-accent';
import { SlotControls } from './slot-controls/slot-controls';
import { TintControls } from './tint-controls/tint-controls';

@Component({
  imports: [
    AdjustmentControls,
    ColorInput,
    FieldsetModule,
    SlotControls,
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

  /** Slot edited by the per-slot controls. */
  protected readonly selectedSlot = signal<SlotId>('color1');
}
