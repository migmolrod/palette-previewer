import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject } from '@angular/core';
import {
  getState,
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { PaletteSession } from '../../library/palette-session';
import { isNoAdjustment, type Adjustment } from '../../palette/adjust';
import type { Oklch } from '../../palette/color';
import { loadAccentParams, saveAccentParams } from './accent-storage';
import {
  DEFAULT_ACCENT_PARAMS,
  generateFromAccent,
  type AccentParams,
  type ChromaticRamp,
  type TintSettings,
} from './generate-from-accent';

/** Quiet time after the last edit before the params are written to storage. */
export const SAVE_DEBOUNCE_MS = 300;

/**
 * Accent tool state: only the parameters; every color is derived from them.
 * The params are restored from localStorage on startup and saved back (debounced) on change.
 */
export const AccentStore = signalStore(
  withState<AccentParams>(DEFAULT_ACCENT_PARAMS),
  withComputed((store) => ({
    result: computed(() =>
      generateFromAccent({
        accent: store.accent(),
        global: store.global(),
        neutral: store.neutral(),
        ramps: store.ramps(),
        tint: store.tint(),
      }),
    ),
  })),
  withMethods((store) => ({
    setAccent(accent: Oklch): void {
      patchState(store, { accent });
    },
    setGlobal(global: Partial<Adjustment>): void {
      patchState(store, (state) => ({ global: { ...state.global, ...global } }));
    },
    setNeutral(neutral: Partial<Adjustment>): void {
      patchState(store, (state) => ({ neutral: { ...state.neutral, ...neutral } }));
    },
    /** Replaces one ramp's fine-tuning; an all-zero adjustment removes it. */
    setRamp(name: ChromaticRamp, adjustment: Adjustment): void {
      patchState(store, (state) => {
        const { [name]: _previous, ...ramps } = state.ramps;
        return { ramps: isNoAdjustment(adjustment) ? ramps : { ...ramps, [name]: adjustment } };
      });
    },
    setTint(tint: Partial<TintSettings>): void {
      patchState(store, (state) => ({ tint: { ...state.tint, ...tint } }));
    },
    /** Replaces every param, e.g. with a palette opened from the library. */
    load(params: AccentParams): void {
      patchState(store, params);
    },
    reset(): void {
      patchState(store, DEFAULT_ACCENT_PARAMS);
    },
  })),
  withHooks((store) => {
    const window = inject(DOCUMENT).defaultView;
    let pending: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      clearTimeout(pending);
      pending = undefined;
      saveAccentParams(getState(store));
    };
    /** Writes an edit still waiting for its debounce, so leaving or reloading never drops it. */
    const flush = () => {
      if (pending !== undefined) save();
    };
    return {
      onInit(): void {
        const saved = loadAccentParams();
        if (saved) patchState(store, saved);
        effect(() => {
          getState(store);
          clearTimeout(pending);
          pending = setTimeout(save, SAVE_DEBOUNCE_MS);
        });
        window?.addEventListener('pagehide', flush);
      },
      onDestroy(): void {
        window?.removeEventListener('pagehide', flush);
        flush();
      },
    };
  }),
);

/** Makes `store` the palette library's editor for as long as the calling component lives. */
export function registerAccentEditor(store: InstanceType<typeof AccentStore>): void {
  const unregister = inject(PaletteSession).register({
    params: computed(() => getState(store)),
    load: (params) => store.load(params),
  });
  inject(DestroyRef).onDestroy(unregister);
}
