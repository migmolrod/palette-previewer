import { ComponentFixture, TestBed } from '@angular/core/testing';
import { parseColor } from '../../palette/color';
import { ColorInput } from './color-input';

describe('ColorInput', () => {
  let fixture: ComponentFixture<ColorInput>;
  let input: HTMLInputElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ColorInput);
    fixture.componentRef.setInput('label', 'Accent');
    fixture.componentRef.setInput('inputId', 'accent');
    fixture.componentRef.setInput('color', parseColor('#7aa2f7'));
    await fixture.whenStable();
    input = (fixture.nativeElement as HTMLElement).querySelector('input#accent')!;
  });

  const type = async (text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  };

  it('should accept any CSS color', async () => {
    await type('oklch(0.7 0.15 30)');
    expect(fixture.componentInstance.color().h).toBeCloseTo(30);
  });

  it('should flag invalid input and keep the previous color', async () => {
    await type('nope');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.componentInstance.color()).toEqual(parseColor('#7aa2f7'));
  });
});
