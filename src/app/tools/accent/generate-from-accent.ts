import { adjust, NO_ADJUSTMENT, tint, type Adjustment } from '../../palette/adjust';
import { mapToSrgb, type Oklch } from '../../palette/color';
import { buildRamp, type Ramp, type Stop } from '../../palette/ramp';
import type { SlotId, TerminalPalette } from '../../palette/terminal-palette';

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

/** Dark theme: normal colors one stop darker than their bright variants. */
const NORMAL_STOP: Stop = 400;
const BRIGHT_STOP: Stop = 300;

/** Dark theme: neutrals taken from both ends of the neutral ramp. */
const NEUTRAL_STOPS = {
  background: 950,
  color0: 900,
  color8: 600,
  color7: 300,
  color15: 100,
  foreground: 200,
} as const satisfies Partial<Record<SlotId, Stop>>;

export type RampName = 'neutral' | HueName;

/** Where a slot's color comes from before any adjustment. */
export interface SlotSource {
  readonly ramp: RampName;
  readonly stop: Stop;
}

export const SLOT_SOURCES = Object.fromEntries([
  ...Object.entries(NEUTRAL_STOPS).map(([id, stop]) => [id, { ramp: 'neutral', stop }]),
  ...CHROMATIC_SLOTS.flatMap((slot) => [
    [slot.normal, { ramp: slot.name, stop: NORMAL_STOP }],
    [slot.bright, { ramp: slot.name, stop: BRIGHT_STOP }],
  ]),
]) as Readonly<Record<SlotId, SlotSource>>;

/** Peak chroma of the chromatic ramps and of the (accent-hued) neutral ramp. */
const SLOT_CHROMA = 0.15;
const NEUTRAL_CHROMA = 0.02;

export interface SlotOverride extends Partial<Adjustment> {
  /** Ramp stop to take the slot from, instead of the default one. */
  readonly stop?: Stop;
}

export interface TintSettings {
  /** Cast color; `null` uses the accent. */
  readonly color: Oklch | null;
  /** Strength on chromatic slots. */
  readonly amount: number;
  /** Strength on neutral slots. */
  readonly neutralAmount: number;
}

export interface AccentParams {
  readonly accent: Oklch;
  /** Applied to chromatic slots. */
  readonly global: Adjustment;
  /** Applied to neutral slots (background, foreground, 0, 7, 8, 15). */
  readonly neutral: Adjustment;
  readonly slots: Partial<Record<SlotId, SlotOverride>>;
  readonly tint: TintSettings;
}

export interface AccentResult {
  readonly accentRamp: Ramp;
  readonly neutralRamp: Ramp;
  readonly hueRamps: Readonly<Record<HueName, Ramp>>;
  readonly palette: TerminalPalette;
}

export const DEFAULT_ACCENT_PARAMS: AccentParams = {
  accent: { mode: 'oklch', l: 0.64, c: 0.15, h: 260 },
  global: NO_ADJUSTMENT,
  neutral: NO_ADJUSTMENT,
  slots: {},
  tint: { color: null, amount: 0, neutralAmount: 0 },
};

/**
 * Accent tool pipeline: ramps → default stop per slot → global/neutral adjustment →
 * per-slot override → tint → sRGB gamut mapping.
 */
export function generateFromAccent(params: AccentParams): AccentResult {
  const accentHue = params.accent.h ?? 0;
  const snapped = nearestSlot(params.accent);

  const accentRamp = buildRamp(accentHue, params.accent.c);
  const neutralRamp = buildRamp(accentHue, NEUTRAL_CHROMA);
  const hueRamps = Object.fromEntries(
    CHROMATIC_SLOTS.map((slot) => [
      slot.name,
      buildRamp(slot === snapped ? accentHue : slot.hue, SLOT_CHROMA),
    ]),
  ) as Record<HueName, Ramp>;

  const tintColor = params.tint.color ?? params.accent;
  const finish = (id: SlotId, source: SlotSource): Oklch => {
    const isNeutral = source.ramp === 'neutral';
    const override = params.slots[id];
    let color = rampByName({ neutralRamp, hueRamps }, source.ramp)[override?.stop ?? source.stop];
    color = adjust(color, isNeutral ? params.neutral : params.global);
    color = adjust(color, { ...NO_ADJUSTMENT, ...override });
    color = tint(color, tintColor, isNeutral ? params.tint.neutralAmount : params.tint.amount);
    return mapToSrgb(color);
  };

  const palette = Object.fromEntries(
    (Object.entries(SLOT_SOURCES) as [SlotId, SlotSource][]).map(([id, source]) => [
      id,
      finish(id, source),
    ]),
  ) as TerminalPalette;

  return { accentRamp, neutralRamp, hueRamps, palette };
}

export function rampByName(
  ramps: Pick<AccentResult, 'neutralRamp' | 'hueRamps'>,
  name: RampName,
): Ramp {
  return name === 'neutral' ? ramps.neutralRamp : ramps.hueRamps[name];
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
