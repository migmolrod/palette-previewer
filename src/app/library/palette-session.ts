import { computed, inject, Service, signal, type Signal } from '@angular/core';
import { colorName } from '../palette/color-name';
import { jsonEqual } from '../storage/json';
import { DEFAULT_ACCENT_PARAMS, type AccentParams } from '../tools/accent/generate-from-accent';
import { PaletteLibrary } from './palette-library';
import type { PaletteRecord } from './palette-record';

export const CURRENT_PALETTE_STORAGE_KEY = 'palette-previewer.current';

/** The tool currently editing a palette, as seen by the library. */
export interface PaletteEditor {
  readonly params: Signal<AccentParams>;
  load(params: AccentParams): void;
}

/**
 * Links the open tool to the library: which saved palette it is editing (if any), under what
 * name, and whether it has unsaved changes. The current palette survives reloads alongside the
 * tool's auto-saved draft.
 */
@Service()
export class PaletteSession {
  private readonly library = inject(PaletteLibrary);

  private readonly activeEditor = signal<PaletteEditor | null>(null);
  readonly editor = this.activeEditor.asReadonly();

  private readonly currentId = signal(loadCurrentId());
  /** Saved palette being edited; `null` for unsaved work, or once its palette is deleted. */
  readonly current = computed<PaletteRecord | null>(() => {
    const id = this.currentId();
    return id === null ? null : (this.library.get(id) ?? null);
  });

  /** Temporary name of unsaved work, after its accent hue. */
  readonly untitledName = computed(() => {
    const params = this.activeEditor()?.params();
    return params ? `Untitled ${colorName(params.accent)}` : 'Untitled';
  });

  readonly name = computed(() => this.current()?.name ?? this.untitledName());

  /** Edits not in the library: changes to a saved palette, or unsaved work besides the defaults. */
  readonly dirty = computed(() => {
    const params = this.activeEditor()?.params();
    if (!params) return false;
    return !jsonEqual(params, this.current()?.params ?? DEFAULT_ACCENT_PARAMS);
  });

  /** Makes the editor the active one until the returned function is called. */
  register(editor: PaletteEditor): () => void {
    this.activeEditor.set(editor);
    return () => {
      if (this.activeEditor() === editor) this.activeEditor.set(null);
    };
  }

  /** Writes the edits to the current palette; `false` when there is none (use {@link saveAs}). */
  save(): boolean {
    const editor = this.activeEditor();
    const current = this.current();
    if (!editor || !current) return false;
    this.library.update(current.id, editor.params());
    return true;
  }

  /** Saves the edits as a new palette, which becomes the current one. */
  saveAs(name: string): void {
    const editor = this.activeEditor();
    if (!editor) return;
    this.setCurrent(this.library.create(name, editor.params()).id);
  }

  renameCurrent(name: string): void {
    const current = this.current();
    if (current) this.library.rename(current.id, name);
  }

  /** Opens a saved palette in the editor, replacing its params. */
  open(id: string): void {
    const editor = this.activeEditor();
    const record = this.library.get(id);
    if (!editor || !record) return;
    editor.load(record.params);
    this.setCurrent(id);
  }

  /** Starts unsaved work from the defaults. */
  startNew(): void {
    this.activeEditor()?.load(DEFAULT_ACCENT_PARAMS);
    this.setCurrent(null);
  }

  /** Deletes a palette; if it was the current one, its params stay in the editor as unsaved work. */
  delete(id: string): void {
    this.library.delete(id);
    if (this.currentId() === id) this.setCurrent(null);
  }

  private setCurrent(id: string | null): void {
    this.currentId.set(id);
    try {
      if (id === null) localStorage.removeItem(CURRENT_PALETTE_STORAGE_KEY);
      else localStorage.setItem(CURRENT_PALETTE_STORAGE_KEY, id);
    } catch {
      // Only the link to the saved palette is lost on reload; the draft itself is kept.
    }
  }
}

function loadCurrentId(): string | null {
  try {
    return localStorage.getItem(CURRENT_PALETTE_STORAGE_KEY);
  } catch {
    return null;
  }
}
