import { computed } from '@angular/core';
import {
  getState,
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import type { Adjustment } from '../../palette/adjust';
import { parseColor, toHex } from '../../palette/color';
import type { SlotId } from '../../palette/terminal-palette';
import {
  DEFAULT_ACCENT_PARAMS,
  generateFromAccent,
  type AccentParams,
  type SlotOverride,
  type TintSettings,
} from './generate-from-accent';

/** Accent tool state: only the parameters; every color is derived from them. */
export const AccentStore = signalStore(
  withState<AccentParams>(DEFAULT_ACCENT_PARAMS),
  withComputed((store) => ({
    accentHex: computed(() => toHex(store.accent())),
    result: computed(() =>
      generateFromAccent({
        accent: store.accent(),
        global: store.global(),
        neutral: store.neutral(),
        slots: store.slots(),
        tint: store.tint(),
      }),
    ),
  })),
  withMethods((store) => ({
    /** Ignores input that is not a valid CSS color; returns whether it was applied. */
    setAccent(input: string): boolean {
      const accent = parseColor(input);
      if (accent) {
        patchState(store, { accent });
      }
      return accent !== undefined;
    },
    setGlobal(global: Partial<Adjustment>): void {
      patchState(store, (state) => ({ global: { ...state.global, ...global } }));
    },
    setNeutral(neutral: Partial<Adjustment>): void {
      patchState(store, (state) => ({ neutral: { ...state.neutral, ...neutral } }));
    },
    setSlot(id: SlotId, override: SlotOverride): void {
      patchState(store, (state) => ({
        slots: { ...state.slots, [id]: { ...state.slots[id], ...override } },
      }));
    },
    resetSlot(id: SlotId): void {
      patchState(store, (state) => {
        const { [id]: _removed, ...slots } = state.slots;
        return { slots };
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
