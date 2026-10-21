import { computed, inject, Service, signal } from '@angular/core';
import type { AccentParams } from '../tools/accent/generate-from-accent';
import { CLOCK, ID_GENERATOR } from './clock';
import {
  PALETTE_SCHEMA_VERSION,
  parsePaletteFile,
  snapshotOf,
  toPaletteFile,
  type PaletteRecord,
  type ParsedPaletteFile,
} from './palette-record';

export const LIBRARY_STORAGE_KEY = 'palette-previewer.library';

export interface ImportResult {
  readonly added: number;
  /** Already present, replaced by a newer copy. */
  readonly updated: number;
  /** Already present and not older than the imported copy. */
  readonly unchanged: number;
  /** Malformed or of an unsupported schema version. */
  readonly skipped: number;
}

/**
 * Named palettes kept in localStorage. localStorage is per origin, so libraries move between
 * origins (and get backed up) through {@link exportFile} and {@link importFile}.
 */
@Service()
export class PaletteLibrary {
  private readonly now = inject(CLOCK);
  private readonly newId = inject(ID_GENERATOR);

  private readonly stored = loadLibrary();
  private readonly records = signal(this.stored.palettes);
  /**
   * Stored entries this version cannot read (e.g. saved by a newer one), written back untouched
   * so that saving never destroys them.
   */
  private readonly unreadable = this.stored.skipped;

  /** Saved palettes sorted by name. */
  readonly palettes = computed(() =>
    [...this.records()].sort((a, b) => a.name.localeCompare(b.name)),
  );

  get(id: string): PaletteRecord | undefined {
    return this.records().find((record) => record.id === id);
  }

  /** Saves the params as a new palette. */
  create(name: string, params: AccentParams): PaletteRecord {
    const now = this.now();
    const record: PaletteRecord = {
      id: this.newId(),
      name: name.trim(),
      tool: 'accent',
      params,
      snapshot: snapshotOf(params),
      schemaVersion: PALETTE_SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
    };
    this.commit([...this.records(), record]);
    return record;
  }

  /** Overwrites a palette's params; ignored when the id is unknown. */
  update(id: string, params: AccentParams): void {
    this.patch(id, { params, snapshot: snapshotOf(params) });
  }

  rename(id: string, name: string): void {
    this.patch(id, { name: name.trim() });
  }

  delete(id: string): void {
    this.commit(this.records().filter((record) => record.id !== id));
  }

  /** JSON file holding the given palettes, or the whole library. */
  exportFile(ids?: readonly string[]): string {
    const records = this.palettes();
    return toPaletteFile(ids ? records.filter((record) => ids.includes(record.id)) : records);
  }

  /**
   * Merges a palette file into the library, matching palettes by id: a known palette is replaced
   * only by a more recently updated copy, so re-importing an old backup never loses work.
   * `null` when the text is not a palette file.
   */
  importFile(text: string): ImportResult | null {
    const file = parsePaletteFile(text);
    if (!file) return null;
    const records = new Map(this.records().map((record) => [record.id, record]));
    let added = 0;
    let updated = 0;
    let unchanged = 0;
    for (const record of file.palettes) {
      const existing = records.get(record.id);
      if (!existing) added++;
      else if (Date.parse(record.updatedAt) > Date.parse(existing.updatedAt)) updated++;
      else {
        unchanged++;
        continue;
      }
      records.set(record.id, record);
    }
    this.commit([...records.values()]);
    return { added, updated, unchanged, skipped: file.skipped.length };
  }

  private patch(id: string, changes: Partial<Pick<PaletteRecord, 'name' | 'params' | 'snapshot'>>) {
    const updatedAt = this.now();
    this.commit(
      this.records().map((record) =>
        record.id === id ? { ...record, ...changes, updatedAt } : record,
      ),
    );
  }

  private commit(records: readonly PaletteRecord[]): void {
    this.records.set(records);
    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, toPaletteFile([...records, ...this.unreadable]));
    } catch {
      // The library keeps working for this session; exporting a file is the way to keep it.
    }
  }
}

function loadLibrary(): ParsedPaletteFile {
  const empty: ParsedPaletteFile = { palettes: [], skipped: [] };
  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
    return (raw === null ? null : parsePaletteFile(raw)) ?? empty;
  } catch {
    return empty;
  }
}
