import { contrast } from '../../palette/color';
import { FILL_TOKENS, MIN_TEXT_CONTRAST } from '../../palette/semantic-tokens';
import { DEFAULT_ACCENT_PARAMS, generateFromAccent } from './generate-from-accent';

describe('accent tokens', () => {
  it('should take danger from the red ramp and accent from the accent ramp', () => {
    const { tokens, hueRamps, accentRamp, neutralRamp } = generateFromAccent(DEFAULT_ACCENT_PARAMS);
    expect(tokens.danger).toEqual(hueRamps.red[400]);
    expect(tokens.accent_container).toEqual(accentRamp[800]);
    expect(tokens.background).toEqual(neutralRamp[950]);
  });

  it('should keep every on_ color readable even after extreme adjustments', () => {
    const { tokens } = generateFromAccent({
      ...DEFAULT_ACCENT_PARAMS,
      global: { lightness: -0.15, chroma: 0.1, hue: 0 },
      neutral: { lightness: 0.15, chroma: 0, hue: 0 },
    });
    for (const name of FILL_TOKENS) {
      expect(contrast(tokens[name], tokens[`on_${name}`]), name).toBeGreaterThanOrEqual(
        MIN_TEXT_CONTRAST,
      );
    }
  });
});
