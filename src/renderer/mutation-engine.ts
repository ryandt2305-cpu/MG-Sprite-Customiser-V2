import { FILTERS, resolveActiveMutations } from './mutation-defs';
import { applyMaskedFilter } from './color-math';
import type { FilterDef } from './color-math';

/**
 * Apply all active mutations to a base sprite canvas IN-PLACE.
 *
 * Matches the game's PixiJS rendering pipeline:
 * - Non-masked mutations use `source-atop` fill which does:
 *     result.rgb = tint × alpha + base × (1 - alpha)
 *     result.a   = base.a  (preserved)
 *   This is identical to PixiJS ColorOverlayFilter's `mix(original, filtered, uAlpha)`.
 *   Applied directly on the canvas so mutations accumulate naturally and all remain visible.
 *
 * - Masked mutations (Rainbow) use a gradient masked to the sprite's alpha,
 *   drawn with the `color` blend mode (HSL luminosity-preserving blend).
 */
export function applyMutations(
  baseCanvas: HTMLCanvasElement,
  selectedMutations: string[],
  isTall = false,
  customTint?: { color: string; opacity: number },
): void {
  const active = resolveActiveMutations(selectedMutations);

  // Build pipeline including custom tint
  const pipeline: { name: string; filter: FilterDef }[] = [];

  for (const mutId of active) {
    const filter = FILTERS[mutId];
    if (filter) {
      pipeline.push({ name: mutId, filter });
    }
  }

  // Add custom tint if opacity > 0
  if (customTint && customTint.opacity > 0) {
    pipeline.push({
      name: 'Custom',
      filter: { op: 'source-atop', colors: [customTint.color], a: customTint.opacity, masked: true },
    });
  }

  if (pipeline.length === 0) return;

  const { width, height } = baseCanvas;
  const ctx = baseCanvas.getContext('2d')!;

  // Save original base alpha for masked mutations (gradient needs clean alpha mask)
  const originalBase = document.createElement('canvas');
  originalBase.width = width;
  originalBase.height = height;
  originalBase.getContext('2d')!.drawImage(baseCanvas, 0, 0);

  // Apply each mutation in-place on the canvas
  for (const step of pipeline) {
    const f = step.filter;

    if (f.masked) {
      // Masked mutations (Rainbow, Custom): gradient → mask to sprite alpha → blend
      applyMaskedFilter(ctx, originalBase, f, isTall);
    } else {
      // Non-masked mutations: source-atop fill directly on canvas.
      // source-atop: result = src × αs × αd + dst × αd × (1 - αs), αo = αd
      // For fill at globalAlpha=α: result.rgb = tint × α + base × (1-α), result.a = base.a
      // This is EXACTLY the game's ColorOverlayFilter mix(original, filtered, uAlpha)
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      if (f.a != null) ctx.globalAlpha = f.a;
      ctx.fillStyle = f.colors[0] || '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
}

/**
 * Draw a sprite from an Image onto a new canvas.
 */
export function spriteToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return canvas;
}
