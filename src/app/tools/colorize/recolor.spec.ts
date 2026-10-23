import { parseColor, toOklab } from '../../palette/color';
import {
  DEFAULT_RECOLOR_SETTINGS,
  labToRgb,
  recolor,
  rgbToLab,
  type LabColor,
  type RecolorSettings,
} from './recolor';

function lab(css: string): LabColor {
  const { l, a, b } = toOklab(parseColor(css)!);
  return { l, a, b };
}

const RED = lab('#ff0000');
const BLUE = lab('#0000ff');
const BLACK = lab('#000000');
const WHITE = lab('#ffffff');

/** One RGBA pixel per color. */
function pixels(...colors: [number, number, number][]): Uint8ClampedArray {
  return Uint8ClampedArray.from(colors.flatMap(([r, g, b]) => [r, g, b, 200]));
}

function run(data: Uint8ClampedArray, palette: LabColor[], settings: Partial<RecolorSettings>) {
  recolor(data, data.length / 4, palette, { ...DEFAULT_RECOLOR_SETTINGS, ...settings });
  return data;
}

describe('OKLab conversion', () => {
  it('matches culori', () => {
    const expected = lab('#3a7bd5');
    const actual = rgbToLab(0x3a, 0x7b, 0xd5);
    expect(actual.l).toBeCloseTo(expected.l, 5);
    expect(actual.a).toBeCloseTo(expected.a, 5);
    expect(actual.b).toBeCloseTo(expected.b, 5);
  });

  it('round-trips sRGB bytes', () => {
    const samples: [number, number, number][] = [
      [0, 0, 0],
      [255, 255, 255],
      [12, 200, 99],
    ];
    for (const rgb of samples) {
      expect(labToRgb(rgbToLab(...rgb)).map(Math.round)).toEqual(rgb);
    }
  });

  it('clips colors outside sRGB', () => {
    const [r, g, b] = labToRgb({ l: 0.7, a: 0.4, b: 0 });
    for (const channel of [r, g, b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
  });
});

describe('recolor', () => {
  it('posterizes to the nearest palette color and keeps alpha', () => {
    const data = run(pixels([230, 30, 30], [20, 20, 200]), [RED, BLUE], { method: 'posterize' });
    expect([...data]).toEqual([255, 0, 0, 200, 0, 0, 255, 200]);
  });

  it('dithers a mid gray into a mix of black and white', () => {
    const gray = Array.from({ length: 16 }, () => [119, 119, 119] as [number, number, number]);
    const data = run(pixels(...gray), [BLACK, WHITE], { method: 'posterize', dither: true });
    const whites = gray.filter((_, i) => data[i * 4] === 255).length;
    expect(whites).toBeGreaterThan(4);
    expect(whites).toBeLessThan(12);
    expect(data.every((value, i) => i % 4 === 3 || value === 0 || value === 255)).toBe(true);
  });

  it('maps colors close to a palette color onto it when smoothing with a small radius', () => {
    const data = run(pixels([240, 20, 10]), [RED, BLUE], { radius: 0.01 });
    expect([...data.slice(0, 3)]).toEqual([255, 0, 0]);
  });

  it('blends palette colors when smoothing with a large radius', () => {
    const [r, , b] = run(pixels([128, 0, 128]), [RED, BLUE], { radius: 0.2 });
    expect(r).toBeGreaterThan(40);
    expect(b).toBeGreaterThan(40);
  });

  it('leaves the image untouched at zero strength', () => {
    const data = run(pixels([12, 200, 99]), [RED, BLUE], { strength: 0 });
    expect([...data]).toEqual([12, 200, 99, 200]);
  });

  it('keeps lightness when asked', () => {
    const [r, g, b] = run(pixels([60, 60, 60]), [WHITE], { radius: 0.01, keepLightness: true });
    expect(rgbToLab(r, g, b).l).toBeCloseTo(rgbToLab(60, 60, 60).l, 2);
  });

  it('does nothing without palette colors', () => {
    const data = run(pixels([1, 2, 3]), [], {});
    expect([...data]).toEqual([1, 2, 3, 200]);
  });
});
