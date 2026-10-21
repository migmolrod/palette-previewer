import { DEFAULT_ACCENT_PARAMS } from '../tools/accent/generate-from-accent';
import {
  isSnapshotCurrent,
  PALETTE_FILE_FORMAT,
  PALETTE_SCHEMA_VERSION,
  parsePaletteFile,
  parsePaletteRecord,
  snapshotOf,
  toPaletteFile,
  type PaletteRecord,
} from './palette-record';

const RECORD: PaletteRecord = {
  id: 'a1',
  name: 'Night owl',
  tool: 'accent',
  params: DEFAULT_ACCENT_PARAMS,
  snapshot: snapshotOf(DEFAULT_ACCENT_PARAMS),
  schemaVersion: PALETTE_SCHEMA_VERSION,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-02T10:00:00.000Z',
};

describe('palette record', () => {
  it('should round-trip through a palette file', () => {
    expect(parsePaletteFile(toPaletteFile([RECORD]))).toEqual({ palettes: [RECORD], skipped: [] });
  });

  it('should reject records of another schema version', () => {
    for (const schemaVersion of [undefined, 0, PALETTE_SCHEMA_VERSION + 1, '1']) {
      expect(parsePaletteRecord({ ...RECORD, schemaVersion })).toBeNull();
    }
  });

  it('should reject malformed records', () => {
    expect(parsePaletteRecord({ ...RECORD, name: '  ' })).toBeNull();
    expect(parsePaletteRecord({ ...RECORD, tool: 'image' })).toBeNull();
    expect(parsePaletteRecord({ ...RECORD, createdAt: 'yesterday' })).toBeNull();
    expect(parsePaletteRecord({ ...RECORD, params: { accent: 'blue' } })).toBeNull();
    expect(parsePaletteRecord({ ...RECORD, snapshot: { dark: '' } })).toBeNull();
  });

  it('should drop unknown fields', () => {
    expect(parsePaletteRecord({ ...RECORD, extra: true })).toEqual(RECORD);
  });

  it('should keep the raw entries it cannot read', () => {
    const newer = { ...RECORD, id: 'b2', schemaVersion: PALETTE_SCHEMA_VERSION + 1 };
    const file = JSON.stringify({ format: PALETTE_FILE_FORMAT, palettes: [RECORD, newer] });
    expect(parsePaletteFile(file)).toEqual({ palettes: [RECORD], skipped: [newer] });
  });

  it('should refuse anything that is not a palette file', () => {
    expect(parsePaletteFile('not json')).toBeNull();
    expect(parsePaletteFile(JSON.stringify({ palettes: [RECORD] }))).toBeNull();
    expect(parsePaletteFile(JSON.stringify({ format: PALETTE_FILE_FORMAT }))).toBeNull();
  });

  it('should snapshot the env files of both modes', () => {
    const snapshot = snapshotOf(DEFAULT_ACCENT_PARAMS);
    expect(snapshot.dark).toContain('PAL_BACKGROUND=');
    expect(snapshot.light).toContain('PAL_BACKGROUND=');
    expect(snapshot.dark).not.toEqual(snapshot.light);
  });

  it('should notice when the generator output no longer matches the snapshot', () => {
    expect(isSnapshotCurrent(RECORD)).toBe(true);
    expect(isSnapshotCurrent({ ...RECORD, snapshot: { ...RECORD.snapshot, dark: 'old' } })).toBe(
      false,
    );
  });
});
