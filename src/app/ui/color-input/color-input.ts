import { Component, computed, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
import { parseColor, toHex, type Oklch } from '../../palette/color';

/**
 * Color picker paired with a text field accepting any CSS color.
 * PrimeNG ColorPicker is not screen-reader accessible, so it is hidden from them; the text field is the accessible path.
 */
@Component({
  imports: [ColorPickerModule, FormsModule, InputTextModule],
  selector: 'app-color-input',
  template: `
    <p-colorpicker aria-hidden="true" [ngModel]="hex()" (ngModelChange)="apply($event)" />
    <label [for]="inputId()">{{ label() }}</label>
    <input
      pInputText
      [id]="inputId()"
      [value]="hex()"
      [invalid]="invalid()"
      [attr.aria-invalid]="invalid()"
      [attr.aria-describedby]="inputId() + '-help'"
      (change)="apply($any($event.target).value)"
    />
    <small [id]="inputId() + '-help'">e.g. #7aa2f7 or oklch(0.7 0.15 260)</small>
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: auto minmax(0, 20rem);
      justify-content: start;
      gap: 0.25rem 0.75rem;
      align-items: center;
    }

    p-colorpicker {
      grid-row: span 3;
    }

    label,
    input,
    small {
      grid-column: 2;
    }
  `,
})
export class ColorInput {
  readonly color = model.required<Oklch>();
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();

  protected readonly hex = computed(() => toHex(this.color()));
  protected readonly invalid = signal(false);

  protected apply(text: string): void {
    const color = parseColor(text.trim());
    this.invalid.set(!color);
    if (color) {
      this.color.set(color);
    }
  }
}
