import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, model, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { downloadText, slug } from '../../export/download';
import { envFileName } from '../../palette/env-file';
import { MODES } from '../../palette/mode';
import { Confirmation } from '../confirm-dialog/confirm-dialog';
import { PaletteLibrary, type ImportResult } from '../palette-library';
import { isSnapshotCurrent, type PaletteRecord } from '../palette-record';
import { PaletteSession } from '../palette-session';

const JSON_TYPE = 'application/json';

/** In the browser's locale; `DatePipe` would pull Angular's locale data into the main bundle. */
const UPDATED_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * Saved palettes: open, export or delete each one, and import or export the whole library.
 * Opening is left to the parent, which confirms before discarding unsaved changes; deleting
 * uses the {@link Confirmation} the parent provides.
 */
@Component({
  imports: [ButtonModule, DialogModule],
  selector: 'app-library-dialog',
  template: `
    <p-dialog
      modal
      header="Palette library"
      closeAriaLabel="Close"
      [(visible)]="visible"
      [style]="{ width: 'min(40rem, calc(100vw - 2rem))' }"
      (onHide)="status.set('')"
    >
      <div class="toolbar">
        <button pButton type="button" severity="secondary" (click)="fileInput.click()">
          <i class="pi pi-upload" pButtonIcon></i>
          <span pButtonLabel>Import</span>
        </button>
        <input
          #fileInput
          type="file"
          accept=".json,application/json"
          hidden
          (change)="importFrom(fileInput)"
        />
        <button
          pButton
          type="button"
          severity="secondary"
          [disabled]="rows().length === 0"
          (click)="exportAll()"
        >
          <i class="pi pi-download" pButtonIcon></i>
          <span pButtonLabel>Export all</span>
        </button>
        <span class="status" role="status">{{ status() }}</span>
      </div>

      @if (rows().length) {
        <ul class="list" aria-label="Saved palettes">
          @for (row of rows(); track row.record.id) {
            <li class="item">
              <div class="info">
                <span class="name">
                  {{ row.record.name }}
                  @if (row.current) {
                    <span class="note">(current)</span>
                  }
                </span>
                <small class="note">Updated {{ row.updated }}</small>
                @if (row.outdated) {
                  <small class="note">
                    The generator has changed since this was saved; the saved env files keep the
                    original colors.
                  </small>
                }
              </div>
              <div class="actions">
                <button
                  pButton
                  type="button"
                  size="small"
                  [attr.aria-label]="'Open ' + row.record.name"
                  (click)="opened.emit(row.record.id)"
                >
                  Open
                </button>
                @if (row.outdated) {
                  <button
                    pButton
                    type="button"
                    size="small"
                    iconOnly
                    severity="secondary"
                    variant="text"
                    [attr.aria-label]="'Download saved env files of ' + row.record.name"
                    (click)="downloadSnapshot(row.record)"
                  >
                    <i class="pi pi-history" aria-hidden="true"></i>
                  </button>
                }
                <button
                  pButton
                  type="button"
                  size="small"
                  iconOnly
                  severity="secondary"
                  variant="text"
                  [attr.aria-label]="'Export ' + row.record.name"
                  (click)="exportOne(row.record)"
                >
                  <i class="pi pi-download" aria-hidden="true"></i>
                </button>
                <button
                  pButton
                  type="button"
                  size="small"
                  iconOnly
                  severity="danger"
                  variant="text"
                  [attr.aria-label]="'Delete ' + row.record.name"
                  (click)="confirmDelete(row.record)"
                >
                  <i class="pi pi-trash" aria-hidden="true"></i>
                </button>
              </div>
            </li>
          }
        </ul>
      } @else {
        <p class="empty">No saved palettes yet. Save the current one, or import a file.</p>
      }
    </p-dialog>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .list {
      display: flex;
      flex-direction: column;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .item {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem 1rem;
      padding: 0.75rem 0;
      border-top: 1px solid var(--p-content-border-color);
    }

    .info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
      flex: 1 1 14rem;
    }

    .name {
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .note {
      color: var(--p-text-muted-color);
      font-weight: normal;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .empty {
      margin: 0;
      color: var(--p-text-muted-color);
    }
  `,
})
export class LibraryDialog {
  readonly visible = model(false);
  /** Asks to open a palette, by id. */
  readonly opened = output<string>();

  private readonly library = inject(PaletteLibrary);
  private readonly session = inject(PaletteSession);
  private readonly confirmation = inject(Confirmation);
  private readonly document = inject(DOCUMENT);

  protected readonly rows = computed(() => {
    const currentId = this.session.current()?.id;
    return this.library.palettes().map((record) => ({
      record,
      current: record.id === currentId,
      updated: UPDATED_FORMAT.format(Date.parse(record.updatedAt)),
      outdated: !isSnapshotCurrent(record),
    }));
  });

  /** Result of the last import or deletion, announced to screen readers. */
  protected readonly status = signal('');

  protected async importFrom(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const result = this.library.importFile(await file.text());
    this.status.set(result ? describeImport(result) : `${file.name} is not a palette file`);
  }

  protected exportAll(): void {
    downloadText(this.document, 'palette-library.json', this.library.exportFile(), JSON_TYPE);
  }

  protected exportOne(record: PaletteRecord): void {
    const text = this.library.exportFile([record.id]);
    downloadText(this.document, `${slug(record.name)}.palette.json`, text, JSON_TYPE);
  }

  protected downloadSnapshot(record: PaletteRecord): void {
    for (const mode of MODES) {
      const fileName = `${slug(record.name)}-${envFileName(mode)}`;
      downloadText(this.document, fileName, record.snapshot[mode], 'text/x-shellscript');
    }
  }

  protected confirmDelete(record: PaletteRecord): void {
    this.confirmation.confirm({
      header: 'Delete palette?',
      message: `“${record.name}” will be removed from the library. This cannot be undone.`,
      acceptLabel: 'Delete',
      accept: () => {
        this.session.delete(record.id);
        this.status.set(`Deleted ${record.name}`);
      },
    });
  }
}

function describeImport({ added, updated, unchanged, skipped }: ImportResult): string {
  const parts = [`${added} added`, `${updated} updated`, `${unchanged} already up to date`];
  if (skipped) parts.push(`${skipped} unreadable`);
  return `Imported palettes: ${parts.join(', ')}`;
}
