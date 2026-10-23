import { toHex, toOklab } from '../../palette/color';
import type { Mode } from '../../palette/mode';
import { STOPS } from '../../palette/ramp';
import { SLOTS } from '../../palette/terminal-palette';
import type { AccentResult } from '../accent/generate-from-accent';
import type { LabColor } from './recolor';

/** Which of the palette's colors an image may end up with. */
export type PaletteColors = 'terminal' | 'ramps';

/**
 * The palette colors to recolor with, in OKLab and without duplicates: the mode's terminal slots
 * (background, foreground and the 16 ANSI colors), or every stop of every ramp, which is the same
 * in both modes.
 */
export function paletteColors(result: AccentResult, mode: Mode, colors: PaletteColors): LabColor[] {
  const chosen =
    colors === 'terminal'
      ? SLOTS.map((slot) => result.variants[mode].palette[slot.id])
      : [result.accentRamp, result.neutralRamp, ...Object.values(result.hueRamps)].flatMap((ramp) =>
          STOPS.map((stop) => ramp[stop]),
        );
  const unique = new Map(chosen.map((color) => [toHex(color), color]));
  return [...unique.values()].map((color) => {
    const { l, a, b } = toOklab(color);
    return { l, a, b };
  });
}
