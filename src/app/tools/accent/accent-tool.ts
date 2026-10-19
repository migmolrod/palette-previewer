import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
import { STOPS } from '../../palette/ramp';
import { ANSI_NAMES, ANSI_SLOTS } from '../../palette/terminal-palette';
import { TerminalPreview } from '../../preview/terminal-preview/terminal-preview';
import { Swatch } from '../../ui/swatch/swatch';
import { AccentStore } from './accent-store';
import type { HueName } from './generate-from-accent';

@Component({
  imports: [ColorPickerModule, FormsModule, InputTextModule, Swatch, TerminalPreview],
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
  protected readonly hexInvalid = signal(false);

  protected setAccentFromText(value: string): void {
    this.hexInvalid.set(!this.store.setAccent(value.trim()));
  }
}
