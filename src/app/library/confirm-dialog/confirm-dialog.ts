import { Component, inject, Injectable, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

export interface ConfirmRequest {
  readonly header: string;
  readonly message: string;
  /** Label of the destructive action, e.g. "Delete". */
  readonly acceptLabel: string;
  readonly accept: () => void;
}

/** Pending confirmation, shared by a {@link ConfirmDialog} and whoever asks for one. */
@Injectable()
export class Confirmation {
  readonly pending = signal<ConfirmRequest | null>(null);

  confirm(request: ConfirmRequest): void {
    this.pending.set(request);
  }
}

/**
 * Asks before a destructive action. PrimeNG's ConfirmDialog is not used: it leaves an unnamed
 * `alertdialog` in the page and renders the message as HTML, while ours holds palette names.
 */
@Component({
  imports: [ButtonModule, DialogModule],
  selector: 'app-confirm-dialog',
  template: `
    <p-dialog
      modal
      [role]="'alertdialog'"
      closeAriaLabel="Cancel"
      [header]="request()?.header ?? ''"
      [visible]="request() !== null"
      [style]="{ width: 'min(28rem, calc(100vw - 2rem))' }"
      (visibleChange)="$event || cancel()"
    >
      <p class="message">{{ request()?.message }}</p>
      <div class="actions">
        <button
          pButton
          type="button"
          severity="secondary"
          variant="outlined"
          autofocus
          (click)="cancel()"
        >
          Cancel
        </button>
        <button pButton type="button" severity="danger" (click)="accept()">
          {{ request()?.acceptLabel }}
        </button>
      </div>
    </p-dialog>
  `,
  styles: `
    .message {
      margin: 0;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.25rem;
    }
  `,
})
export class ConfirmDialog {
  private readonly confirmation = inject(Confirmation);
  protected readonly request = this.confirmation.pending.asReadonly();

  protected cancel(): void {
    this.confirmation.pending.set(null);
  }

  protected accept(): void {
    const request = this.request();
    this.confirmation.pending.set(null);
    request?.accept();
  }
}
