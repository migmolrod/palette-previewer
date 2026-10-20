import { Component, computed, inject, signal } from '@angular/core';
import { FieldsetModule } from 'primeng/fieldset';
import { NO_ADJUSTMENT } from '../../palette/adjust';
import { STOPS } from '../../palette/ramp';
import { SLOTS } from '../../palette/terminal-palette';
import { PrimeNgPreview } from '../../preview/primeng-preview/primeng-preview';
import type { PreviewPalette } from '../../preview/primeng-preview/preview-theme';
import { TerminalPreview } from '../../preview/terminal-preview/terminal-preview';
import { TokenPreview } from '../../preview/token-preview/token-preview';
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
    PrimeNgPreview,
    RampControls,
    Swatch,
    TerminalPreview,
    TokenPreview,
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

  protected readonly previewPalette = computed<PreviewPalette>(() => {
    const { accentRamp, neutralRamp, hueRamps, tokens } = this.store.result();
    return { primary: accentRamp, surface: neutralRamp, ...hueRamps, tokens };
  });

  /** Ramp edited by the per-ramp controls. */
  protected readonly selectedRamp = signal<ChromaticRamp>('accent');
}
