import { Component, computed, inject, signal } from '@angular/core';
import type { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { Confirmation, ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { LibraryDialog } from '../library-dialog/library-dialog';
import { NameDialog } from '../name-dialog/name-dialog';
import { PaletteSession } from '../palette-session';

type NameDialogMode = 'save-as' | 'rename';

/** Top bar section: current palette name, unsaved-changes marker and library actions. */
@Component({
  imports: [ButtonModule, ConfirmDialog, LibraryDialog, MenuModule, NameDialog],
  providers: [Confirmation],
  selector: 'app-palette-bar',
  host: {
    '(document:keydown.control.s)': 'shortcutSave($event)',
    '(document:keydown.meta.s)': 'shortcutSave($event)',
  },
  template: `
    @if (session.editor()) {
      <p class="current" [title]="session.name()">
        <span class="sr-only">Palette: </span>
        <span class="name">{{ session.name() }}</span>
        @if (session.dirty()) {
          <span class="dirty" aria-hidden="true" title="Unsaved changes"></span>
          <span class="sr-only">(unsaved changes)</span>
        }
      </p>
      <button
        pButton
        type="button"
        severity="secondary"
        variant="text"
        [disabled]="!session.dirty() && session.current() !== null"
        (click)="save()"
      >
        <i class="pi pi-save" pButtonIcon></i>
        <span pButtonLabel>Save</span>
      </button>
      <button
        pButton
        type="button"
        iconOnly
        severity="secondary"
        variant="text"
        aria-label="Palette actions"
        aria-haspopup="menu"
        aria-controls="palette-actions"
        (click)="menu.toggle($event)"
      >
        <i class="pi pi-ellipsis-v" aria-hidden="true"></i>
      </button>
      <p-menu #menu id="palette-actions" popup appendTo="body" [model]="actions()" />
      <span class="sr-only" role="status">{{ status() }}</span>

      <app-name-dialog
        [(visible)]="nameDialogVisible"
        [header]="nameDialogMode() === 'rename' ? 'Rename palette' : 'Save palette as'"
        [confirmLabel]="nameDialogMode() === 'rename' ? 'Rename' : 'Save'"
        [initialName]="session.name()"
        (confirmed)="nameConfirmed($event)"
      />
      <app-library-dialog [(visible)]="libraryVisible" (opened)="open($event)" />
      <app-confirm-dialog />
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      min-width: 0;
    }

    .current {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
      margin: 0 0.5rem 0 0;
      font-weight: 500;
    }

    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dirty {
      flex: none;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background-color: var(--p-primary-color);
    }
  `,
})
export class PaletteBar {
  protected readonly session = inject(PaletteSession);
  private readonly confirmation = inject(Confirmation);

  protected readonly nameDialogVisible = signal(false);
  protected readonly nameDialogMode = signal<NameDialogMode>('save-as');
  protected readonly libraryVisible = signal(false);
  /** Result of the last save, announced to screen readers. */
  protected readonly status = signal('');

  protected readonly actions = computed<MenuItem[]>(() => [
    { label: 'New palette', icon: 'pi pi-file', command: () => this.startNew() },
    { label: 'Save as…', icon: 'pi pi-copy', command: () => this.askName('save-as') },
    {
      label: 'Rename…',
      icon: 'pi pi-pencil',
      disabled: this.session.current() === null,
      command: () => this.askName('rename'),
    },
    { separator: true },
    { label: 'Library…', icon: 'pi pi-folder-open', command: () => this.libraryVisible.set(true) },
  ]);

  protected save(): void {
    if (this.session.save()) this.status.set(`Saved ${this.session.name()}`);
    else this.askName('save-as');
  }

  protected shortcutSave(event: Event): void {
    if (!this.session.editor()) return;
    event.preventDefault();
    this.save();
  }

  protected nameConfirmed(name: string): void {
    if (this.nameDialogMode() === 'rename') {
      this.session.renameCurrent(name);
      this.status.set(`Renamed to ${name}`);
    } else {
      this.session.saveAs(name);
      this.status.set(`Saved ${name}`);
    }
  }

  protected open(id: string): void {
    this.confirmDiscard(() => {
      this.session.open(id);
      this.libraryVisible.set(false);
    });
  }

  private startNew(): void {
    this.confirmDiscard(() => this.session.startNew());
  }

  private askName(mode: NameDialogMode): void {
    this.nameDialogMode.set(mode);
    this.nameDialogVisible.set(true);
  }

  /** Runs the action right away, or after confirmation when it would drop unsaved changes. */
  private confirmDiscard(action: () => void): void {
    if (!this.session.dirty()) {
      action();
      return;
    }
    this.confirmation.confirm({
      header: 'Discard unsaved changes?',
      message: `“${this.session.name()}” has unsaved changes, which will be lost.`,
      acceptLabel: 'Discard',
      accept: action,
    });
  }
}
