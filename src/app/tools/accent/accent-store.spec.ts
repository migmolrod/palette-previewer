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

  it('should replace slot overrides and drop zero offsets', () => {
    store.setSlot('color1', { lightness: 0.1, stop: 500 });
    store.setSlot('color1', { lightness: 0, chroma: 0, hue: 10 });
    expect(store.slots().color1).toEqual({ hue: 10 });
    store.resetSlot('color1');
    expect(store.slots().color1).toBeUndefined();
  });

  it('should remove a slot override that has nothing left', () => {
    store.setSlot('color1', { hue: 10 });
    store.setSlot('color1', { lightness: 0, chroma: 0, hue: 0 });
    expect('color1' in store.slots()).toBe(false);
  });
});
