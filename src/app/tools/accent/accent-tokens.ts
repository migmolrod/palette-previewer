import { contrast, type Oklch } from '../../palette/color';
import { STOPS, type Ramp, type Stop } from '../../palette/ramp';
import {
  FILL_TOKENS,
  MIN_TEXT_CONTRAST,
  OUTLINES,
  ROLES,
  type FillToken,
  type Outline,
  type Role,
  type SemanticTokens,
  type TokenName,
} from '../../palette/semantic-tokens';
import type { RampName } from './generate-from-accent';

const ROLE_RAMPS: Readonly<Record<Role, RampName>> = {
  accent: 'accent',
  danger: 'red',
  warning: 'yellow',
  success: 'green',
  info: 'cyan',
};

export interface TokenSource {
  readonly ramp: RampName;
  readonly stop: Stop;
}

export interface FillSource extends TokenSource {
  /** Preferred stop for the `on_` foreground, moved further away if it falls short of AA. */
  readonly on: Stop;
}

/** Dark theme: where each fill token and its foreground come from. */
export const FILL_SOURCES = {
  background: { ramp: 'neutral', stop: 950, on: 100 },
  surface: { ramp: 'neutral', stop: 900, on: 100 },
  surface_variant: { ramp: 'neutral', stop: 800, on: 200 },
  ...Object.fromEntries(
    ROLES.flatMap((role) => {
      const ramp = ROLE_RAMPS[role];
      return [
        [role, { ramp, stop: 400, on: 950 }],
        [`${role}_highlight`, { ramp, stop: 300, on: 950 }],
        [`${role}_container`, { ramp, stop: 800, on: 100 }],
      ];
    }),
  ),
} as Readonly<Record<FillToken, FillSource>>;

const OUTLINE_SOURCES: Readonly<Record<Outline, TokenSource>> = {
  outline: { ramp: 'neutral', stop: 600 },
  outline_variant: { ramp: 'neutral', stop: 700 },
};

/** Builds the semantic tokens from finished ramps. */
export function buildTokens(rampOf: (name: RampName) => Ramp): SemanticTokens {
  const tokens: Partial<Record<TokenName, Oklch>> = {};
  for (const name of FILL_TOKENS) {
    const source = FILL_SOURCES[name];
    const ramp = rampOf(source.ramp);
    tokens[name] = ramp[source.stop];
    tokens[`on_${name}`] = readableOn(ramp, source.on, ramp[source.stop]);
  }
  for (const name of OUTLINES) {
    const source = OUTLINE_SOURCES[name];
    tokens[name] = rampOf(source.ramp)[source.stop];
  }
  return tokens as SemanticTokens;
}

const BLACK: Oklch = { mode: 'oklch', l: 0, c: 0 };
const WHITE: Oklch = { mode: 'oklch', l: 1, c: 0 };

/**
 * The preferred stop if it reaches AA on `fill`; otherwise the first stop beyond it, away from
 * the fill, that does; failing that, black or white (the near end first), or whichever of the
 * two contrasts most when neither reaches AA.
 */
function readableOn(ramp: Ramp, preferred: Stop, fill: Oklch): Oklch {
  const start = STOPS.indexOf(preferred);
  const lighter = ramp[preferred].l > fill.l;
  const stops = lighter ? STOPS.slice(0, start + 1).reverse() : STOPS.slice(start);
  const extremes = lighter ? [WHITE, BLACK] : [BLACK, WHITE];
  const candidates = [...stops.map((stop) => ramp[stop]), ...extremes];
  return (
    candidates.find((color) => contrast(color, fill) >= MIN_TEXT_CONTRAST) ??
    extremes.reduce((best, color) => (contrast(color, fill) > contrast(best, fill) ? color : best))
  );
}
