/**
 * Mutation icon layout — exact match to old customiser's computeIconLayout,
 * findIconKey, and icon rendering loop.
 */

import { state } from '../state/store';
import type { SpriteFrame } from '../api/types';

// ── Constants (exact match to old code) ──

const TILE_SIZE_WORLD = 256;
const BASE_ICON_SCALE = 0.5;
const TALL_PLANT_MUTATION_ICON_SCALE_BOOST = 2;

// ── Per-species icon position exceptions ──

const MUT_ICON_X_EXCEPT: Record<string, number> = {
  Pepper: 0.5,
  Banana: 0.6,
};

const MUT_ICON_Y_EXCEPT: Record<string, number> = {
  Banana: 0.6,
  Carrot: 0.6,
  Sunflower: 0.5,
  Starweaver: 0.5,
  FavaBean: 0.25,
  BurrosTail: 0.2,
};

export const FLOATING_MUTATION_ICONS = new Set([
  'Dawnlit',
  'Ambershine',
  'Dawncharged',
  'Ambercharged',
]);

// ── Tall plant detection ──

export function isTallKey(key: string): boolean {
  return /tall-?plant/i.test(key);
}

function baseNameOf(key: string): string {
  const parts = String(key || '').split('/');
  return parts[parts.length - 1] || '';
}

function mutationAliases(mut: string): string[] {
  switch (mut) {
    case 'Ambershine':
      return ['Ambershine', 'Amberlit'];
    case 'Dawncharged':
      return ['Dawncharged', 'Dawnbound'];
    case 'Ambercharged':
      return ['Ambercharged', 'Amberbound'];
    default:
      return [mut];
  }
}

// ── Icon layout computation (matches old computeIconLayout exactly) ──

export interface IconLayout {
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  offset: { x: number; y: number };
  iconScale: number;
}

export function computeIconLayout(
  spriteWidth: number,
  spriteHeight: number,
  spriteAnchorX: number,
  spriteAnchorY: number,
  spriteKey: string,
  isTall: boolean,
): IconLayout {
  const width = spriteWidth;
  const height = spriteHeight;
  const anchorX = spriteAnchorX;
  const anchorY = spriteAnchorY;

  const baseName = baseNameOf(spriteKey);
  const targetX = MUT_ICON_X_EXCEPT[baseName] ?? anchorX;
  const isVerticalShape = height > width * 1.5;
  // Vertical shapes (Bamboo, Cactus etc.) → align icons to texture anchor (base).
  // Round/square shapes → align to center (0.4).
  // Matches game source: shouldCheckLongness && isVertical ? anchorY : 0.4
  // where bamboo/cactus are Single-harvest → shouldCheckLongness=true → anchorY.
  const targetY = MUT_ICON_Y_EXCEPT[baseName] ?? (isVerticalShape ? anchorY : 0.4);

  const offset = {
    x: (targetX - anchorX) * width,
    y: (targetY - anchorY) * height,
  };

  const minDimension = Math.min(width, height);
  const scaleFactor = Math.min(1.5, minDimension / TILE_SIZE_WORLD);
  let iconScale = BASE_ICON_SCALE * scaleFactor;
  if (isTall) iconScale = iconScale * TALL_PLANT_MUTATION_ICON_SCALE_BOOST;

  return { width, height, anchorX, anchorY, offset, iconScale };
}

// ── Icon key lookup (matches old findIconKey exactly) ──

/** Look up the correct icon sprite key for a mutation, checking tall plant overrides. */
export function findIconKey(
  itemKey: string,
  mutName: string,
  isTall: boolean,
  meta: { tallPlantIconOverride?: string },
): string | null {
  if (!mutName) return null;

  // Build a set of known sprite IDs for lookup
  const knownIds = getSpriteIdSet();

  // 1. Check metadata override for tall plants
  if (isTall && meta?.tallPlantIconOverride && knownIds.has(meta.tallPlantIconOverride)) {
    return meta.tallPlantIconOverride;
  }

  const base = baseNameOf(itemKey);
  const aliases = mutationAliases(mutName);

  for (const name of aliases) {
    // 2. Try tall variants
    if (isTall) {
      const tallIconKey = 'sprite/mutation-overlay/' + name + 'TallPlantIcon';
      if (knownIds.has(tallIconKey)) return tallIconKey;
      const tallKey = 'sprite/mutation-overlay/' + name + 'TallPlant';
      if (knownIds.has(tallKey)) return tallKey;
    }

    // 3. Try standard icon keys
    const tries = [
      'sprite/mutation/' + name + 'Icon',
      'sprite/mutation/' + name,
      'sprite/mutation/' + name + base,
      'sprite/mutation/' + name + '-' + base,
      'sprite/mutation/' + name + '_' + base,
      'sprite/mutation/' + name + '/' + base,
    ];
    for (const k of tries) {
      if (knownIds.has(k)) return k;
    }
  }

  return null;
}

// ── Sprite ID set cache (built from sprite-data) ──

let _spriteIdSet: Set<string> | null = null;

function getSpriteIdSet(): Set<string> {
  if (_spriteIdSet) return _spriteIdSet;
  const set = new Set<string>();
  const sd = state.spriteData;
  if (sd) {
    for (const cat of sd.categories) {
      for (const item of cat.items) {
        set.add(item.id);
      }
    }
  }
  _spriteIdSet = set;
  return set;
}

/** Clear the cached sprite ID set (call when sprite data reloads). */
export function clearSpriteIdCache(): void {
  _spriteIdSet = null;
}

// ── Icon anchor lookup ──

/** Get the anchor point of an icon sprite from sprite-data. */
export function getIconAnchor(iconId: string): { x: number; y: number } {
  const sd = state.spriteData;
  if (!sd) return { x: 0.5, y: 0.5 };
  for (const cat of sd.categories) {
    for (const item of cat.items) {
      if (item.id === iconId && item.type === 'frame') {
        const frame = item as SpriteFrame;
        return { x: frame.anchor?.x ?? 0.5, y: frame.anchor?.y ?? 0.5 };
      }
    }
  }
  return { x: 0.5, y: 0.5 };
}

// ── Legacy export for overlay positioning ──

export function calcOverlayPosition(
  baseWidth: number,
  baseHeight: number,
  overlayWidth: number,
  overlayHeight: number,
  anchorX = 0.5,
  anchorY = 1.0,
): { x: number; y: number } {
  return {
    x: anchorX * baseWidth - overlayWidth * 0.5,
    y: anchorY * baseHeight - overlayHeight + 100,
  };
}
