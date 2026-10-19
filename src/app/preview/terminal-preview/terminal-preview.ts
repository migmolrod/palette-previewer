import { Component, computed, input } from '@angular/core';
import { toHex } from '../../palette/color';
import { ANSI_NAMES, ANSI_SLOTS, type TerminalPalette } from '../../palette/terminal-palette';

/** Terminal-like block: each ANSI color as text on the palette background. */
@Component({
  selector: 'app-terminal-preview',
  template: `
    <pre
      class="terminal"
      [style.background-color]="hex().background"
      [style.color]="hex().foreground"
    >
<span>$ ls --color</span>
@for (row of rows; track $index) {<span>@for (slot of row; track slot.id) {<span class="cell" [style.color]="hex()[slot.id]" [title]="slot.name">{{ slot.id }}</span>}</span>
}<span>foreground text on background</span></pre>
  `,
  styles: `
    .terminal {
      margin: 0;
      padding: 1rem;
      border-radius: var(--p-content-border-radius);
      font-family: ui-monospace, monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      overflow-x: auto;
    }

    .cell {
      display: inline-block;
      min-width: 8ch;
    }
  `,
})
export class TerminalPreview {
  readonly palette = input.required<TerminalPalette>();

  protected readonly rows = [ANSI_SLOTS.slice(0, 8), ANSI_SLOTS.slice(8)].map((row) =>
    row.map((id) => ({ id, name: ANSI_NAMES[ANSI_SLOTS.indexOf(id)] })),
  );

  protected readonly hex = computed(
    () =>
      Object.fromEntries(
        Object.entries(this.palette()).map(([id, color]) => [id, toHex(color)]),
      ) as Record<keyof TerminalPalette, string>,
  );
}
