import { InjectionToken } from '@angular/core';

/** Current time as an ISO 8601 string; replaced in tests for stable timestamps. */
export const CLOCK = new InjectionToken<() => string>('CLOCK', {
  factory: () => () => new Date().toISOString(),
});

/** New unique palette id; replaced in tests for predictable ids. */
export const ID_GENERATOR = new InjectionToken<() => string>('ID_GENERATOR', {
  factory: () => () => crypto.randomUUID(),
});
