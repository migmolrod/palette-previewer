import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DEFAULT_ACCENT_PARAMS, type AccentParams } from '../tools/accent/generate-from-accent';
import { PaletteLibrary } from './palette-library';
import { PaletteSession } from './palette-session';

const TEAL: AccentParams = {
  ...DEFAULT_ACCENT_PARAMS,
  accent: { mode: 'oklch', l: 0.7, c: 0.12, h: 182 },
};

describe('PaletteSession', () => {
  let params: ReturnType<typeof signal<AccentParams>>;
  let session: PaletteSession;
  let library: PaletteLibrary;

  function createSession(): void {
    TestBed.resetTestingModule();
    session = TestBed.inject(PaletteSession);
    library = TestBed.inject(PaletteLibrary);
    session.register({ params, load: (value) => params.set(value) });
  }

  beforeEach(() => {
    localStorage.clear();
    params = signal(DEFAULT_ACCENT_PARAMS);
    createSession();
  });

  it('should name unsaved work after its accent hue', () => {
    expect(session.name()).toBe('Untitled blue');
    params.set(TEAL);
    expect(session.name()).toBe('Untitled teal');
  });

  it('should treat edits to the defaults as unsaved changes', () => {
    expect(session.dirty()).toBe(false);
    params.set(TEAL);
    expect(session.dirty()).toBe(true);
  });

  it('should save as a new current palette, then save edits into it', () => {
    params.set(TEAL);
    expect(session.save()).toBe(false);
    session.saveAs('Lagoon');
    expect(session.name()).toBe('Lagoon');
    expect(session.dirty()).toBe(false);

    params.set({ ...TEAL, neutral: { lightness: 0.02, chroma: 0, hue: 0 } });
    expect(session.dirty()).toBe(true);
    expect(session.save()).toBe(true);
    expect(session.dirty()).toBe(false);
    expect(library.palettes()).toHaveLength(1);
  });

  it('should not count dropped undefined keys as changes', () => {
    params.set({ ...TEAL, accent: { ...TEAL.accent } });
    session.saveAs('Lagoon');
    params.set({
      ...TEAL,
      tint: { ...TEAL.tint },
      accent: { mode: 'oklch', l: 0.7, c: 0.12, h: 182 },
    });
    expect(session.dirty()).toBe(false);
  });

  it('should open a saved palette into the editor', () => {
    const { id } = library.create('Lagoon', TEAL);
    session.open(id);
    expect(params()).toEqual(TEAL);
    expect(session.current()?.id).toBe(id);
    expect(session.dirty()).toBe(false);
  });

  it('should rename the current palette', () => {
    session.saveAs('Lagoon');
    session.renameCurrent('Reef');
    expect(session.name()).toBe('Reef');
  });

  it('should start new unsaved work from the defaults', () => {
    params.set(TEAL);
    session.saveAs('Lagoon');
    session.startNew();
    expect(params()).toEqual(DEFAULT_ACCENT_PARAMS);
    expect(session.current()).toBeNull();
  });

  it('should keep the params as unsaved work when the current palette is deleted', () => {
    params.set(TEAL);
    session.saveAs('Lagoon');
    session.delete(session.current()!.id);
    expect(session.current()).toBeNull();
    expect(session.name()).toBe('Untitled teal');
    expect(params()).toEqual(TEAL);
  });

  it('should remember the current palette across reloads', () => {
    params.set(TEAL);
    session.saveAs('Lagoon');
    createSession();
    expect(session.name()).toBe('Lagoon');
    expect(session.dirty()).toBe(false);
  });

  it('should forget an editor once it unregisters', () => {
    const unregister = session.register({ params, load: () => undefined });
    unregister();
    expect(session.editor()).toBeNull();
    expect(session.dirty()).toBe(false);
  });
});
