

import type { Cutout } from "./segment";

export type MattingResult = {

  alpha: Uint8ClampedArray;
  width: number;
  height: number;

  confidence: number;
};

export type MattingPipeline = (
  image: ImageBitmap | string,
  options?: Record<string, unknown>,
) => Promise<MattingResult | null>;

export const MATTING_AVAILABLE = false;

export type BackgroundRemovalResult = {
  alpha: Uint8ClampedArray;
  width: number;
  height: number;
  confidence: number;
};

export function loadMattingModel(): Promise<MattingPipeline | null> {
  return Promise.resolve(null);
}

export async function aiMatte(
  bitmap: ImageBitmap,
): Promise<MattingResult | null> {
  return null;
}

export function matteToCutout(
  source: { data: Uint8ClampedArray; width: number; height: number },
  matte: MattingResult,
): Cutout {
  const { width: w, height: h } = source;
  const n = w * h;
  const alpha = new Uint8ClampedArray(n * 4);
  const m = matte.alpha;

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    const a = m[p + 3];
    alpha[p] = source.data[p];
    alpha[p + 1] = source.data[p + 1];
    alpha[p + 2] = source.data[p + 2];
    alpha[p + 3] = a;
    if (a > 128) {
      const x = i % w;
      const y = (i / w) | 0;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) {
    minX = 0; minY = 0; maxX = w - 1; maxY = h - 1;
  }

  return {
    alpha,
    width: w,
    height: h,
    softPixels: 0,
    touchedEdges: new Set<number>(),
    box: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 },
    candidates: [
      {
        box: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 },
        area: (maxX - minX + 1) * (maxY - minY + 1),
        score: 1,
      },
    ],
    confidence: matte.confidence,
  };
}
