import type { Oklch } from './color';

export type AnsiIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

/** Slot names as most terminal configs spell them (kitty, alacritty, foot…). */
export type SlotId = 'background' | 'foreground' | `color${AnsiIndex}`;

export const ANSI_NAMES = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'bright black',
  'bright red',
  'bright green',
  'bright yellow',
  'bright blue',
  'bright magenta',
  'bright cyan',
  'bright white',
] as const;

export type TerminalPalette = Readonly<Record<SlotId, Oklch>>;

export const ANSI_SLOTS = ANSI_NAMES.map((_, index) => `color${index}` as `color${AnsiIndex}`);
