import { Component, input, model, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

/** Modal asking for a palette name, used to save as and to rename. */
@Component({
  imports: [ButtonModule, DialogModule, FormField, InputTextModule],
  selector: 'app-name-dialog',
  template: `
    <p-dialog
      modal
      closeAriaLabel="Cancel"
      [header]="header()"
      [(visible)]="visible"
      [style]="{ width: 'min(24rem, calc(100vw - 2rem))' }"
      (onShow)="start()"
    >
      <form class="form" novalidate (submit)="submit($event)">
        <label for="palette-name">Name</label>
        <input
          pInputText
          id="palette-name"
          autocomplete="off"
          autofocus
          [formField]="nameForm.name"
          [class.p-invalid]="showError()"
          [attr.aria-invalid]="showError()"
          [attr.aria-describedby]="showError() ? 'palette-name-error' : null"
        />
        @if (showError()) {
          <small id="palette-name-error" class="error">Enter a name.</small>
        }
        <div class="actions">
          <button
            pButton
            type="button"
            severity="secondary"
            variant="outlined"
            (click)="visible.set(false)"
          >
            Cancel
          </button>
          <button pButton type="submit">{{ confirmLabel() }}</button>
        </div>
      </form>
    </p-dialog>
  `,
  styles: `
    .form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .error {
      color: var(--p-red-600);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
  `,
})
export class NameDialog {
  readonly visible = model(false);
  readonly header = input.required<string>();
  readonly confirmLabel = input.required<string>();
  /** Name filled in when the dialog opens. */
  readonly initialName = input('');
  readonly confirmed = output<string>();

  private readonly model = signal({ name: '' });
  protected readonly nameForm = form(this.model, (path) => required(path.name));

  protected showError(): boolean {
    const field = this.nameForm.name();
    return field.touched() && field.invalid();
  }

  protected start(): void {
    this.nameForm().reset({ name: this.initialName() });
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const name = this.model().name.trim();
    this.model.set({ name });
    this.nameForm.name().markAsTouched();
    if (!name) return;
    this.confirmed.emit(name);
    this.visible.set(false);
  }
}
