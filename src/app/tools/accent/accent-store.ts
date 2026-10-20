import { computed } from '@angular/core';
import {
  getState,
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { isNoAdjustment, type Adjustment } from '../../palette/adjust';
import type { Oklch } from '../../palette/color';
import {
  DEFAULT_ACCENT_PARAMS,
  generateFromAccent,
  type AccentParams,
  type ChromaticRamp,
  type TintSettings,
} from './generate-from-accent';

/** Accent tool state: only the parameters; every color is derived from them. */
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
    reset(): void {
      patchState(store, DEFAULT_ACCENT_PARAMS);
    },
  })),
);
