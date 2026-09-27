import type { Cutout } from "@/lib/pipeline/segment";
import {
  BACKDROPS,
  autoPlacement,
  type BackdropId,
  type Placement,
} from "@/lib/pipeline/banner";
import {
  DEFAULT_SHADOW,
  type ShadowOptions,
  renderShadowIntensity,
  toneMapShadow,
  paintShadow,
} from "@/lib/pipeline/shadow";
import { applyFilters, type FilterParams } from "./filters";
import type { EditorParams } from "./types";

export interface RenderResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const canvasPool: HTMLCanvasElement[] = [];

function getCanvas(w: number, h: number): HTMLCanvasElement {
  if (canvasPool.length > 0) {
    const c = canvasPool.pop()!;
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    return c;
  }
  return document.createElement("canvas");
}

function returnCanvas(c: HTMLCanvasElement): void {
  if (canvasPool.length < 8) {
    c.width = 0;
    c.height = 0;
    canvasPool.push(c);
  }
}

export function cutoutToBitmap(cutout: Cutout): HTMLCanvasElement {
  const c = getCanvas(cutout.width, cutout.height);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const img = ctx.createImageData(cutout.width, cutout.height);
  img.data.set(cutout.alpha);
  ctx.putImageData(img, 0, 0);
  return c;
}

export function cutoutToImageData(cutout: Cutout): ImageData {
  const data = new Uint8ClampedArray(cutout.alpha);
  return new ImageData(data, cutout.width, cutout.height);
}

export function renderCanvas(
  cutout: Cutout,
  params: EditorParams,
  ratio: { width: number; height: number },
): RenderResult {
  const W = ratio.width;
  const H = ratio.height;
  const canvas = getCanvas(W, H);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  const bg = params.background;
  const bgOpaque = bg.mode === "solid" || bg.mode === "gradient";

  if (bgOpaque) {
    renderBackground(ctx, W, H, bg);
  } else {
    renderTransparentBackground(ctx, W, H);
  }

  if (bg.blur > 0) {
    ctx.filter = `blur(${bg.blur}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = "none";
  }

  const placement = autoPlacement(cutout, W, H);
  const place: Placement = {
    x: placement.x + params.crop.x * placement.scale * 0,
    y: placement.y + params.crop.y * placement.scale * 0,
    scale: placement.scale * (params.crop.width > 0 ? params.crop.width : 1),
  };

  if (params.shadowOn) {
    const intensity = renderShadowIntensity(
      cutout,
      place,
      W,
      H,
      params.shadow,
    );
    const mask = toneMapShadow(intensity, W, H, params.shadow);
    paintShadow(ctx, mask, W, H);
  }

  renderProduct(ctx, cutout, place, params.filters, params.lighting);

  return { canvas, width: W, height: H };
}

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  bg: { mode: string; color: string },
): void {
  if (bg.mode === "solid") {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  if (bg.mode === "gradient") {
    const bd = BACKDROPS.find((b) => b.swatch === bg.color) ?? BACKDROPS[0];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, bd.from);
    g.addColorStop(1, bd.to);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const r = ctx.createRadialGradient(W * 0.5, H * 0.16, 0, W * 0.5, H * 0.16, W * 0.95);
    r.addColorStop(0, "rgba(255,255,255,0.5)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);

    const f = ctx.createLinearGradient(0, H * 0.55, 0, H);
    f.addColorStop(0, "rgba(60,55,45,0)");
    f.addColorStop(1, "rgba(60,55,45,0.07)");
    ctx.fillStyle = f;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
    return;
  }

  ctx.fillStyle = "#f0eee8";
  ctx.fillRect(0, 0, W, H);
}

export function renderTransparentBackground(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  ctx.clearRect(0, 0, W, H);
}

export function renderProduct(
  ctx: CanvasRenderingContext2D,
  cutout: Cutout,
  place: Placement,
  filters: FilterParams,
  lighting: Record<string, number>,
): void {
  const { box } = cutout;
  const drawW = Math.max(1, Math.round(box.w * place.scale));
  const drawH = Math.max(1, Math.round(box.h * place.scale));

  const srcData = cutoutToImageData(cutout);
  const processed = new Uint8ClampedArray(srcData.data);

  const mergedFilters: FilterParams = {
    exposure: filters.exposure + (lighting.exposure ?? 0),
    contrast: filters.contrast + (lighting.contrast ?? 0),
    highlights: filters.highlights + (lighting.highlights ?? 0),
    shadows: filters.shadows + (lighting.shadows ?? 0),
    saturation: filters.saturation + (lighting.saturation ?? 0),
    warmth: filters.warmth + (lighting.warmth ?? 0),
    sharpness: Math.max(0, filters.sharpness + (lighting.sharpness ?? 0)),
  };

  applyFilters(processed, cutout.width, cutout.height, mergedFilters, cutout.alpha);

  const img = ctx.createImageData(cutout.width, cutout.height);
  img.data.set(processed);

  const tmp = getCanvas(cutout.width, cutout.height);
  const tmpCtx = tmp.getContext("2d", { willReadFrequently: true })!;
  tmpCtx.putImageData(img, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    tmp,
    box.x,
    box.y,
    box.w,
    box.h,
    place.x - drawW / 2,
    place.y - drawH / 2,
    drawW,
    drawH,
  );

  returnCanvas(tmp);
}

export function renderPreview(
  cutout: Cutout,
  params: EditorParams,
  ratio: { width: number; height: number },
  maxWidth: number = 640,
): RenderResult {
  const result = renderCanvas(cutout, params, ratio);
  const scale = Math.min(1, maxWidth / Math.max(result.width, result.height));

  if (scale === 1) return result;

  const W = Math.round(result.width * scale);
  const H = Math.round(result.height * scale);
  const preview = getCanvas(W, H);
  const ctx = preview.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(result.canvas, 0, 0, W, H);
  returnCanvas(result.canvas);
  return { canvas: preview, width: W, height: H };
}

export function renderCutoutOnly(
  cutout: Cutout,
  bg: { mode: string; color: string },
  W: number,
  H: number,
): RenderResult {
  const canvas = getCanvas(W, H);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  if (bg.mode === "transparent") {
    ctx.clearRect(0, 0, W, H);
  } else {
    renderBackground(ctx, W, H, bg);
  }

  const placement = autoPlacement(cutout, W, H);
  renderProduct(ctx, cutout, placement, { exposure: 0, contrast: 0, highlights: 0, shadows: 0, saturation: 0, warmth: 0, sharpness: 0 }, { exposure: 0, contrast: 0, highlights: 0, shadows: 0, saturation: 0, warmth: 0, sharpness: 0 });

  return { canvas, width: W, height: H };
}

export function poolCanvas(canvas: HTMLCanvasElement): void {
  returnCanvas(canvas);
}
