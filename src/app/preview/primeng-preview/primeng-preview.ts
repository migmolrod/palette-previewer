import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { toHex } from '../../palette/color';
import type { Mode } from '../../palette/mode';
import {
  PREVIEW_SCOPE_CLASS,
  PreviewThemeStyle,
  previewVariables,
  type PreviewPalette,
} from './preview-theme';

/** Real PrimeNG components themed with the generated palette, in either mode. */
@Component({
  imports: [
    ButtonModule,
    CardModule,
    CheckboxModule,
    FormsModule,
    InputTextModule,
    MessageModule,
    ProgressBarModule,
    TagModule,
    ToggleSwitchModule,
  ],
  selector: 'app-primeng-preview',
  template: `
    <p-card header="Release 2.4" subheader="Ready to ship">
      <div class="stack">
        <p>Body text on the card surface, with a muted line below.</p>
        <p class="muted">Last build 12 minutes ago.</p>

        <div class="row">
          <p-button label="Deploy" />
          <p-button label="Preview" severity="secondary" />
          <p-button label="Outlined" variant="outlined" />
          <p-button label="Text" variant="text" />
        </div>
        <div class="row">
          <p-button label="Success" severity="success" />
          <p-button label="Info" severity="info" />
          <p-button label="Warn" severity="warn" />
          <p-button label="Danger" severity="danger" />
          <p-button label="Help" severity="help" />
        </div>

        <div class="row">
          <p-tag value="stable" severity="success" />
          <p-tag value="beta" severity="info" />
          <p-tag value="deprecated" severity="warn" />
          <p-tag value="broken" severity="danger" />
          <p-tag value="v2.4" />
        </div>

        <p-message severity="info">Three new commits since the last build.</p-message>
        <p-message severity="success">All checks passed.</p-message>
        <p-message severity="warn">Disk usage at 85%.</p-message>
        <p-message severity="error">The staging deploy failed.</p-message>

        <div class="field">
          <label for="preview-name">Release name</label>
          <input pInputText id="preview-name" [(ngModel)]="name" />
        </div>
        <div class="row">
          <p-toggleswitch inputId="preview-notify" [(ngModel)]="notify" />
          <label for="preview-notify">Notify subscribers</label>
          <p-checkbox inputId="preview-tag" binary [(ngModel)]="tagged" />
          <label for="preview-tag">Tag release</label>
        </div>
        <p-progressbar [value]="60" aria-label="Upload progress" />
      </div>
    </p-card>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
      border-radius: var(--p-content-border-radius);
    }

    p {
      margin: 0;
    }

    .stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .muted {
      color: var(--p-text-muted-color);
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  `,
  host: {
    '[class]': 'scopeClass',
    '[style]': 'variables()',
    '[style.background-color]': 'background()',
    '[style.color]': 'foreground()',
    // Aura picks its per-scheme values with light-dark(), which follows color-scheme.
    '[style.color-scheme]': 'mode()',
  },
})
export class PrimeNgPreview {
  readonly palette = input.required<PreviewPalette>();
  readonly mode = input<Mode>('dark');

  protected readonly scopeClass = PREVIEW_SCOPE_CLASS;
  protected readonly variables = computed(() => previewVariables(this.palette()));
  protected readonly background = computed(() => toHex(this.palette().tokens.background));
  protected readonly foreground = computed(() => toHex(this.palette().tokens.on_background));

  protected readonly name = signal('Release 2.4');
  protected readonly notify = signal(true);
  protected readonly tagged = signal(false);

  constructor() {
    inject(PreviewThemeStyle).attach();
  }
}
