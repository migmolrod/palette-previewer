import { adjust, NO_ADJUSTMENT, tint, type Adjustment } from '../../palette/adjust';
import { mapToSrgb, type Oklch } from '../../palette/color';
import { forEachMode, type Mode } from '../../palette/mode';
import { buildRamp, mapRamp, type Ramp, type Stop } from '../../palette/ramp';
import type { SemanticTokens } from '../../palette/semantic-tokens';
import type { SlotId, TerminalPalette } from '../../palette/terminal-palette';
import { buildTokens } from './accent-tokens';

export type HueName = 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan';

interface ChromaticSlot {
  readonly name: HueName;
  /** Default OKLCH hue, replaced by the accent's hue for the slot nearest to it. */
  readonly hue: number;
  readonly normal: SlotId;
  readonly bright: SlotId;
}

const CHROMATIC_SLOTS: readonly ChromaticSlot[] = [
  { name: 'red', hue: 25, normal: 'color1', bright: 'color9' },
  { name: 'green', hue: 145, normal: 'color2', bright: 'color10' },
  { name: 'yellow', hue: 90, normal: 'color3', bright: 'color11' },
  { name: 'blue', hue: 255, normal: 'color4', bright: 'color12' },
  { name: 'magenta', hue: 325, normal: 'color5', bright: 'color13' },
  { name: 'cyan', hue: 195, normal: 'color6', bright: 'color14' },
];

type NeutralSlot = 'background' | 'foreground' | 'color0' | 'color7' | 'color8' | 'color15';

interface SlotStops {
  /** Stop of the normal chromatic colors (color1–6). */
  readonly normal: Stop;
  /** Stop of their bright variants (color9–14). */
  readonly bright: Stop;
  readonly neutral: Readonly<Record<NeutralSlot, Stop>>;
}

/**
 * Per mode, the stop each terminal slot takes. Normal colors sit one stop darker than their
 * bright variants in both modes; neutrals come from opposite ends of the neutral ramp, with
 * black staying dark and white light so programs that hardcode them keep their meaning.
 */
const SLOT_STOPS: Readonly<Record<Mode, SlotStops>> = {
  dark: {
    normal: 400,
    bright: 300,
    neutral: {
      background: 950,
      color0: 900,
      color8: 600,
      color7: 300,
      color15: 100,
      foreground: 200,
    },
  },
  light: {
    normal: 700,
    bright: 600,
    neutral: {
      background: 50,
      color0: 800,
      color8: 600,
      color7: 300,
      color15: 200,
      foreground: 900,
    },
  },
};

/** Ramps driven by the Colors adjustment, each with its own fine-tuning on top. */
export type ChromaticRamp = 'accent' | HueName;

export const CHROMATIC_RAMPS: readonly ChromaticRamp[] = [
  'accent',
  ...CHROMATIC_SLOTS.map((slot) => slot.name),
];

export type RampName = 'neutral' | ChromaticRamp;

/** Where a slot's color comes from before any adjustment. */
export interface SlotSource {
  readonly ramp: RampName;
  readonly stop: Stop;
}

export const SLOT_SOURCES = forEachMode((mode) => {
  const stops = SLOT_STOPS[mode];
  return Object.fromEntries([
    ...Object.entries(stops.neutral).map(([id, stop]) => [id, { ramp: 'neutral', stop }]),
    ...CHROMATIC_SLOTS.flatMap((slot) => [
      [slot.normal, { ramp: slot.name, stop: stops.normal }],
      [slot.bright, { ramp: slot.name, stop: stops.bright }],
    ]),
  ]) as Readonly<Record<SlotId, SlotSource>>;
});

/** Peak chroma of the chromatic ramps and of the (accent-hued) neutral ramp. */
const SLOT_CHROMA = 0.15;
const NEUTRAL_CHROMA = 0.02;

export interface TintSettings {
  /** Cast color; `null` uses the accent. */
  readonly color: Oklch | null;
  /** Strength on the chromatic ramps. */
  readonly amount: number;
  /** Strength on the neutral ramp. */
  readonly neutralAmount: number;
}

