import { ComponentFixture, TestBed } from '@angular/core/testing';
import { toHex } from '../../palette/color';
import { DEFAULT_ACCENT_PARAMS, generateFromAccent } from '../../tools/accent/generate-from-accent';
import { PrimeNgPreview } from './primeng-preview';
import { PREVIEW_SCOPE_CLASS, previewVariables, type PreviewPalette } from './preview-theme';

describe('PrimeNgPreview', () => {
  const { accentRamp, neutralRamp, hueRamps, tokens } = generateFromAccent(DEFAULT_ACCENT_PARAMS);
  const palette: PreviewPalette = {
    primary: accentRamp,
    surface: neutralRamp,
    ...hueRamps,
    tokens,
  };

  it('should map ramps onto Aura scales and tokens onto semantic variables', () => {
    const variables = previewVariables(palette);
    expect(variables['--p-primary-500']).toBe(toHex(accentRamp[500]));
    expect(variables['--p-orange-400']).toBe(toHex(hueRamps.yellow[400]));
    expect(variables['--p-sky-400']).toBe(toHex(hueRamps.cyan[400]));
    expect(variables['--p-primary-color']).toBe(toHex(tokens.accent));
    expect(variables['--p-text-color']).toBe(toHex(tokens.on_surface));
  });

  describe('component', () => {
    let fixture: ComponentFixture<PrimeNgPreview>;

    beforeEach(async () => {
      fixture = TestBed.createComponent(PrimeNgPreview);
      fixture.componentRef.setInput('palette', palette);
      await fixture.whenStable();
    });

    it('should scope the palette variables to its host', () => {
      const host = fixture.nativeElement as HTMLElement;
      expect(host.classList).toContain(PREVIEW_SCOPE_CLASS);
      expect(host.style.getPropertyValue('--p-primary-color')).toBe(toHex(tokens.accent));
    });

    it('should inject the scoped Aura variables once', () => {
      TestBed.createComponent(PrimeNgPreview);
      const styles = document.head.querySelectorAll('style[data-palette-style-id="preview-theme"]');
      expect(styles.length).toBe(1);
      expect(styles[0].textContent).toContain(`.${PREVIEW_SCOPE_CLASS}{`);
      expect(styles[0].textContent).toContain('--p-button-primary-background:');
    });
  });
});
