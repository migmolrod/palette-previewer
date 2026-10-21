import { DEFAULT_ACCENT_PARAMS, generateFromAccent } from '../tools/accent/generate-from-accent';
import { toHex } from './color';
import { MODES } from './mode';
import { FILL_TOKENS, OUTLINES } from './semantic-tokens';
import { buildEnvFile, envFileName, envName } from './env-file';

const { variants } = generateFromAccent(DEFAULT_ACCENT_PARAMS);

/** Parses the `export NAME='value'` lines back into a map. */
function variables(file: string): Map<string, string> {
  return new Map(
    [...file.matchAll(/^export (\w+)='([^']*)'$/gm)].map(([, name, value]) => [name, value]),
  );
}

describe('env file', () => {
  it('should name variables with the prefix and upper-cased names', () => {
    expect(envName('on_surface_variant')).toBe('PAL_ON_SURFACE_VARIANT');
    expect(envName('color15')).toBe('PAL_COLOR15');
  });

  it('should name one file per mode', () => {
    expect(envFileName('dark')).toBe('palette-dark.sh');
    expect(envFileName('light')).toBe('palette-light.sh');
  });

  it('should export every color in hash, bare hex and rgb formats', () => {
    const { tokens, palette } = variants.dark;
    const vars = variables(buildEnvFile(tokens, palette, 'dark'));
    const hex = toHex(tokens.accent_container);
    expect(vars.get('PAL_ACCENT_CONTAINER')).toBe(hex);
    expect(vars.get('PAL_ACCENT_CONTAINER_HEX')).toBe(hex.slice(1));
    expect(vars.get('PAL_ACCENT_CONTAINER_RGB')).toBe(
      [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', '),
    );
    expect(vars.get('PAL_COLOR0')).toBe(toHex(palette.color0));
    expect(vars.get('PAL_FOREGROUND')).toBe(toHex(palette.foreground));
    for (const [name, value] of vars) {
      if (name === 'PAL_VARS') continue;
      expect(value).toMatch(
        name.endsWith('_HEX')
          ? /^[0-9a-f]{6}$/
          : name.endsWith('_RGB')
            ? /^\d{1,3}, \d{1,3}, \d{1,3}$/
            : /^#[0-9a-f]{6}$/,
      );
    }
  });

  it('should cover the token set and terminal slots', () => {
    const { tokens, palette } = variants.dark;
    const names = [...variables(buildEnvFile(tokens, palette, 'dark')).keys()];
    for (const name of [
      'PAL_BACKGROUND',
      'PAL_ON_BACKGROUND',
      'PAL_SURFACE_VARIANT',
      'PAL_ON_DANGER_HIGHLIGHT',
      'PAL_OUTLINE_VARIANT',
      'PAL_COLOR15',
    ]) {
      expect(names).toContain(name);
    }
    // 3 formats × (fill/on pairs + outlines + foreground + 16 ANSI), plus PAL_VARS.
    expect(names.length).toBe(3 * (FILL_TOKENS.length * 2 + OUTLINES.length + 1 + 16) + 1);
  });

  it('should list every exported color in PAL_VARS', () => {
    const { tokens, palette } = variants.dark;
    const vars = variables(buildEnvFile(tokens, palette, 'dark'));
    const listed = vars.get('PAL_VARS')!.split(' ');
    expect(listed).toEqual([...vars.keys()].filter((n) => n !== 'PAL_VARS').map((n) => `$${n}`));
  });

  it('should use identical variable names in both modes, with mode-specific values', () => {
    const [dark, light] = MODES.map((mode) =>
      variables(buildEnvFile(variants[mode].tokens, variants[mode].palette, mode)),
    );
    expect([...light.keys()]).toEqual([...dark.keys()]);
    expect(light.get('PAL_BACKGROUND')).not.toBe(dark.get('PAL_BACKGROUND'));
  });

  it('should let PAL_BACKGROUND stand in for the terminal background', () => {
    for (const mode of MODES) {
      const { tokens, palette } = variants[mode];
      expect(toHex(palette.background)).toBe(toHex(tokens.background));
    }
  });
});
