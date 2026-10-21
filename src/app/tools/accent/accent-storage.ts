import type { Adjustment } from '../../palette/adjust';
import type { Oklch } from '../../palette/color';
import {
  CHROMATIC_RAMPS,
  type AccentParams,
  type ChromaticRamp,
  type TintSettings,
} from './generate-from-accent';

export const ACCENT_STORAGE_KEY = 'palette-previewer.accent';

/** Bump when {@link AccentParams} changes shape; older payloads are then discarded. */
export const ACCENT_SCHEMA_VERSION = 1;

interface StoredAccentParams {
  readonly schemaVersion: number;
  readonly params: AccentParams;
}

/** Restores the saved params; `null` when absent, unreadable, outdated or malformed. */
export function loadAccentParams(): AccentParams | null {
  try {
    const raw = localStorage.getItem(ACCENT_STORAGE_KEY);
    return raw === null ? null : parseStoredParams(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Saves the params; failures (private mode, quota, blocked storage) are ignored. */
export function saveAccentParams(params: AccentParams): void {
  const stored: StoredAccentParams = { schemaVersion: ACCENT_SCHEMA_VERSION, params };
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Nothing to do: the palette keeps working, it just won't survive a reload.
  }
}

/** Validates an untrusted payload and rebuilds it field by field, dropping anything unknown. */
function parseStoredParams(value: unknown): AccentParams | null {
  if (!isRecord(value) || value['schemaVersion'] !== ACCENT_SCHEMA_VERSION) return null;
  const params = value['params'];
  if (!isRecord(params)) return null;

  const accent = parseOklch(params['accent']);
  const global = parseAdjustment(params['global']);
  const neutral = parseAdjustment(params['neutral']);
  const ramps = parseRamps(params['ramps']);
  const tint = parseTint(params['tint']);
  if (!accent || !global || !neutral || !ramps || !tint) return null;
  return { accent, global, neutral, ramps, tint };
}

function parseOklch(value: unknown): Oklch | null {
  if (!isRecord(value) || value['mode'] !== 'oklch') return null;
  const { l, c, h } = value;
  if (!isFiniteNumber(l) || !isFiniteNumber(c)) return null;
  if (h === undefined) return { mode: 'oklch', l, c };
  return isFiniteNumber(h) ? { mode: 'oklch', l, c, h } : null;
}

function parseAdjustment(value: unknown): Adjustment | null {
  if (!isRecord(value)) return null;
  const { lightness, chroma, hue } = value;
  return isFiniteNumber(lightness) && isFiniteNumber(chroma) && isFiniteNumber(hue)
    ? { lightness, chroma, hue }
    : null;
}

function parseRamps(value: unknown): AccentParams['ramps'] | null {
  if (!isRecord(value)) return null;
  const ramps: Partial<Record<ChromaticRamp, Adjustment>> = {};
  for (const [name, raw] of Object.entries(value)) {
    const adjustment = parseAdjustment(raw);
    if (!isChromaticRamp(name) || !adjustment) return null;
    ramps[name] = adjustment;
  }
  return ramps;
}

function parseTint(value: unknown): TintSettings | null {
  if (!isRecord(value)) return null;
  const { amount, neutralAmount } = value;
  const color = value['color'] === null ? null : parseOklch(value['color']);
  if (color === null && value['color'] !== null) return null;
  return isFiniteNumber(amount) && isFiniteNumber(neutralAmount)
    ? { color, amount, neutralAmount }
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isChromaticRamp(name: string): name is ChromaticRamp {
  return (CHROMATIC_RAMPS as readonly string[]).includes(name);
}
