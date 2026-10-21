import { TestBed } from '@angular/core/testing';
import { DEFAULT_ACCENT_PARAMS, type AccentParams } from '../tools/accent/generate-from-accent';
import { CLOCK, ID_GENERATOR } from './clock';
import { LIBRARY_STORAGE_KEY, PaletteLibrary } from './palette-library';
import {
  PALETTE_FILE_FORMAT,
  PALETTE_SCHEMA_VERSION,
  parsePaletteFile,
  snapshotOf,
} from './palette-record';

const WARM: AccentParams = {
  ...DEFAULT_ACCENT_PARAMS,
  accent: { mode: 'oklch', l: 0.7, c: 0.15, h: 40 },
};

describe('PaletteLibrary', () => {
  let time: string;
  let ids: number;

  function createLibrary(): PaletteLibrary {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: () => time },
        { provide: ID_GENERATOR, useValue: () => `id-${++ids}` },
      ],
    });
    return TestBed.inject(PaletteLibrary);
  }

  beforeEach(() => {
    localStorage.clear();
    time = '2026-10-01T10:00:00.000Z';
    ids = 0;
  });

  it('should save a new palette with a snapshot of its output', () => {
    const library = createLibrary();
    const record = library.create('  Ember  ', WARM);
    expect(record).toEqual({
      id: 'id-1',
      name: 'Ember',
      tool: 'accent',
      params: WARM,
      snapshot: snapshotOf(WARM),
      schemaVersion: PALETTE_SCHEMA_VERSION,
      createdAt: time,
      updatedAt: time,
    });
    expect(library.palettes()).toEqual([record]);
  });

  it('should list palettes by name', () => {
    const library = createLibrary();
    library.create('beta', WARM);
    library.create('Alpha', WARM);
    expect(library.palettes().map((record) => record.name)).toEqual(['Alpha', 'beta']);
  });

  it('should update, rename and delete palettes', () => {
    const library = createLibrary();
    const { id } = library.create('Ember', DEFAULT_ACCENT_PARAMS);
    time = '2026-10-02T10:00:00.000Z';
    library.update(id, WARM);
    library.rename(id, 'Coal');
    expect(library.get(id)).toMatchObject({
      name: 'Coal',
      params: WARM,
      snapshot: snapshotOf(WARM),
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: time,
    });
    library.delete(id);
    expect(library.palettes()).toEqual([]);
  });

  it('should persist the library across instances', () => {
    const record = createLibrary().create('Ember', WARM);
    expect(createLibrary().palettes()).toEqual([record]);
  });

  it('should start empty when storage holds garbage', () => {
    localStorage.setItem(LIBRARY_STORAGE_KEY, 'garbage');
    expect(createLibrary().palettes()).toEqual([]);
  });

  it('should keep stored entries it cannot read when saving', () => {
    const newer = { id: 'future', schemaVersion: PALETTE_SCHEMA_VERSION + 1 };
    localStorage.setItem(
      LIBRARY_STORAGE_KEY,
      JSON.stringify({ format: PALETTE_FILE_FORMAT, palettes: [newer] }),
    );
    createLibrary().create('Ember', WARM);
    const stored = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY)!);
    expect(stored.palettes).toContainEqual(newer);
  });

  it('should export one palette or the whole library', () => {
    const library = createLibrary();
    const ember = library.create('Ember', WARM);
    const ocean = library.create('Ocean', DEFAULT_ACCENT_PARAMS);
    expect(parsePaletteFile(library.exportFile([ember.id]))?.palettes).toEqual([ember]);
    expect(parsePaletteFile(library.exportFile())?.palettes).toEqual([ember, ocean]);
  });

  it('should import into another library, keeping the newest copy of each palette', () => {
    const source = createLibrary();
    const ember = source.create('Ember', WARM);
    const ocean = source.create('Ocean', DEFAULT_ACCENT_PARAMS);
    time = '2026-10-03T10:00:00.000Z';
    source.rename(ocean.id, 'Deep ocean');
    const file = source.exportFile();

    localStorage.clear();
    const target = createLibrary();
    expect(target.importFile(file)).toEqual({ added: 2, updated: 0, unchanged: 0, skipped: 0 });
    expect(target.importFile(file)).toEqual({ added: 0, updated: 0, unchanged: 2, skipped: 0 });

    time = '2026-10-04T10:00:00.000Z';
    target.rename(ember.id, 'Local ember');
    const older = JSON.stringify({
      format: PALETTE_FILE_FORMAT,
      palettes: [ember, { ...ocean, name: 'Older ocean', updatedAt: '2026-10-05T00:00:00.000Z' }],
    });
    expect(target.importFile(older)).toEqual({ added: 0, updated: 1, unchanged: 1, skipped: 0 });
    expect(target.get(ember.id)?.name).toBe('Local ember');
    expect(target.get(ocean.id)?.name).toBe('Older ocean');
  });

  it('should count unreadable entries and refuse non-palette files on import', () => {
    const library = createLibrary();
    const file = JSON.stringify({ format: PALETTE_FILE_FORMAT, palettes: [{ id: 'x' }] });
    expect(library.importFile(file)).toEqual({ added: 0, updated: 0, unchanged: 0, skipped: 1 });
    expect(library.importFile('{}')).toBeNull();
  });
});
