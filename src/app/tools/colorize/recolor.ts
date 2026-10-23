/**
 * Recolors RGBA pixels so they only use a palette's colors. Pure and DOM-free, so it runs in the
 * colorize worker and in unit tests alike. Color math is Björn Ottosson's OKLab, inlined instead of
 * going through culori because it runs once per pixel.
 */

/** A palette color in OKLab, as culori's `Oklab` but without the mode tag. */
export interface LabColor {
  readonly l: number;
  readonly a: number;
  readonly b: number;
}

export type RecolorMethod = 'smooth' | 'posterize';

export interface RecolorSettings {
  /**
   * `smooth` blends nearby palette colors (Gaussian RBF, like lutgen) and keeps gradients;
   * `posterize` snaps every pixel to its nearest palette color.
   */
  readonly method: RecolorMethod;
  /** Smooth: OKLab distance over which palette colors blend; small values approach posterize. */
  readonly radius: number;
  /** Smooth: keeps each pixel's own lightness, taking only hue and chroma from the palette. */
  readonly keepLightness: boolean;
  /** Smooth: 0 leaves the image untouched, 1 applies the palette fully. */
  readonly strength: number;
  /** Posterize: Floyd–Steinberg error diffusion, trading flat areas for smoother gradients. */
  readonly dither: boolean;
}

export const DEFAULT_RECOLOR_SETTINGS: RecolorSettings = {
  method: 'smooth',
  radius: 0.06,
  keepLightness: false,
  strength: 1,
  dither: false,
};

/** Grid points per channel of the smooth method's 3D lookup table. */
export const LUT_SIZE = 64;

/** Recolors `pixels` (RGBA, row-major) in place; alpha is left untouched. */
export function recolor(
  pixels: Uint8ClampedArray,
  width: number,
  palette: readonly LabColor[],
  settings: RecolorSettings,
): void {
  if (palette.length === 0) return;
  if (settings.method === 'smooth') {
    applyLut(pixels, buildLut(palette, settings));
  } else if (settings.dither) {
    posterizeDithered(pixels, width, palette);
  } else {
    posterize(pixels, palette);
  }
}

/** sRGB byte to linear light. */
const LINEAR = Float32Array.from({ length: 256 }, (_, value) => linearAt(value));

export function rgbToLab(r: number, g: number, b: number): LabColor {
  return linearToLab(LINEAR[r], LINEAR[g], LINEAR[b]);
}

