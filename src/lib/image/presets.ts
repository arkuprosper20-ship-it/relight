import type { FilterParams, EditorParams } from "./types";
import { DEFAULT_SHADOW_OPTS } from "./types";

export type PresetId = "studio" | "ecommerce" | "luxury" | "soft-light";

export interface Preset {
  id: PresetId;
  label: string;
  description: string;
  icon: string;
  params: Partial<EditorParams>;
}

export const PRESETS: Preset[] = [
  {
    id: "studio",
    label: "Studio",
    description: "Clean white backdrop with a soft, natural shadow — versatile for listings.",
    icon: "studio",
    params: {
      background: { mode: "solid", color: "#f7f6f3", blur: 0, shadow: true },
      lighting: { exposure: 10, contrast: 5, highlights: 0, shadows: 0, saturation: 0, warmth: 0, sharpness: 15 },
      shadow: { ...DEFAULT_SHADOW_OPTS, direction: 55, length: 0.6, softness: 0.7, opacity: 0.35, contact: true },
      shadowOn: true,
    },
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    description: "Bright pure-white background, lifted shadows, optimized for marketplace feeds.",
    icon: "ecommerce",
    params: {
      background: { mode: "solid", color: "#ffffff", blur: 0, shadow: true },
      lighting: { exposure: 20, contrast: 10, highlights: -10, shadows: 10, saturation: 0, warmth: 0, sharpness: 20 },
      shadow: { ...DEFAULT_SHADOW_OPTS, direction: 55, length: 0.5, softness: 0.7, opacity: 0.3, contact: true },
      shadowOn: true,
    },
  },
  {
    id: "luxury",
    label: "Luxury",
    description: "Deep contrast, rich color, controlled highlights, and a subtle grounded shadow.",
    icon: "luxury",
    params: {
      background: { mode: "solid", color: "#282c30", blur: 0, shadow: true },
      lighting: { exposure: -5, contrast: 20, highlights: -15, shadows: -5, saturation: 15, warmth: 10, sharpness: 10 },
      shadow: { ...DEFAULT_SHADOW_OPTS, direction: 115, length: 0.8, softness: 0.4, opacity: 0.45, contact: true },
      shadowOn: true,
    },
  },
  {
    id: "soft-light",
    label: "Soft Light",
    description: "Reduced contrast, lifted shadows, and warm golden tones for a gentle look.",
    icon: "soft",
    params: {
      background: { mode: "gradient", color: "#f6efe4", blur: 0, shadow: true },
      lighting: { exposure: 15, contrast: -10, highlights: -10, shadows: 20, saturation: 5, warmth: 20, sharpness: 5 },
      shadow: { ...DEFAULT_SHADOW_OPTS, direction: 55, length: 0.6, softness: 0.8, opacity: 0.25, contact: true },
      shadowOn: true,
    },
  },
];

export interface LightingPreset {
  id: string;
  label: string;
  exposure: number;
  contrast: number;
}

export const LIGHTING_PRESETS: LightingPreset[] = [
  { id: "bright", label: "Bright", exposure: 20, contrast: 10 },
  { id: "studio", label: "Studio", exposure: 10, contrast: 5 },
  { id: "moody", label: "Moody", exposure: -5, contrast: 20 },
  { id: "soft", label: "Soft", exposure: 15, contrast: -10 },
];

export function getPreset(id: PresetId): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

export const BACKGROUND_COLORS = [
  { label: "White", value: "#ffffff", category: "white" as const },
  { label: "Off-white", value: "#f7f6f3", category: "white" as const },
  { label: "Light gray", value: "#e5e7eb", category: "gray" as const },
  { label: "Dark gray", value: "#282c30", category: "dark" as const },
  { label: "Charcoal", value: "#1e2124", category: "dark" as const },
  { label: "Black", value: "#0a0a0a", category: "dark" as const },
];

export const EXPORT_QUALITIES = [
  { label: "Low (60%)", value: 60 },
  { label: "Medium (80%)", value: 80 },
  { label: "High (90%)", value: 90 },
  { label: "Max (100%)", value: 100 },
];

export const EXPORT_FORMAT_LABELS: Record<string, string> = {
  png: "PNG",
  jpg: "JPG",
  webp: "WEBP",
};

export function applyPreset(params: Partial<EditorParams>, preset: Preset): Partial<EditorParams> {
  return { ...params, ...preset.params };
}
