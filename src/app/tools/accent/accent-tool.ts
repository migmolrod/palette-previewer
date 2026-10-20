import { Component, inject } from '@angular/core';
import { FieldsetModule } from 'primeng/fieldset';
import { STOPS } from '../../palette/ramp';
import { ANSI_NAMES, ANSI_SLOTS } from '../../palette/terminal-palette';
import { TerminalPreview } from '../../preview/terminal-preview/terminal-preview';
import { AdjustmentControls } from '../../ui/adjustment-controls/adjustment-controls';
import { ColorInput } from '../../ui/color-input/color-input';
import { Swatch } from '../../ui/swatch/swatch';
import { AccentStore } from './accent-store';
import type { HueName } from './generate-from-accent';
import { TintControls } from './tint-controls/tint-controls';

@Component({
  imports: [AdjustmentControls, ColorInput, FieldsetModule, Swatch, TerminalPreview, TintControls],
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
  protected readonly ansi = ANSI_SLOTS.map((id, index) => ({ id, name: ANSI_NAMES[index] }));
}
