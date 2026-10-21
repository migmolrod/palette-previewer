import type { Oklch } from './color';

/** Below this chroma a color reads as gray whatever its hue. */
const GRAY_CHROMA = 0.03;

/** Approximate OKLCH hue of each name; a color takes the nearest one. */
const HUE_NAMES: readonly (readonly [name: string, hue: number])[] = [
  ['red', 25],
  ['orange', 55],
  ['yellow', 95],
  ['lime', 125],
  ['green', 150],
  ['teal', 180],
  ['cyan', 205],
  ['sky', 230],
  ['blue', 260],
  ['indigo', 280],
  ['violet', 300],
  ['magenta', 330],
  ['pink', 355],
];

/** Plain English name of a color's hue, e.g. "teal"; "gray" for near-neutral colors. */
export function colorName(color: Oklch): string {
  const { c, h } = color;
  if (c < GRAY_CHROMA || h === undefined) return 'gray';
  let best = HUE_NAMES[0];
  for (const entry of HUE_NAMES) {
    if (hueDistance(entry[1], h) < hueDistance(best[1], h)) best = entry;
  }
  return best[0];
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return Math.min(d, 360 - d);
}
