import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SliderField } from './slider-field';

describe('SliderField', () => {
  let fixture: ComponentFixture<SliderField>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(SliderField);
    fixture.componentRef.setInput('label', 'Hue');
    fixture.componentRef.setInput('min', -180);
    fixture.componentRef.setInput('max', 180);
    fixture.componentRef.setInput('value', 30);
    fixture.componentRef.setInput('format', (value: number) => `${value}°`);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should show the formatted value', () => {
    expect(element.querySelector('output')?.textContent).toBe('30°');
  });

  it('should label the slider for assistive technology', () => {
    expect(element.querySelector('input[type="range"]')?.getAttribute('aria-label')).toBe('Hue');
  });

  it('should reset to the default value', async () => {
    element.querySelector('button')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe(0);
    expect(element.querySelector('button')!.disabled).toBe(true);
  });
});
