import {
  ACCENT_SCHEMA_VERSION,
  ACCENT_STORAGE_KEY,
  loadAccentParams,
  saveAccentParams,
} from './accent-storage';
import { DEFAULT_ACCENT_PARAMS, type AccentParams } from './generate-from-accent';

const PARAMS: AccentParams = {
  accent: { mode: 'oklch', l: 0.7, c: 0.12, h: 30 },
  global: { lightness: 0.05, chroma: -0.02, hue: 4 },
  neutral: { lightness: -0.03, chroma: 0, hue: 0 },
  ramps: { red: { lightness: 0, chroma: 0.01, hue: -8 } },
  tint: { color: { mode: 'oklch', l: 0.5, c: 0.1, h: 200 }, amount: 0.2, neutralAmount: 0.1 },
};

function store(value: unknown): void {
  localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify(value));
}

describe('accent storage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('should restore exactly what was saved', () => {
    saveAccentParams(PARAMS);
    expect(loadAccentParams()).toEqual(PARAMS);
    saveAccentParams(DEFAULT_ACCENT_PARAMS);
    expect(loadAccentParams()).toEqual(DEFAULT_ACCENT_PARAMS);
  });

  it('should tag the payload with the schema version', () => {
    saveAccentParams(PARAMS);
    const raw = JSON.parse(localStorage.getItem(ACCENT_STORAGE_KEY)!);
    expect(raw.schemaVersion).toBe(ACCENT_SCHEMA_VERSION);
  });

  it('should return null when nothing was saved', () => {
    expect(loadAccentParams()).toBeNull();
  });

  it('should return null for unparseable data', () => {
    localStorage.setItem(ACCENT_STORAGE_KEY, '{not json');
    expect(loadAccentParams()).toBeNull();
  });

  it('should return null when the schema version is missing or unknown', () => {
    store({ params: PARAMS });
    expect(loadAccentParams()).toBeNull();
    store({ schemaVersion: ACCENT_SCHEMA_VERSION + 1, params: PARAMS });
    expect(loadAccentParams()).toBeNull();
  });

  it('should return null for malformed params', () => {
    const malformed: unknown[] = [
      null,
      [],
      { ...PARAMS, accent: { mode: 'rgb', r: 1, g: 0, b: 0 } },
      { ...PARAMS, global: { lightness: '0.1', chroma: 0, hue: 0 } },
      { ...PARAMS, neutral: undefined },
      { ...PARAMS, ramps: { purple: { lightness: 0, chroma: 0, hue: 0 } } },
      { ...PARAMS, ramps: { red: null } },
      { ...PARAMS, tint: { ...PARAMS.tint, color: 'red' } },
      { ...PARAMS, tint: { ...PARAMS.tint, amount: null } },
    ];
    for (const params of malformed) {
      store({ schemaVersion: ACCENT_SCHEMA_VERSION, params });
      expect(loadAccentParams(), JSON.stringify(params)).toBeNull();
    }
  });

  it('should drop unknown fields', () => {
    store({
      schemaVersion: ACCENT_SCHEMA_VERSION,
      params: { ...PARAMS, extra: true, accent: { ...PARAMS.accent, junk: 1 } },
    });
    expect(loadAccentParams()).toEqual(PARAMS);
  });

  it('should survive storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(() => saveAccentParams(PARAMS)).not.toThrow();
    expect(loadAccentParams()).toBeNull();
  });
});
