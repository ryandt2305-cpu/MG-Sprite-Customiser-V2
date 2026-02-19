import type { FilterDef } from './color-math';

/**
 * Mutation filter definitions — exact match to old customiser's FILTERS object
 * and game source mutation-filters.ts.
 */
export const FILTERS: Record<string, FilterDef> = {
  Gold:          { op: 'source-atop', colors: ['rgb(235,200,0)'],   a: 0.7 },
  Rainbow:       { op: 'color',       colors: ['#FF1744', '#FF9100', '#FFEA00', '#00E676', '#2979FF', '#D500F9'], ang: 130, angTall: 0, masked: true },
  Wet:           { op: 'source-atop', colors: ['rgb(50,180,200)'],  a: 0.25 },
  Chilled:       { op: 'source-atop', colors: ['rgb(100,160,210)'], a: 0.45 },
  Frozen:        { op: 'source-atop', colors: ['rgb(100,130,220)'], a: 0.5 },
  Thunderstruck: { op: 'source-atop', colors: ['transparent'],      a: 0 },
  Dawnlit:       { op: 'source-atop', colors: ['rgb(209,70,231)'],  a: 0.5 },
  Ambershine:    { op: 'source-atop', colors: ['rgb(190,100,40)'],  a: 0.5 },
  Dawncharged:   { op: 'source-atop', colors: ['rgb(140,80,200)'],  a: 0.5 },
  Ambercharged:  { op: 'source-atop', colors: ['rgb(170,60,25)'],   a: 0.5 },
};

/** Metadata for overlay/icon rendering (not color application). */
export interface MutationMeta {
  hasOverlay?: boolean;
  overlayKey?: string;
  tallOverlayKey?: string;
  iconKey?: string;
  tallPlantIconOverride?: string;
  floatingIcon?: boolean;
  exclusive?: boolean;
}

export const MUTATION_META: Record<string, MutationMeta> = {
  Gold:          { exclusive: true },
  Rainbow:       { exclusive: true },
  //
  // tallOverlayKey = texture overlay drawn ON TOP of tall plant (masked to silhouette, z=3)
  // tallPlantIconOverride = icon drawn BEHIND tall plant (z=-1)
  Wet:           { hasOverlay: true, overlayKey: 'sprite/mutation/Puddle', tallOverlayKey: 'sprite/mutation-overlay/WetTallPlant',          iconKey: 'sprite/mutation/Wet',          tallPlantIconOverride: 'sprite/mutation/Puddle' },
  Chilled:       { hasOverlay: true, overlayKey: 'sprite/mutation/Chilled', tallOverlayKey: 'sprite/mutation-overlay/ChilledTallPlant',     iconKey: 'sprite/mutation/Chilled' },
  Frozen:        { hasOverlay: true, overlayKey: 'sprite/mutation/Frozen', tallOverlayKey: 'sprite/mutation-overlay/FrozenTallPlant',       iconKey: 'sprite/mutation/Frozen' },
  Thunderstruck: { hasOverlay: true, overlayKey: 'sprite/mutation/Thunderstruck', tallOverlayKey: 'sprite/mutation-overlay/ThunderstruckTallPlant', iconKey: 'sprite/mutation/Thunderstruck', tallPlantIconOverride: 'sprite/mutation/ThunderstruckGround' },
  Dawnlit:       { iconKey: 'sprite/mutation/Dawnlit',     floatingIcon: true },
  Ambershine:    { iconKey: 'sprite/mutation/Amberlit',    floatingIcon: true },
  Dawncharged:   { iconKey: 'sprite/mutation/Dawncharged', floatingIcon: true },
  Ambercharged:  { iconKey: 'sprite/mutation/Ambercharged', floatingIcon: true },
};

/**
 * Rendering priority for mutations.
 * Lower = rendered first (background), Higher = rendered last (dominant).
 * Weather/growth tints are applied first since they're subtle.
 * Gold/Rainbow are applied last since they're visually dominant —
 * Rainbow uses HSL 'color' blend so it takes hue/sat from the gradient
 * regardless of previous tints, and Gold at 0.7 alpha naturally dominates.
 */
const MUTATION_RENDER_ORDER: Record<string, number> = {
  Wet: 0,
  Chilled: 1,
  Frozen: 2,
  Thunderstruck: 3,
  Dawnlit: 4,
  Ambershine: 5,
  Dawncharged: 6,
  Ambercharged: 7,
  Gold: 8,
  Rainbow: 9,
};

/**
 * Resolve which mutations actually apply.
 * No stacking restrictions — all selected mutations are applied freely.
 * Sorted by render order: subtle effects first, dominant effects last.
 */
export function resolveActiveMutations(selected: string[]): string[] {
  return [...selected].sort(
    (a, b) => (MUTATION_RENDER_ORDER[a] ?? 50) - (MUTATION_RENDER_ORDER[b] ?? 50),
  );
}
