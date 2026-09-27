import type { ShadowOptions } from "@/lib/pipeline/shadow";

export type Tool = "clean" | "relight" | "background" | "crop" | "styles" | "upscale" | "text" | "compare" | "export";

export type Stage = "empty" | "processing" | "ready" | "error";

export type FilterParams = {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  saturation: number;
  warmth: number;
  sharpness: number;
  gamma?: number;
};

export type BackgroundMode = "solid" | "gradient" | "transparent" | "color";

export type BackgroundConfig = {
  mode: BackgroundMode;
  color: string;
  blur: number;
  shadow: boolean;
};

export type CropConfig = {
  ratio: string;
  x: number;
  y: number;
  width: number;
  height: number;
  flipX: boolean;
};

export type LightingConfig = {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  saturation: number;
  warmth: number;
  sharpness: number;
};

export type EditorParams = {
  filters: FilterParams;
  background: BackgroundConfig;
  crop: CropConfig;
  lighting: LightingConfig;
  shadow: ShadowOptions;
  shadowOn: boolean;
};

export type BackgroundOptions = BackgroundConfig;

export const DEFAULT_FILTERS: FilterParams = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  saturation: 0,
  warmth: 0,
  sharpness: 0,
  gamma: 1,
};

export const DEFAULT_LIGHTING: LightingConfig = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  saturation: 0,
  warmth: 0,
  sharpness: 0,
};

export const DEFAULT_BG: BackgroundConfig = {
  mode: "gradient",
  color: "#f0eee8",
  blur: 0,
  shadow: true,
};

export const DEFAULT_SHADOW_OPTS: ShadowOptions = {
  direction: 55,
  length: 0.65,
  softness: 0.65,
  opacity: 0.4,
  contact: true,
};

export const DEFAULT_CROP: CropConfig = {
  ratio: "4:5",
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  flipX: false,
};

export function defaultEditorParams(): EditorParams {
  return {
    filters: { ...DEFAULT_FILTERS },
    background: { ...DEFAULT_BG },
    crop: { ...DEFAULT_CROP },
    lighting: { ...DEFAULT_LIGHTING },
    shadow: { ...DEFAULT_SHADOW_OPTS },
    shadowOn: true,
  };
}

export type HistoryEntry = {
  label: string;
  params: EditorParams;
};

export type ExportFormat = "png" | "jpg" | "webp";
export type ExportScale = 1 | 2 | 4;

export type ExportOptions = {
  format: ExportFormat;
  quality: number;
  scale: ExportScale;
};

export const EXPORT_FORMATS: ExportFormat[] = ["png", "jpg", "webp"];
export const EXPORT_SCALES: ExportScale[] = [1, 2, 4];
