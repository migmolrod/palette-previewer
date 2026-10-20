import { parseColor } from '../../palette/color';
import { TestBed } from '@angular/core/testing';
import { AccentStore } from './accent-store';

describe('AccentStore', () => {
  let store: InstanceType<typeof AccentStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AccentStore] });
    store = TestBed.inject(AccentStore);
  });

  it('should regenerate the palette when the accent changes', () => {
    const before = store.result().palette.background;
    store.setAccent(parseColor('#ff8800')!);
    expect(store.result().palette.background).not.toEqual(before);
  });

  it('should set and drop per-ramp adjustments', () => {
    store.setRamp('red', { lightness: 0, chroma: 0, hue: 10 });
    expect(store.ramps().red).toEqual({ lightness: 0, chroma: 0, hue: 10 });
    store.setRamp('red', { lightness: 0, chroma: 0, hue: 0 });
    expect('red' in store.ramps()).toBe(false);
  });
});
