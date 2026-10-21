import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_ACCENT_PARAMS, type AccentParams } from '../../tools/accent/generate-from-accent';
import { Confirmation } from '../confirm-dialog/confirm-dialog';
import { PaletteLibrary } from '../palette-library';
import { PaletteSession } from '../palette-session';
import { PaletteBar } from './palette-bar';

const TEAL: AccentParams = {
  ...DEFAULT_ACCENT_PARAMS,
  accent: { mode: 'oklch', l: 0.7, c: 0.12, h: 182 },
};

describe('PaletteBar', () => {
  let fixture: ComponentFixture<PaletteBar>;
  let params: ReturnType<typeof signal<AccentParams>>;
  let session: PaletteSession;
  let confirm: ReturnType<typeof vi.spyOn>;

  function text(): string {
    return (fixture.nativeElement as HTMLElement).querySelector('.current')?.textContent ?? '';
  }

  function saveButton(): HTMLButtonElement {
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    return [...buttons].find((button) => button.textContent?.includes('Save'))!;
  }

  beforeEach(async () => {
    localStorage.clear();
    params = signal(DEFAULT_ACCENT_PARAMS);
    session = TestBed.inject(PaletteSession);
    session.register({ params, load: (value) => params.set(value) });
    fixture = TestBed.createComponent(PaletteBar);
    const confirmation = fixture.debugElement.injector.get(Confirmation);
    confirm = vi.spyOn(confirmation, 'confirm');
    await fixture.whenStable();
  });

  it('should show the temporary name and the unsaved marker', async () => {
    expect(text()).toContain('Untitled blue');
    expect(text()).not.toContain('unsaved changes');
    params.set(TEAL);
    await fixture.whenStable();
    expect(text()).toContain('Untitled teal');
    expect(text()).toContain('(unsaved changes)');
  });

  it('should save edits to the current palette in place', async () => {
    session.saveAs('Lagoon');
    params.set(TEAL);
    await fixture.whenStable();
    saveButton().click();
    await fixture.whenStable();
    expect(session.current()?.params).toEqual(TEAL);
    expect(text()).not.toContain('unsaved changes');
    expect(saveButton().disabled).toBe(true);
  });

  it('should ask before discarding unsaved changes', async () => {
    const lagoon = TestBed.inject(PaletteLibrary).create('Lagoon', DEFAULT_ACCENT_PARAMS);
    params.set(TEAL);
    await fixture.whenStable();

    open(lagoon.id);
    expect(confirm).toHaveBeenCalledOnce();
    expect(params()).toEqual(TEAL);

    confirm.mock.calls[0][0].accept();
    expect(session.name()).toBe('Lagoon');
    expect(params()).toEqual(DEFAULT_ACCENT_PARAMS);
  });

  it('should open right away when nothing would be lost', () => {
    const lagoon = TestBed.inject(PaletteLibrary).create('Lagoon', TEAL);
    open(lagoon.id);
    expect(confirm).not.toHaveBeenCalled();
    expect(params()).toEqual(TEAL);
  });

  /** What the library dialog's `opened` output triggers. */
  function open(id: string): void {
    (fixture.componentInstance as unknown as { open(id: string): void }).open(id);
  }
});
