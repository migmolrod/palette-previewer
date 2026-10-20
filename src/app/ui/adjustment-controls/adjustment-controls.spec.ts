import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdjustmentControls } from './adjustment-controls';

describe('AdjustmentControls', () => {
  let fixture: ComponentFixture<AdjustmentControls>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(AdjustmentControls);
    fixture.componentRef.setInput('adjustment', { lightness: 0.1, chroma: -0.02, hue: 15 });
    await fixture.whenStable();
  });

  it('should render one slider per channel', () => {
    const labels = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('input[type="range"]'),
    ].map((el) => el.getAttribute('aria-label'));
    expect(labels).toEqual(['Lightness', 'Chroma', 'Hue']);
  });

  it('should reset one channel and keep the others', async () => {
    const resetHue = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Reset Hue"]',
    )!;
    resetHue.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.adjustment()).toEqual({
      lightness: 0.1,
      chroma: -0.02,
      hue: 0,
    });
  });
});
