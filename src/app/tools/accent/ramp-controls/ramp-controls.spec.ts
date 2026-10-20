import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ADJUSTMENT } from '../../../palette/adjust';
import { DEFAULT_ACCENT_PARAMS, generateFromAccent } from '../generate-from-accent';
import { RampControls } from './ramp-controls';

describe('RampControls', () => {
  let fixture: ComponentFixture<RampControls>;
  let element: HTMLElement;

  const resetButton = () =>
    [...element.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Reset red ramp'),
    )!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(RampControls);
    fixture.componentRef.setInput('ramp', 'red');
    fixture.componentRef.setInput('result', generateFromAccent(DEFAULT_ACCENT_PARAMS));
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should disable the reset while the ramp is untouched', () => {
    expect(resetButton().disabled).toBe(true);
  });

  it('should reset the ramp adjustment', async () => {
    fixture.componentRef.setInput('adjustment', { lightness: 0.1, chroma: 0, hue: 15 });
    await fixture.whenStable();
    resetButton().click();
    await fixture.whenStable();
    expect(fixture.componentInstance.adjustment()).toEqual(NO_ADJUSTMENT);
  });
});
