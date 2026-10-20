import { ComponentFixture, TestBed } from '@angular/core/testing';
import { parseColor } from '../../../palette/color';
import { TintControls } from './tint-controls';

describe('TintControls', () => {
  const accent = parseColor('#7aa2f7')!;
  let fixture: ComponentFixture<TintControls>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TintControls);
    fixture.componentRef.setInput('tint', { color: null, amount: 0, neutralAmount: 0.2 });
    fixture.componentRef.setInput('accent', accent);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should hide the color input while the accent is the source', () => {
    expect(element.querySelector('app-color-input')).toBeNull();
  });

  it('should start a custom tint from the accent and keep the strengths', async () => {
    const custom = element.querySelector<HTMLElement>('p-togglebutton[aria-label="Custom"]')!;
    custom.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.tint()).toEqual({
      color: accent,
      amount: 0,
      neutralAmount: 0.2,
    });
    expect(element.querySelector('app-color-input')).not.toBeNull();
  });
});
