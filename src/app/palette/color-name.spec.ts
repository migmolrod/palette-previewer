import { colorName } from './color-name';

describe('colorName', () => {
  it('should name a color after the nearest hue', () => {
    expect(colorName({ mode: 'oklch', l: 0.7, c: 0.12, h: 182 })).toBe('teal');
    expect(colorName({ mode: 'oklch', l: 0.64, c: 0.15, h: 260 })).toBe('blue');
  });

  it('should wrap around the hue circle', () => {
    expect(colorName({ mode: 'oklch', l: 0.6, c: 0.2, h: 359 })).toBe('pink');
    expect(colorName({ mode: 'oklch', l: 0.6, c: 0.2, h: 5 })).toBe('pink');
    expect(colorName({ mode: 'oklch', l: 0.6, c: 0.2, h: -335 })).toBe('red');
  });

  it('should call near-neutral colors gray', () => {
    expect(colorName({ mode: 'oklch', l: 0.5, c: 0.01, h: 30 })).toBe('gray');
    expect(colorName({ mode: 'oklch', l: 0.5, c: 0 })).toBe('gray');
  });
});
