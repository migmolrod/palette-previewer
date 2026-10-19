import { TestBed } from '@angular/core/testing';
import { AccentStore } from './accent-store';

describe('AccentStore', () => {
  let store: InstanceType<typeof AccentStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AccentStore] });
    store = TestBed.inject(AccentStore);
  });

  it('should ignore invalid accent input', () => {
    const before = store.accentHex();
    expect(store.setAccent('nope')).toBe(false);
    expect(store.accentHex()).toBe(before);
  });

  it('should regenerate the palette when the accent changes', () => {
    const before = store.result().palette.background;
    store.setAccent('#ff8800');
    expect(store.result().palette.background).not.toEqual(before);
  });

  it('should merge and reset slot overrides', () => {
    store.setSlot('color1', { lightness: 0.1 });
    store.setSlot('color1', { hue: 10 });
    expect(store.slots().color1).toEqual({ lightness: 0.1, hue: 10 });
    store.resetSlot('color1');
    expect(store.slots().color1).toBeUndefined();
  });
});
