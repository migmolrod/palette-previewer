import { DOCUMENT, inject, Service } from '@angular/core';
import { Theme, ThemeUtils } from '@primeuix/styled';
import Aura from '@primeuix/themes/aura';
import { toHex, type Oklch } from '../../palette/color';
import { STOPS, type Ramp } from '../../palette/ramp';
import type { SemanticTokens, TokenName } from '../../palette/semantic-tokens';

/** Class of the element that scopes the generated palette's PrimeNG theme. */
export const PREVIEW_SCOPE_CLASS = 'palette-preview';

const STYLE_ID = 'preview-theme';

/** Everything the PrimeNG preview needs: the ramps behind Aura's color scales plus our tokens. */
export interface PreviewPalette {
  readonly primary: Ramp;
  readonly surface: Ramp;
  readonly red: Ramp;
  readonly green: Ramp;
  readonly yellow: Ramp;
  readonly blue: Ramp;
  readonly magenta: Ramp;
  readonly cyan: Ramp;
  readonly tokens: SemanticTokens;
}

type ScaleName = Exclude<keyof PreviewPalette, 'tokens'>;

/** Aura color scales (the ones its components reference) and the ramp that replaces each. */
const AURA_SCALES: Readonly<Record<string, ScaleName>> = {
  primary: 'primary',
  surface: 'surface',
  red: 'red',
  green: 'green',
  emerald: 'green',
  yellow: 'yellow',
  orange: 'yellow',
  amber: 'yellow',
  blue: 'blue',
  sky: 'cyan',
  purple: 'magenta',
};

/** Aura semantic variables driven straight by our tokens, so both layers agree. */
const SEMANTIC_VARIABLES: Readonly<Record<string, TokenName>> = {
  'primary-color': 'accent',
  'primary-contrast-color': 'on_accent',
  'primary-hover-color': 'accent_highlight',
  'primary-active-color': 'accent_highlight',
  'highlight-background': 'accent_container',
  'highlight-focus-background': 'accent_container',
  'highlight-color': 'on_accent_container',
  'highlight-focus-color': 'on_accent_container',
  'content-background': 'surface',
  'content-hover-background': 'surface_variant',
  'content-border-color': 'outline_variant',
  'text-color': 'on_surface',
  'text-muted-color': 'on_surface_variant',
  'form-field-background': 'background',
  'form-field-border-color': 'outline',
  'form-field-color': 'on_background',
};

/**
 * Inline custom properties for the preview scope. They override the primitive and semantic
 * variables that {@link PreviewThemeStyle} re-declares there, so Aura's component variables
 * re-resolve against the generated palette.
 */
export function previewVariables(palette: PreviewPalette): Record<string, string> {
  const variables: Record<string, string> = {};
  const set = (name: string, color: Oklch) => (variables[`--p-${name}`] = toHex(color));

  for (const [aura, scale] of Object.entries(AURA_SCALES)) {
    for (const stop of STOPS) {
      set(`${aura}-${stop}`, palette[scale][stop]);
    }
  }
  set('surface-0', palette.surface[50]);
  for (const [variable, token] of Object.entries(SEMANTIC_VARIABLES)) {
    set(variable, palette.tokens[token]);
  }
  return variables;
}

/**
 * PrimeNG declares all its theme variables on `:root`, where every `var()` chain is resolved
 * once. Re-declaring Aura's whole chain on the preview scope makes it resolve there instead,
 * against the overrides from {@link previewVariables}, without touching the app's own theme.
 */
@Service()
export class PreviewThemeStyle {
  private readonly document = inject(DOCUMENT);

  attach(): void {
    if (this.document.head.querySelector(`style[data-palette-style-id="${STYLE_ID}"]`)) {
      return;
    }
    const { css } = ThemeUtils.getPreset({
      name: '',
      preset: Aura,
      options: { prefix: 'p', darkModeSelector: 'system', cssLayer: false },
      selector: `.${PREVIEW_SCOPE_CLASS}`,
      defaults: Theme.defaults,
    });
    const style = this.document.createElement('style');
    style.dataset['paletteStyleId'] = STYLE_ID;
    style.textContent = css ?? '';
    this.document.head.appendChild(style);
  }
}
