import { contrast, parseColor } from '../../palette/color';
import { MODES } from '../../palette/mode';
import { FILL_TOKENS, MIN_TEXT_CONTRAST } from '../../palette/semantic-tokens';
import {
  DEFAULT_ACCENT_PARAMS,
  generateFromAccent,
  type AccentParams,
} from './generate-from-accent';

describe('accent tokens', () => {
  const expectReadable = (params: AccentParams) => {
    const { variants } = generateFromAccent(params);
    for (const mode of MODES) {
      const { tokens } = variants[mode];
      for (const name of FILL_TOKENS) {
        expect(
          contrast(tokens[name], tokens[`on_${name}`]),
          `${mode} ${name}`,
        ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
      }
    }
  };

  it('should take danger from the red ramp and accent from the accent ramp', () => {
    const { variants, hueRamps, accentRamp, neutralRamp } =
      generateFromAccent(DEFAULT_ACCENT_PARAMS);
    expect(variants.dark.tokens.danger).toEqual(hueRamps.red[400]);
    expect(variants.dark.tokens.accent_container).toEqual(accentRamp[800]);
    expect(variants.dark.tokens.background).toEqual(neutralRamp[950]);
  });

  it('should take light tokens from the opposite ends of the same ramps', () => {
    const { variants, hueRamps, accentRamp, neutralRamp } =
      generateFromAccent(DEFAULT_ACCENT_PARAMS);
    expect(variants.light.tokens.danger).toEqual(hueRamps.red[600]);
    expect(variants.light.tokens.accent_container).toEqual(accentRamp[200]);
    expect(variants.light.tokens.background).toEqual(neutralRamp[50]);
    expect(variants.light.tokens.on_background).toEqual(neutralRamp[900]);
  });

  it('should keep every on_ color readable in both modes with the default params', () => {
    expectReadable(DEFAULT_ACCENT_PARAMS);
  });

  it('should keep every on_ color readable in both modes across accent hues', () => {
    for (const hex of [
      '#f7768e',
      '#e0af68',
      '#9ece6a',
      '#2ac3de',
      '#bb9af7',
      '#ffff00',
      '#808080',
    ]) {
      expectReadable({ ...DEFAULT_ACCENT_PARAMS, accent: parseColor(hex)! });
    }
  });

  it('should keep every on_ color readable in both modes even after extreme adjustments', () => {
    expectReadable({
      ...DEFAULT_ACCENT_PARAMS,
      global: { lightness: -0.15, chroma: 0.1, hue: 0 },
      neutral: { lightness: 0.15, chroma: 0, hue: 0 },
    });
    expectReadable({
      ...DEFAULT_ACCENT_PARAMS,
      global: { lightness: 0.15, chroma: 0.1, hue: 0 },
      neutral: { lightness: -0.15, chroma: 0, hue: 0 },
    });
  });
});
