import { DEFAULT_ACCENT_PARAMS, generateFromAccent } from '../accent/generate-from-accent';
import { paletteColors } from './colorize-palette';

describe('paletteColors', () => {
  const result = generateFromAccent(DEFAULT_ACCENT_PARAMS);

  it('takes the terminal slots of the chosen mode', () => {
    const dark = paletteColors(result, 'dark', 'terminal');
    const light = paletteColors(result, 'light', 'terminal');
    expect(dark.length).toBeGreaterThan(10);
    expect(dark.length).toBeLessThanOrEqual(18);
    expect(dark).not.toEqual(light);
  });

  it('takes every ramp stop regardless of mode', () => {
    const ramps = paletteColors(result, 'dark', 'ramps');
    expect(ramps.length).toBeGreaterThan(18);
    expect(ramps).toEqual(paletteColors(result, 'light', 'ramps'));
  });

  it('returns plain OKLab triplets the worker can receive', () => {
    expect(Object.keys(paletteColors(result, 'dark', 'terminal')[0]).sort()).toEqual([
      'a',
      'b',
      'l',
    ]);
  });
});
