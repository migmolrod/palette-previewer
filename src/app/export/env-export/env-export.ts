import { Clipboard } from '@angular/cdk/clipboard';
import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { buildEnvFile, envFileName } from '../../palette/env-file';
import type { Mode } from '../../palette/mode';
import type { SemanticTokens } from '../../palette/semantic-tokens';
import type { TerminalPalette } from '../../palette/terminal-palette';

/** Shell env file for one mode: preview, copy to clipboard and download. */
@Component({
  imports: [ButtonModule],
  selector: 'app-env-export',
  template: `
    <div class="actions">
      <button pButton type="button" severity="secondary" variant="outlined" (click)="copy()">
        <i class="pi pi-copy" pButtonIcon></i>
        <span pButtonLabel>Copy</span>
      </button>
      <button pButton type="button" (click)="download()">
        <i class="pi pi-download" pButtonIcon></i>
        <span pButtonLabel>Download {{ fileName() }}</span>
      </button>
      <span class="status" role="status">{{ status() }}</span>
    </div>
    <pre class="file" tabindex="0" [attr.aria-label]="fileName() + ' contents'">{{ file() }}</pre>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }

    .file {
      max-height: 20rem;
      margin: 0;
      padding: 1rem;
      overflow: auto;
      border: 1px solid var(--p-content-border-color);
      border-radius: var(--p-content-border-radius);
      font-family: ui-monospace, monospace;
      font-size: 0.8125rem;
      line-height: 1.5;
    }
  `,
})
export class EnvExport {
  readonly tokens = input.required<SemanticTokens>();
  readonly palette = input.required<TerminalPalette>();
  readonly mode = input.required<Mode>();

  private readonly clipboard = inject(Clipboard);
  private readonly document = inject(DOCUMENT);

  protected readonly fileName = computed(() => envFileName(this.mode()));
  protected readonly file = computed(() =>
    buildEnvFile(this.tokens(), this.palette(), this.mode()),
  );
  /** Result of the last copy, announced to screen readers. */
  protected readonly status = signal('');

  protected copy(): void {
    this.status.set(this.clipboard.copy(this.file()) ? `Copied ${this.fileName()}` : 'Copy failed');
  }

  protected download(): void {
    const url = URL.createObjectURL(new Blob([this.file()], { type: 'text/x-shellscript' }));
    const link = this.document.createElement('a');
    link.href = url;
    link.download = this.fileName();
    link.click();
    URL.revokeObjectURL(url);
  }
}
