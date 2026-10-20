import type { Oklch } from './color';

/** Intent colors, each with a base, a highlight (hover/active) and a container variant. */
export const ROLES = ['accent', 'danger', 'warning', 'success', 'info'] as const;
export type Role = (typeof ROLES)[number];

export const SURFACES = ['background', 'surface', 'surface_variant'] as const;
export type Surface = (typeof SURFACES)[number];

/** Tokens that come with an `on_` foreground. */
export type FillToken = Surface | Role | `${Role}_highlight` | `${Role}_container`;

export const OUTLINES = ['outline', 'outline_variant'] as const;
export type Outline = (typeof OUTLINES)[number];

export type TokenName = FillToken | `on_${FillToken}` | Outline;

/**
 * Tool-agnostic UI color scheme, named like matugen / Material's `on_*` convention so it can be
 * exported to Quickshell, GTK, Qt…
 */
export type SemanticTokens = Readonly<Record<TokenName, Oklch>>;

/** Every fill token in display order: surfaces first, then each role's three variants. */
export const FILL_TOKENS: readonly FillToken[] = [
  ...SURFACES,
  ...ROLES.flatMap((role) => [role, `${role}_highlight`, `${role}_container`] as const),
];

/** WCAG AA for normal text. */
export const MIN_TEXT_CONTRAST = 4.5;
