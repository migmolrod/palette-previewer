/** Every palette comes in both modes, picked from the same ramps with different stops. */
export const MODES = ['dark', 'light'] as const;

export type Mode = (typeof MODES)[number];

/** Builds one value per mode. */
export function forEachMode<T>(fn: (mode: Mode) => T): Readonly<Record<Mode, T>> {
  return Object.fromEntries(MODES.map((mode) => [mode, fn(mode)])) as Record<Mode, T>;
}
