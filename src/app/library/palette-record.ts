import { buildEnvFile } from '../palette/env-file';
import { forEachMode, MODES, type Mode } from '../palette/mode';
import { isRecord } from '../storage/json';
import { parseAccentParams } from '../tools/accent/accent-storage';
import { generateFromAccent, type AccentParams } from '../tools/accent/generate-from-accent';

/**
 * Version of {@link PaletteRecord}, params included. Records of any other version are rejected:
 * when the shape changes, bump it and upgrade older records here instead of dropping them, since
 * a library (unlike the draft) is the user's only copy.
 */
export const PALETTE_SCHEMA_VERSION = 1;

/** Generator that produced the params; only one exists so far. */
export type PaletteTool = 'accent';

/**
 * The env files exported at save time, one per mode. Generator changes alter what the same params
 * produce; the snapshot keeps the exact output a rice was built from.
 */
export type PaletteSnapshot = Readonly<Record<Mode, string>>;

export interface PaletteRecord {
  readonly id: string;
  readonly name: string;
  readonly tool: PaletteTool;
  readonly params: AccentParams;
  readonly snapshot: PaletteSnapshot;
  readonly schemaVersion: number;
  /** ISO 8601 timestamps. */
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Tag identifying palette files, both in storage and in exported JSON. */
export const PALETTE_FILE_FORMAT = 'palette-previewer/palettes';

export interface ParsedPaletteFile {
  readonly palettes: readonly PaletteRecord[];
  /** Raw entries left out as malformed or of an unsupported schema version. */
  readonly skipped: readonly unknown[];
}

export function snapshotOf(params: AccentParams): PaletteSnapshot {
  const { variants } = generateFromAccent(params);
  return forEachMode((mode) => buildEnvFile(variants[mode].tokens, variants[mode].palette, mode));
}

/** Whether the generator still turns the record's params into its saved output. */
export function isSnapshotCurrent(record: PaletteRecord): boolean {
  const current = snapshotOf(record.params);
  return MODES.every((mode) => current[mode] === record.snapshot[mode]);
}

/** Serializes palettes into a file {@link parsePaletteFile} reads back. */
export function toPaletteFile(palettes: readonly unknown[]): string {
  return JSON.stringify({ format: PALETTE_FILE_FORMAT, palettes }, null, 2);
}

/** Reads a palette file; `null` when it is not one at all, otherwise its valid entries. */
export function parsePaletteFile(text: string): ParsedPaletteFile | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(value) || value['format'] !== PALETTE_FILE_FORMAT) return null;
  const entries = value['palettes'];
  if (!Array.isArray(entries)) return null;
  const palettes: PaletteRecord[] = [];
  const skipped: unknown[] = [];
  for (const entry of entries) {
    const record = parsePaletteRecord(entry);
    if (record) palettes.push(record);
    else skipped.push(entry);
  }
  return { palettes, skipped };
}

/** Validates an untrusted record and rebuilds it field by field, dropping anything unknown. */
export function parsePaletteRecord(value: unknown): PaletteRecord | null {
  if (!isRecord(value) || value['schemaVersion'] !== PALETTE_SCHEMA_VERSION) return null;
  const { id, name, tool, createdAt, updatedAt } = value;
  const params = parseAccentParams(value['params']);
  const snapshot = parseSnapshot(value['snapshot']);
  if (!isNonEmptyString(id) || !isNonEmptyString(name) || tool !== 'accent') return null;
  if (!isTimestamp(createdAt) || !isTimestamp(updatedAt) || !params || !snapshot) return null;
  return {
    id,
    name,
    tool,
    params,
    snapshot,
    schemaVersion: PALETTE_SCHEMA_VERSION,
    createdAt,
    updatedAt,
  };
}

function parseSnapshot(value: unknown): PaletteSnapshot | null {
  if (!isRecord(value)) return null;
  const { dark, light } = value;
  return typeof dark === 'string' && typeof light === 'string' ? { dark, light } : null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}
