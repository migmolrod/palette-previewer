import { toHex, type Oklch } from './color';
import type { Mode } from './mode';
import { FILL_TOKENS, OUTLINES, type SemanticTokens, type TokenName } from './semantic-tokens';
import { ANSI_SLOTS, type SlotId, type TerminalPalette } from './terminal-palette';

/**
 * Sourceable shell file for rendering dotfile templates with `envsubst`.
 *
 * The variable names are a public API used by the user's templates: never rename or remove one.
 * Every color gets `PAL_X` (`#rrggbb`), `PAL_X_HEX` (`rrggbb`) and `PAL_X_RGB` (`r, g, b`).
 */

export const ENV_PREFIX = 'PAL_';

/** Every token in export order: each fill followed by its `on_` foreground, then the outlines. */
const TOKEN_NAMES: readonly TokenName[] = [
  ...FILL_TOKENS.flatMap((name) => [name, `on_${name}`] as const),
  ...OUTLINES,
];

/**
 * Terminal slots not already covered by a token. The terminal background is the same color as the
 * `background` token in both modes, so `PAL_BACKGROUND` serves both.
 */
const TERMINAL_SLOTS: readonly SlotId[] = ['foreground', ...ANSI_SLOTS];

export function envFileName(mode: Mode): string {
  return `palette-${mode}.sh`;
}

/** `on_surface_variant` → `PAL_ON_SURFACE_VARIANT`. */
export function envName(name: TokenName | SlotId): string {
  return ENV_PREFIX + name.toUpperCase();
}

export function buildEnvFile(tokens: SemanticTokens, palette: TerminalPalette, mode: Mode): string {
  const colors: [string, Oklch][] = [
    ...TOKEN_NAMES.map((name): [string, Oklch] => [envName(name), tokens[name]]),
    ...TERMINAL_SLOTS.map((id): [string, Oklch] => [envName(id), palette[id]]),
  ];
  const variables = colors.flatMap(([name, color]) => {
    const hex = toHex(color);
    const rgb = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
    return [
      [name, hex],
      [`${name}_HEX`, hex.slice(1)],
      [`${name}_RGB`, rgb.join(', ')],
    ] as const;
  });
  const list = variables.map(([name]) => `$${name}`).join(' ');

  return [
    `# palette-previewer ${mode} palette`,
    `# Source this file, then render templates with: envsubst "$${ENV_PREFIX}VARS" < template > output`,
    '',
    ...variables.map(([name, value]) => `export ${name}='${value}'`),
    '',
    `# Only these are substituted, so other $variables in a template are left untouched.`,
    `export ${ENV_PREFIX}VARS='${list}'`,
    '',
  ].join('\n');
}
