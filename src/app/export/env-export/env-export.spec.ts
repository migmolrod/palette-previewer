import { Clipboard } from '@angular/cdk/clipboard';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { buildEnvFile } from '../../palette/env-file';
import { DEFAULT_ACCENT_PARAMS, generateFromAccent } from '../../tools/accent/generate-from-accent';
import { EnvExport } from './env-export';

describe('EnvExport', () => {
  const { tokens, palette } = generateFromAccent(DEFAULT_ACCENT_PARAMS).variants.light;
  let fixture: ComponentFixture<EnvExport>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(EnvExport);
    fixture.componentRef.setInput('tokens', tokens);
    fixture.componentRef.setInput('palette', palette);
    fixture.componentRef.setInput('mode', 'light');
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should preview the file for the given mode', () => {
    expect(element.querySelector('pre')?.textContent).toBe(buildEnvFile(tokens, palette, 'light'));
    expect(element.textContent).toContain('Download palette-light.sh');
  });

  it('should copy the file and announce it', async () => {
    const copy = vi.spyOn(TestBed.inject(Clipboard), 'copy').mockReturnValue(true);
    element.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    expect(copy).toHaveBeenCalledWith(buildEnvFile(tokens, palette, 'light'));
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'Copied palette-light.sh',
    );
  });

  it('should download the file under its mode name', () => {
    URL.createObjectURL = vi.fn(() => 'blob:palette');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toBe('palette-light.sh');
      expect(this.href).toBe('blob:palette');
    });
    element.querySelectorAll<HTMLButtonElement>('button')[1].click();
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:palette');
  });
});
