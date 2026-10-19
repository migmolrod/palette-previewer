import {
  formatHex,
  modeOklab,
  modeOklch,
  modeRgb,
  parse,
  toGamut,
  useMode,
  type Oklab,
  type Oklch,
} from 'culori/fn';

/**
 * Single entry point to the color library: the rest of the app imports from here, never from culori.
 * `culori/fn` ships without color spaces; register only the ones in use so the rest is tree-shaken.
 */
useMode(modeRgb);
const oklab = useMode(modeOklab);
const oklch = useMode(modeOklch);

/** Working color type: palettes are generated and adjusted in OKLCH. */
export type { Oklab, Oklch };

/** CSS Color 4 gamut mapping into sRGB: reduces chroma, keeps lightness and hue. */
const toSrgbGamut = toGamut('rgb', 'oklch');

/** Parses any CSS color string; `undefined` if invalid. */
export function parseColor(input: string): Oklch | undefined {
  const color = parse(input);
  return color ? oklch(color) : undefined;
}

/** Hex for display/export, gamut-mapped into sRGB first. */
export function toHex(color: Oklch): string {
  return formatHex(toSrgbGamut(color));
}

/** The same color, gamut-mapped into sRGB but kept in OKLCH. */
export function mapToSrgb(color: Oklch): Oklch {
  return oklch(toSrgbGamut(color));
}

export function toOklab(color: Oklch): Oklab {
  return oklab(color);
}

export function toOklch(color: Oklab): Oklch {
  return oklch(color);
}
