import { toOklab, toOklch, type Oklch } from './color';

/** Offsets applied on top of a generated color. */
export interface Adjustment {
  /** OKLCH lightness offset, in 0–1 units. */
  readonly lightness: number;
  /** OKLCH chroma offset. */
  readonly chroma: number;
  /** Hue rotation, in degrees. */
  readonly hue: number;
}

export const NO_ADJUSTMENT: Adjustment = { lightness: 0, chroma: 0, hue: 0 };

export function adjust(color: Oklch, { lightness, chroma, hue }: Adjustment): Oklch {
  return {
    ...color,
    l: clamp(color.l + lightness, 0, 1),
    c: Math.max(0, color.c + chroma),
    h: ((((color.h ?? 0) + hue) % 360) + 360) % 360,
  };
}

/**
 * Color cast towards `tintColor`, like a white balance shift: moves the color's OKLab (a, b)
 * by `amount` times the tint's own (a, b). Neutrals take the tint's hue; colors lean towards it.
 */
export function tint(color: Oklch, tintColor: Oklch, amount: number): Oklch {
  if (amount === 0) {
    return color;
  }
  const base = toOklab(color);
  const cast = toOklab(tintColor);
  return toOklch({ ...base, a: base.a + cast.a * amount, b: base.b + cast.b * amount });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isNoAdjustment(a: Adjustment): boolean {
  return a.lightness === 0 && a.chroma === 0 && a.hue === 0;
}
