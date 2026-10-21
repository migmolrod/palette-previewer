import { parseColor } from '../../palette/color';
import { TestBed } from '@angular/core/testing';
import { AccentStore, SAVE_DEBOUNCE_MS } from './accent-store';
import { ACCENT_STORAGE_KEY, loadAccentParams, saveAccentParams } from './accent-storage';
import { DEFAULT_ACCENT_PARAMS } from './generate-from-accent';

describe('AccentStore', () => {
  let store: InstanceType<typeof AccentStore>;

  function createStore(): void {
    TestBed.configureTestingModule({ providers: [AccentStore] });
    store = TestBed.inject(AccentStore);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => vi.useRealTimers());

  it('should regenerate the palette when the accent changes', () => {
    createStore();
    const before = store.result().variants.dark.palette.background;
    store.setAccent(parseColor('#ff8800')!);
    expect(store.result().variants.dark.palette.background).not.toEqual(before);
  });

  it('should set and drop per-ramp adjustments', () => {
    createStore();
    store.setRamp('red', { lightness: 0, chroma: 0, hue: 10 });
    expect(store.ramps().red).toEqual({ lightness: 0, chroma: 0, hue: 10 });
    store.setRamp('red', { lightness: 0, chroma: 0, hue: 0 });
    expect('red' in store.ramps()).toBe(false);
  });

  it('should restore saved params on startup', () => {
    const saved = { ...DEFAULT_ACCENT_PARAMS, global: { lightness: 0.1, chroma: 0, hue: 0 } };
    saveAccentParams(saved);
    createStore();
    expect(store.global()).toEqual(saved.global);
  });

  it('should start from the defaults when storage holds garbage', () => {
    localStorage.setItem(ACCENT_STORAGE_KEY, 'garbage');
    createStore();
    expect(store.accent()).toEqual(DEFAULT_ACCENT_PARAMS.accent);
  });

  it('should save changes once the edits settle', () => {
    vi.useFakeTimers();
    createStore();
    store.setNeutral({ lightness: 0.05 });
    TestBed.tick();
    store.setNeutral({ lightness: 0.08 });
    TestBed.tick();
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS - 1);
    expect(loadAccentParams()).toBeNull();
    vi.advanceTimersByTime(1);
    expect(loadAccentParams()?.neutral.lightness).toBe(0.08);
  });

  it('should flush a pending save when destroyed', () => {
    vi.useFakeTimers();
    createStore();
    store.setNeutral({ lightness: 0.05 });
    TestBed.tick();
    TestBed.resetTestingModule();
    expect(loadAccentParams()?.neutral.lightness).toBe(0.05);
  });
});
