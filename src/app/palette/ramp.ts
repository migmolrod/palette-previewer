import type { Oklch } from './color';

export const STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export type Stop = (typeof STOPS)[number];

export type Ramp = Record<Stop, Oklch>;

/** Fixed OKLCH lightness per stop, so the same stop looks equally bright across hues. */
const LIGHTNESS: Record<Stop, number> = {
  50: 0.97,
  100: 0.93,
  200: 0.87,
  300: 0.8,
  400: 0.72,
  500: 0.64,
  600: 0.56,
  700: 0.48,
  800: 0.4,
  900: 0.31,
  950: 0.22,
};

/** Chroma multiplier per stop: peaks mid-ramp and fades towards both ends, where sRGB gets narrow. */
const CHROMA_CURVE: Record<Stop, number> = {
  50: 0.25,
  100: 0.4,
  200: 0.6,
  300: 0.8,
  400: 0.95,
  500: 1,
  600: 0.95,
  700: 0.85,
  800: 0.7,
  900: 0.5,
  950: 0.35,
};

/** Builds a 50–950 ramp with constant hue; `chroma` is the peak chroma (at 500). */
export function buildRamp(hue: number, chroma: number): Ramp {
  return Object.fromEntries(
    STOPS.map((stop) => [
      stop,
      { mode: 'oklch', l: LIGHTNESS[stop], c: chroma * CHROMA_CURVE[stop], h: hue },
    ]),
  ) as Ramp;
}
