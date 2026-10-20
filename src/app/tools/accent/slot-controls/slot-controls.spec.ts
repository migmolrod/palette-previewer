import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Select } from 'primeng/select';
import { DEFAULT_ACCENT_PARAMS, generateFromAccent } from '../generate-from-accent';
import { SlotControls } from './slot-controls';

describe('SlotControls', () => {
  let fixture: ComponentFixture<SlotControls>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(SlotControls);
    fixture.componentRef.setInput('slot', 'color1');
    fixture.componentRef.setInput('override', { hue: 15 });
    fixture.componentRef.setInput('result', generateFromAccent(DEFAULT_ACCENT_PARAMS));
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  // jsdom lacks matchMedia, which the select overlay needs, so pick through the binding.
  const pickStop = async (stop: number) => {
    const [, stopSelect] = fixture.debugElement.queryAll(By.directive(Select));
    stopSelect.triggerEventHandler('ngModelChange', stop);
    await fixture.whenStable();
  };

  it('should show the slot default stop', () => {
    expect(element.textContent).toContain('400 (default)');
  });

  it('should set a stop and drop it again when the default is picked', async () => {
    await pickStop(600);
    expect(fixture.componentInstance.override()).toEqual({ hue: 15, stop: 600 });

    fixture.componentRef.setInput('override', { hue: 15, stop: 600 });
    await fixture.whenStable();
    await pickStop(400);
    expect(fixture.componentInstance.override()).toEqual({ hue: 15 });
  });

  it('should reset the whole slot', async () => {
    const reset = [...element.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Reset slot'),
    )!;
    reset.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.override()).toEqual({});
  });
});
