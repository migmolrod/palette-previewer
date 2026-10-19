import { parseColor } from '../../palette/color';
import { ANSI_SLOTS } from '../../palette/terminal-palette';
import { DEFAULT_ACCENT_PARAMS, generateFromAccent } from './generate-from-accent';

describe('generateFromAccent', () => {
  const withAccent = (hex: string) => ({ ...DEFAULT_ACCENT_PARAMS, accent: parseColor(hex)! });

  it('should fill every terminal slot', () => {
    const { palette } = generateFromAccent(DEFAULT_ACCENT_PARAMS);
    for (const id of [...ANSI_SLOTS, 'background', 'foreground'] as const) {
      expect(palette[id]).toBeDefined();
    }
  });

  it('should snap the nearest chromatic slot to the accent hue', () => {
    const accent = parseColor('#7aa2f7')!;
    const { palette } = generateFromAccent(withAccent('#7aa2f7'));
    expect(palette.color4.h).toBeCloseTo(accent.h!, 0);
    expect(palette.color1.h).not.toBeCloseTo(accent.h!, 0);
  });

  it('should give normal colors equal lightness regardless of hue', () => {
    const { palette } = generateFromAccent(DEFAULT_ACCENT_PARAMS);
    const normals = [palette.color1, palette.color2, palette.color3, palette.color4];
    for (const color of normals) {
      expect(color.l).toBeCloseTo(normals[0].l, 1);
    }
  });

  it('should keep a dark background darker than the foreground', () => {
    const { palette } = generateFromAccent(DEFAULT_ACCENT_PARAMS);
    expect(palette.background.l).toBeLessThan(palette.foreground.l);
  });

  it('should apply per-slot overrides on top of global adjustments', () => {
    const base = generateFromAccent(DEFAULT_ACCENT_PARAMS).palette.color1;
    const { palette } = generateFromAccent({
      ...DEFAULT_ACCENT_PARAMS,
      global: { lightness: -0.1, chroma: 0, hue: 0 },
      slots: { color1: { lightness: 0.05 } },
    });
    expect(palette.color1.l).toBeCloseTo(base.l - 0.05, 2);
  });

  it('should tint neutrals towards the tint color', () => {
    const { palette } = generateFromAccent({
      ...DEFAULT_ACCENT_PARAMS,
      tint: { color: parseColor('#ff8800')!, amount: 0, neutralAmount: 0.3 },
    });
    expect(palette.background.h!).toBeGreaterThan(40);
    expect(palette.background.h!).toBeLessThan(90);
  });
});