function linearToLab(r: number, g: number, b: number): LabColor {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

/** OKLab to sRGB channels in 0–255 (unrounded), clipped into gamut. */
export function labToRgb({ l, a, b }: LabColor): [number, number, number] {
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    encode(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    encode(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    encode(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  ];
}

/** Linear light to an sRGB value in 0–255. */
function encode(linear: number): number {
  const c = Math.min(1, Math.max(0, linear));
  return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
}

/**
 * Where the smooth method sends every color: a `LUT_SIZE`³ grid over sRGB holding output RGB
 * triplets, red varying fastest. Each output is the palette's Gaussian-weighted average around
 * the input color, so it changes gradually between palette colors instead of jumping.
 */
export function buildLut(palette: readonly LabColor[], settings: RecolorSettings): Float32Array {
  const lut = new Float32Array(LUT_SIZE ** 3 * 3);
  const distances = new Float64Array(palette.length);
  const falloff = 1 / (2 * settings.radius ** 2);
  const step = 255 / (LUT_SIZE - 1);
  let index = 0;
  for (let bi = 0; bi < LUT_SIZE; bi++) {
    for (let gi = 0; gi < LUT_SIZE; gi++) {
      for (let ri = 0; ri < LUT_SIZE; ri++) {
        const input = linearToLab(linearAt(ri * step), linearAt(gi * step), linearAt(bi * step));
        // Weights are relative to the nearest color, so they never all underflow to zero.
        let nearest = Infinity;
        for (let i = 0; i < palette.length; i++) {
          distances[i] = distanceSquared(input, palette[i]);
          nearest = Math.min(nearest, distances[i]);
        }
        let total = 0;
        let l = 0;
        let a = 0;
        let b = 0;
        for (let i = 0; i < palette.length; i++) {
          const weight = Math.exp((nearest - distances[i]) * falloff);
          total += weight;
          l += weight * palette[i].l;
          a += weight * palette[i].a;
          b += weight * palette[i].b;
        }
        const mapped = {
          l: settings.keepLightness ? input.l : l / total,
          a: a / total,
          b: b / total,
        };
        const [r, g, bl] = labToRgb(mix(input, mapped, settings.strength));
        lut[index++] = r;
        lut[index++] = g;
        lut[index++] = bl;
      }
    }
  }
  return lut;
}

/** Linear light of an sRGB value in 0–255 that may fall between bytes. */
function linearAt(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Looks every pixel up in `lut` with trilinear interpolation. */
export function applyLut(pixels: Uint8ClampedArray, lut: Float32Array): void {
  const scale = (LUT_SIZE - 1) / 255;
  const max = LUT_SIZE - 2;
  const rowStride = LUT_SIZE * 3;
  const planeStride = LUT_SIZE * LUT_SIZE * 3;
  for (let p = 0; p < pixels.length; p += 4) {
    const r = pixels[p] * scale;
    const g = pixels[p + 1] * scale;
    const b = pixels[p + 2] * scale;
    // Clamping the cell to `max` keeps the upper corner in range at 255, where the fraction is 1.
    const r0 = Math.min(Math.floor(r), max);
    const g0 = Math.min(Math.floor(g), max);
    const b0 = Math.min(Math.floor(b), max);
    const fr = r - r0;
    const fg = g - g0;
    const fb = b - b0;
    const base = b0 * planeStride + g0 * rowStride + r0 * 3;
    for (let channel = 0; channel < 3; channel++) {
      const c000 = base + channel;
      const c100 = c000 + 3;
      const c010 = c000 + rowStride;
      const c110 = c010 + 3;
      const c001 = c000 + planeStride;
      const c101 = c001 + 3;
      const c011 = c001 + rowStride;
      const c111 = c011 + 3;
      const x00 = lut[c000] + (lut[c100] - lut[c000]) * fr;
      const x10 = lut[c010] + (lut[c110] - lut[c010]) * fr;
      const x01 = lut[c001] + (lut[c101] - lut[c001]) * fr;
      const x11 = lut[c011] + (lut[c111] - lut[c011]) * fr;
      const y0 = x00 + (x10 - x00) * fg;
      const y1 = x01 + (x11 - x01) * fg;
      pixels[p + channel] = Math.round(y0 + (y1 - y0) * fb);
    }
  }
}

/** Replaces every pixel with its nearest palette color. */
function posterize(pixels: Uint8ClampedArray, palette: readonly LabColor[]): void {
  const rgb = palette.map((color) => labToRgb(color).map(Math.round));
  for (let p = 0; p < pixels.length; p += 4) {
    const [r, g, b] = rgb[nearestIndex(rgbToLab(pixels[p], pixels[p + 1], pixels[p + 2]), palette)];
    pixels[p] = r;
    pixels[p + 1] = g;
    pixels[p + 2] = b;
  }
}

/** Posterize with Floyd–Steinberg dithering; the error is diffused in OKLab. */
function posterizeDithered(
  pixels: Uint8ClampedArray,
  width: number,
  palette: readonly LabColor[],
): void {
  const rgb = palette.map((color) => labToRgb(color).map(Math.round));
  // Error carried into the current and next rows, three channels per pixel plus one pixel of
  // padding on each side so the kernel never needs bounds checks.
  let current = new Float32Array((width + 2) * 3);
  let next = new Float32Array((width + 2) * 3);
  const rows = pixels.length / 4 / width;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      const e = (x + 1) * 3;
      const own = rgbToLab(pixels[p], pixels[p + 1], pixels[p + 2]);
      const wanted = {
        l: own.l + current[e],
        a: own.a + current[e + 1],
        b: own.b + current[e + 2],
      };
      const index = nearestIndex(wanted, palette);
      const chosen = palette[index];
      const error = [wanted.l - chosen.l, wanted.a - chosen.a, wanted.b - chosen.b];
      for (let channel = 0; channel < 3; channel++) {
        current[e + 3 + channel] += (error[channel] * 7) / 16;
        next[e - 3 + channel] += (error[channel] * 3) / 16;
        next[e + channel] += (error[channel] * 5) / 16;
        next[e + 3 + channel] += error[channel] / 16;
      }
      [pixels[p], pixels[p + 1], pixels[p + 2]] = rgb[index];
    }
    [current, next] = [next, current];
    next.fill(0);
  }
}

function nearestIndex(color: LabColor, palette: readonly LabColor[]): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const distance = distanceSquared(color, palette[i]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

function distanceSquared(x: LabColor, y: LabColor): number {
  const dl = x.l - y.l;
  const da = x.a - y.a;
  const db = x.b - y.b;
  return dl * dl + da * da + db * db;
}

function mix(from: LabColor, to: LabColor, amount: number): LabColor {
  return {
    l: from.l + (to.l - from.l) * amount,
    a: from.a + (to.a - from.a) * amount,
    b: from.b + (to.b - from.b) * amount,
  };
}
