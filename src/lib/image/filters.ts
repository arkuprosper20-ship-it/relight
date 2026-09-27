import { clamp255 } from "@/lib/pipeline/pixels";

export type FilterParams = {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  saturation: number;
  warmth: number;
  sharpness: number;
};

export function createDefaultFilters(): FilterParams {
  return {
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    saturation: 0,
    warmth: 0,
    sharpness: 0,
  };
}

function srgbToLinear(v: number): number {
  v = v / 255;
  if (v <= 0.04045) return v / 12.92;
  return Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number): number {
  v = Math.max(0, Math.min(1, v));
  if (v <= 0.0031308) return v * 12.92 * 255;
  return (1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255;
}

const _LINEAR_LUT = new Array(256);
const _SRGB_LUT = new Array(256);
for (let i = 0; i < 256; i++) {
  _LINEAR_LUT[i] = srgbToLinear(i);
  _SRGB_LUT[i] = linearToSrgb(_LINEAR_LUT[i]);
}

function lum(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function applyExposure(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
  if (amount === 0) return;
  const factor = Math.pow(2, amount / 50);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp255(data[i] * factor);
    data[i + 1] = clamp255(data[i + 1] * factor);
    data[i + 2] = clamp255(data[i + 2] * factor);
  }
}

export function applyContrast(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
  if (amount === 0) return;
  const factor = 1 + amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp255((data[i] - 128) * factor + 128);
    data[i + 1] = clamp255((data[i + 1] - 128) * factor + 128);
    data[i + 2] = clamp255((data[i + 2] - 128) * factor + 128);
  }
}

export function applyHighlights(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
  if (amount === 0) return;
  const adj = amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    const l = lum(data[i], data[i + 1], data[i + 2]) / 255;
    const mask = l > 0.5 ? (l - 0.5) * 2 : 0;
    const mult = 1 + adj * mask;
    data[i] = clamp255(data[i] * mult);
    data[i + 1] = clamp255(data[i + 1] * mult);
    data[i + 2] = clamp255(data[i + 2] * mult);
  }
}

export function applyShadows(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
  if (amount === 0) return;
  const adj = amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    const l = lum(data[i], data[i + 1], data[i + 2]) / 255;
    const mask = l < 0.5 ? (0.5 - l) * 2 : 0;
    const mult = 1 - adj * mask * 0.5;
    data[i] = clamp255(data[i] * mult);
    data[i + 1] = clamp255(data[i + 1] * mult);
    data[i + 2] = clamp255(data[i + 2] * mult);
  }
}

export function applySaturation(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
  if (amount === 0) return;
  const s = 1 + amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const avg = (r + g + b) / 3;
    data[i] = clamp255(avg + (r - avg) * s);
    data[i + 1] = clamp255(avg + (g - avg) * s);
    data[i + 2] = clamp255(avg + (b - avg) * s);
  }
}

export function applyWarmth(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
  if (amount === 0) return;
  const t = amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp255(data[i] + 15 * t);
    data[i + 1] = clamp255(data[i + 1] + 5 * t);
    data[i + 2] = clamp255(data[i + 2] - 10 * t);
  }
}

function boxBlurChannel(
  src: Float32Array,
  out: Float32Array,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(1, Math.round(radius));
  const norm = 1 / (2 * r + 1);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += src[row + Math.min(width - 1, Math.max(0, x))];
    for (let x = 0; x < width; x++) {
      out[row + x] = sum * norm;
      sum += src[row + Math.min(width - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  const tmp = new Float32Array(out);
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.min(height - 1, Math.max(0, y)) * width + x];
    for (let y = 0; y < height; y++) {
      out[y * width + x] = sum * norm;
      sum += tmp[Math.min(height - 1, y + r + 1) * width + x] - tmp[Math.max(0, y - r) * width + x];
    }
  }
}

export function applySharpness(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
  alpha: Uint8ClampedArray | null,
): void {
  if (amount <= 0) return;
  const strength = amount / 100;
  const n = width * height;
  const r = new Float32Array(n);
  const g = new Float32Array(n);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    r[i] = data[i * 4];
    g[i] = data[i * 4 + 1];
    b[i] = data[i * 4 + 2];
  }
  const blurredR = new Float32Array(n);
  const blurredG = new Float32Array(n);
  const blurredB = new Float32Array(n);
  boxBlurChannel(r, blurredR, width, height, 1);
  boxBlurChannel(g, blurredG, width, height, 1);
  boxBlurChannel(b, blurredB, width, height, 1);

  for (let i = 0; i < n; i++) {
    const p = i * 4;
    if (alpha) {
      const a = alpha[p + 3];
      if (a < 128) continue;
      const mask = Math.min(1, a / 255);
      const s = strength * mask;
      data[p] = clamp255(data[p] + (data[p] - blurredR[i]) * s);
      data[p + 1] = clamp255(data[p + 1] + (data[p + 1] - blurredG[i]) * s);
      data[p + 2] = clamp255(data[p + 2] + (data[p + 2] - blurredB[i]) * s);
    } else {
      data[p] = clamp255(data[p] + (data[p] - blurredR[i]) * strength);
      data[p + 1] = clamp255(data[p + 1] + (data[p + 1] - blurredG[i]) * strength);
      data[p + 2] = clamp255(data[p + 2] + (data[p + 2] - blurredB[i]) * strength);
    }
  }
}

export function applyGamma(data: Uint8ClampedArray, width: number, height: number, gamma: number): void {
  if (gamma <= 0 || gamma === 1) return;
  const inv = 1 / gamma;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp255(255 * Math.pow(data[i] / 255, inv));
    data[i + 1] = clamp255(255 * Math.pow(data[i + 1] / 255, inv));
    data[i + 2] = clamp255(255 * Math.pow(data[i + 2] / 255, inv));
  }
}

export function applyFilters(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  filters: FilterParams,
  alpha: Uint8ClampedArray | null,
): void {
  applyExposure(data, width, height, filters.exposure);
  applyContrast(data, width, height, filters.contrast);
  applyHighlights(data, width, height, filters.highlights);
  applyShadows(data, width, height, filters.shadows);
  applySaturation(data, width, height, filters.saturation);
  applyWarmth(data, width, height, filters.warmth);
  applySharpness(data, width, height, filters.sharpness, alpha);
}

export function resetFilters(): FilterParams {
  return createDefaultFilters();
}

export const FILTER_RANGES = {
  exposure: { min: -100, max: 100, step: 1, label: "Exposure", suffix: "" },
  contrast: { min: -100, max: 100, step: 1, label: "Contrast", suffix: "" },
  highlights: { min: -100, max: 100, step: 1, label: "Highlights", suffix: "" },
  shadows: { min: -100, max: 100, step: 1, label: "Shadows", suffix: "" },
  saturation: { min: -100, max: 100, step: 1, label: "Saturation", suffix: "" },
  warmth: { min: -100, max: 100, step: 1, label: "Warmth", suffix: "" },
  sharpness: { min: 0, max: 100, step: 1, label: "Sharpness", suffix: "" },
} as const;