export interface AccentParams {
  readonly accent: Oklch;
  /** Applied to every chromatic ramp. */
  readonly global: Adjustment;
  /** Applied to the neutral ramp (background, foreground, 0, 7, 8, 15). */
  readonly neutral: Adjustment;
  /** Per-ramp fine-tuning, applied after {@link global}. */
  readonly ramps: Partial<Record<ChromaticRamp, Adjustment>>;
  readonly tint: TintSettings;
}

/** What one mode picks from the ramps. */
export interface PaletteVariant {
  readonly palette: TerminalPalette;
  readonly tokens: SemanticTokens;
}

export interface AccentResult {
  readonly accentRamp: Ramp;
  readonly neutralRamp: Ramp;
  readonly hueRamps: Readonly<Record<HueName, Ramp>>;
  readonly variants: Readonly<Record<Mode, PaletteVariant>>;
}

export const DEFAULT_ACCENT_PARAMS: AccentParams = {
  accent: { mode: 'oklch', l: 0.64, c: 0.15, h: 260 },
  global: NO_ADJUSTMENT,
  neutral: NO_ADJUSTMENT,
  ramps: {},
  tint: { color: null, amount: 0, neutralAmount: 0 },
};

/**
 * Accent tool pipeline, applied to whole ramps so every consumer (terminal slots, UI tokens…)
 * sees the same colors: build → global/neutral adjustment → per-ramp adjustment → tint →
 * sRGB gamut mapping. Each mode's terminal slots and tokens then pick stops from the finished ramps.
 */
export function generateFromAccent(params: AccentParams): AccentResult {
  const accentHue = params.accent.h ?? 0;
  const snapped = nearestSlot(params.accent);
  const tintColor = params.tint.color ?? params.accent;

  const finish = (ramp: Ramp, adjustments: readonly Adjustment[], tintAmount: number): Ramp =>
    mapRamp(ramp, (color) =>
      mapToSrgb(tint(adjustments.reduce(adjust, color), tintColor, tintAmount)),
    );
  const finishChromatic = (name: ChromaticRamp, ramp: Ramp) =>
    finish(ramp, [params.global, params.ramps[name] ?? NO_ADJUSTMENT], params.tint.amount);

  const accentRamp = finishChromatic('accent', buildRamp(accentHue, params.accent.c));
  const neutralRamp = finish(
    buildRamp(accentHue, NEUTRAL_CHROMA),
    [params.neutral],
    params.tint.neutralAmount,
  );
  const hueRamps = Object.fromEntries(
    CHROMATIC_SLOTS.map((slot) => [
      slot.name,
      finishChromatic(slot.name, buildRamp(slot === snapped ? accentHue : slot.hue, SLOT_CHROMA)),
    ]),
  ) as Record<HueName, Ramp>;

  const ramps = { accentRamp, neutralRamp, hueRamps };
  const rampOf = (name: RampName) => rampByName(ramps, name);
  const variants = forEachMode((mode) => ({
    palette: Object.fromEntries(
      (Object.entries(SLOT_SOURCES[mode]) as [SlotId, SlotSource][]).map(([id, source]) => [
        id,
        rampOf(source.ramp)[source.stop],
      ]),
    ) as TerminalPalette,
    tokens: buildTokens(rampOf, mode),
  }));

  return { ...ramps, variants };
}

export function rampByName(
  ramps: Pick<AccentResult, 'accentRamp' | 'neutralRamp' | 'hueRamps'>,
  name: RampName,
): Ramp {
  switch (name) {
    case 'accent':
      return ramps.accentRamp;
    case 'neutral':
      return ramps.neutralRamp;
    default:
      return ramps.hueRamps[name];
  }
}

/** Chromatic slot whose default hue is closest to the accent's; none for an achromatic accent. */
function nearestSlot(accent: Oklch): ChromaticSlot | undefined {
  if (accent.h === undefined || accent.c < 0.02) {
    return undefined;
  }
  const distance = (hue: number) => {
    const d = Math.abs(hue - accent.h!) % 360;
    return Math.min(d, 360 - d);
  };
  return CHROMATIC_SLOTS.reduce((best, slot) =>
    distance(slot.hue) < distance(best.hue) ? slot : best,
  );
}
