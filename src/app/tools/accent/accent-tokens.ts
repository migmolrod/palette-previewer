import { contrast, type Oklch } from '../../palette/color';
import { forEachMode, type Mode } from '../../palette/mode';
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
  type Surface,
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

type FillStops = Omit<FillSource, 'ramp'>;

interface TokenStops {
  readonly surfaces: Readonly<Record<Surface, FillStops>>;
  /** Shared by every role: its base, `_highlight` and `_container` variants. */
  readonly role: FillStops;
  readonly highlight: FillStops;
  readonly container: FillStops;
  readonly outlines: Readonly<Record<Outline, Stop>>;
}

/**
 * Per mode, the stops behind each token. Light mirrors dark around the middle of the ramps,
 * except outlines, which move one stop further from the background to keep a similar contrast.
 */
const TOKEN_STOPS: Readonly<Record<Mode, TokenStops>> = {
  dark: {
    surfaces: {
      background: { stop: 950, on: 100 },
      surface: { stop: 900, on: 100 },
      surface_variant: { stop: 800, on: 200 },
    },
    role: { stop: 400, on: 950 },
    highlight: { stop: 300, on: 950 },
    container: { stop: 800, on: 100 },
    outlines: { outline: 600, outline_variant: 700 },
  },
  light: {
    surfaces: {
      background: { stop: 50, on: 900 },
      surface: { stop: 100, on: 900 },
      surface_variant: { stop: 200, on: 800 },
    },
    role: { stop: 600, on: 50 },
    highlight: { stop: 700, on: 50 },
    container: { stop: 200, on: 900 },
    outlines: { outline: 500, outline_variant: 400 },
  },
};

/** Where each fill token and its foreground come from, per mode. */
export const FILL_SOURCES = forEachMode((mode) => {
  const stops = TOKEN_STOPS[mode];
  return {
    ...Object.fromEntries(
      Object.entries(stops.surfaces).map(([name, fill]) => [name, { ramp: 'neutral', ...fill }]),
    ),
    ...Object.fromEntries(
      ROLES.flatMap((role) => {
        const ramp = ROLE_RAMPS[role];
        return [
          [role, { ramp, ...stops.role }],
          [`${role}_highlight`, { ramp, ...stops.highlight }],
          [`${role}_container`, { ramp, ...stops.container }],
        ];
      }),
    ),
  } as Readonly<Record<FillToken, FillSource>>;
});

/** Builds one mode's semantic tokens from finished ramps. */
export function buildTokens(rampOf: (name: RampName) => Ramp, mode: Mode): SemanticTokens {
  const tokens: Partial<Record<TokenName, Oklch>> = {};
  for (const name of FILL_TOKENS) {
    const source = FILL_SOURCES[mode][name];
    const ramp = rampOf(source.ramp);
    tokens[name] = ramp[source.stop];
    tokens[`on_${name}`] = readableOn(ramp, source.on, ramp[source.stop]);
  }
  for (const name of OUTLINES) {
    tokens[name] = rampOf('neutral')[TOKEN_STOPS[mode].outlines[name]];
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
