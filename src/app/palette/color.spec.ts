import { parseColor, toHex } from './color';

describe('color', () => {
  it('should round-trip a hex color through OKLCH', () => {
    const color = parseColor('#7aa2f7');
    expect(color?.mode).toBe('oklch');
    expect(toHex(color!)).toBe('#7aa2f7');
  });

  it('should return undefined for invalid input', () => {
    expect(parseColor('not-a-color')).toBeUndefined();
  });

  it('should gamut-map out-of-sRGB colors instead of failing', () => {
    expect(toHex({ mode: 'oklch', l: 0.5, c: 0.4, h: 180 })).toMatch(/^#[0-9a-f]{6}$/);
  });
});
