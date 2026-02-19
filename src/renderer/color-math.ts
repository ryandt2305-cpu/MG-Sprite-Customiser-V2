/**
 * Mutation color math utilities.
 *
 * Non-masked mutations (Gold, Wet, etc.) are handled directly in mutation-engine.ts
 * via `source-atop` fill, which matches the game's ColorOverlayFilter exactly:
 *   result.rgb = tint × alpha + base × (1 - alpha)
 *   result.a   = base.a  (preserved)
 *
 * Masked mutations (Rainbow) use this module:
 *   1. Create gradient on temp canvas
 *   2. Mask gradient to sprite alpha via destination-in
 *   3. Draw masked gradient onto canvas with 'color' blend mode (HSL luminosity blend)
 *   This matches the game's ColorGradientFilter + ColorBlendPreserveAlphaFilter pipeline.
 */

// ── Blend Op Support Detection ──

const SUPPORTED_BLEND_OPS = (() => {
  try {
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    if (!g) return new Set<string>();
    const ops = ['color', 'hue', 'saturation', 'luminosity', 'overlay', 'screen', 'lighter', 'source-atop'];
    const ok = new Set<string>();
    for (const op of ops) {
      g.globalCompositeOperation = op as GlobalCompositeOperation;
      if (g.globalCompositeOperation === op) ok.add(op);
    }
    return ok;
  } catch {
    return new Set<string>();
  }
})();

function pickBlendOp(desired: string): GlobalCompositeOperation {
  if (SUPPORTED_BLEND_OPS.has(desired)) return desired as GlobalCompositeOperation;
  if (SUPPORTED_BLEND_OPS.has('overlay')) return 'overlay';
  if (SUPPORTED_BLEND_OPS.has('screen')) return 'screen';
  if (SUPPORTED_BLEND_OPS.has('lighter')) return 'lighter';
  return 'source-atop';
}

// ── Gradient Helpers (exact match to old customiser) ──

function angleGrad(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ang: number,
  fullSpan: boolean,
): CanvasGradient {
  const rad = ((ang - 90) * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  if (!fullSpan) {
    const r2 = Math.min(w, h) / 2;
    return ctx.createLinearGradient(
      cx - Math.cos(rad) * r2,
      cy - Math.sin(rad) * r2,
      cx + Math.cos(rad) * r2,
      cy + Math.sin(rad) * r2,
    );
  }
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const r = (Math.abs(dx) * w) / 2 + (Math.abs(dy) * h) / 2;
  return ctx.createLinearGradient(cx - dx * r, cy - dy * r, cx + dx * r, cy + dy * r);
}

function fillGrad(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: string[],
  ang: number | undefined,
  fullSpan: boolean,
): void {
  const cols = colors.length ? colors : ['#fff'];
  const g = ang != null ? angleGrad(ctx, w, h, ang, fullSpan) : ctx.createLinearGradient(0, 0, 0, h);
  if (cols.length === 1) {
    g.addColorStop(0, cols[0]);
    g.addColorStop(1, cols[0]);
  } else {
    cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// ── Filter Definition ──

export interface FilterDef {
  op: string;
  colors: string[];
  a?: number;
  ang?: number;
  angTall?: number;
  masked?: boolean;
}

/**
 * Apply a MASKED mutation filter (Rainbow, Custom tint) onto a canvas.
 *
 * Pipeline:
 * 1. Create temp canvas with the ORIGINAL base (clean, untinted)
 * 2. Create gradient masked to originalBase's alpha
 * 3. Draw masked gradient onto the clean base copy with the blend mode
 *    (so `color` blend takes luminosity from the CLEAN base, not accumulated tints)
 * 4. Composite the blended result back onto the accumulated canvas
 *
 * This matches the game where Rainbow always uses the original sprite's luminosity,
 * because the game never applies weather color tints when Rainbow is active.
 */
export function applyMaskedFilter(
  ctx: CanvasRenderingContext2D,
  originalBase: HTMLCanvasElement,
  filter: FilterDef,
  isTall: boolean,
): void {
  const f = { ...filter };
  if (isTall && f.angTall != null) {
    f.ang = f.angTall;
  }

  const fullSpan = isTall && f.ang != null;
  const w = originalBase.width;
  const h = originalBase.height;

  const blendOp = pickBlendOp(f.op);

  // Create gradient masked to sprite shape
  const m = document.createElement('canvas');
  m.width = w;
  m.height = h;
  const mctx = m.getContext('2d')!;
  mctx.imageSmoothingEnabled = false;
  fillGrad(mctx, w, h, f.colors, f.ang, fullSpan);
  mctx.globalCompositeOperation = 'destination-in';
  mctx.drawImage(originalBase, 0, 0);

  // Apply the blend onto a CLEAN copy of the original base,
  // so `color` blend takes luminosity from the untinted base (matching the game).
  const blended = document.createElement('canvas');
  blended.width = w;
  blended.height = h;
  const bctx = blended.getContext('2d')!;
  bctx.imageSmoothingEnabled = false;
  bctx.drawImage(originalBase, 0, 0);
  bctx.save();
  bctx.globalCompositeOperation = blendOp;
  if (f.a != null) bctx.globalAlpha = f.a;
  bctx.drawImage(m, 0, 0);
  bctx.restore();

  // Composite the blended result onto the accumulated canvas using source-atop
  // so it respects the existing alpha and doesn't erase other mutation tints
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.drawImage(blended, 0, 0);
  ctx.restore();
}
