import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Upload,
  RotateCw,
} from "lucide-react";
import { DEFAULT_SHADOW_OPTS } from "@/lib/image/types";
import type { EditorParams } from "@/lib/image/types";
import type { ShadowOptions } from "@/lib/pipeline/shadow";
import { RATIOS } from "@/lib/pipeline/banner";
import { cn } from "@/lib/utils";

export interface BackgroundPanelProps {
  params: EditorParams;
  onParamsChange: (params: Partial<EditorParams>) => void;
  shadow: ShadowOptions;
  onShadowChange: (s: ShadowOptions) => void;
}

const SHADOW_PRESETS: Array<{ id: string; label: string; opts: Partial<ShadowOptions> }> = [
  { id: "studio", label: "Studio soft", opts: { direction: 55, length: 0.65, softness: 0.65, opacity: 0.4, contact: true } },
  { id: "sun", label: "Hard sun", opts: { direction: 30, length: 1.05, softness: 0.28, opacity: 0.5, contact: true } },
  { id: "moody", label: "Moody", opts: { direction: 115, length: 0.85, softness: 0.5, opacity: 0.55, contact: true } },
  { id: "flat", label: "Flat lay", opts: { direction: 90, length: 0.35, softness: 0.75, opacity: 0.3, contact: true } },
];

const BG_OPTIONS = [
  { value: "gradient", label: "Gradient" },
  { value: "solid", label: "Solid White" },
  { value: "color", label: "Custom Color" },
  { value: "transparent", label: "Transparent" },
] as const;

export function BackgroundPanel({ params, onParamsChange, shadow, onShadowChange }: BackgroundPanelProps) {
  const [shadowExpanded, setShadowExpanded] = useState(true);
  const bg = params.background;

  const applyShadowPreset = (preset: (typeof SHADOW_PRESETS)[number]) => {
    onShadowChange({
      direction: preset.opts.direction ?? shadow.direction,
      length: preset.opts.length ?? shadow.length,
      softness: preset.opts.softness ?? shadow.softness,
      opacity: preset.opts.opacity ?? shadow.opacity,
      contact: preset.opts.contact ?? shadow.contact,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-semibold">Background & Layout</h3>

      <Select
        value={bg.mode}
        onValueChange={(v) =>
          onParamsChange({
            background: {
              ...bg,
              mode: v as any,
              color: v === "gradient" ? "#f0eee8" : v === "transparent" ? "transparent" : v === "solid" ? "#ffffff" : bg.color,
            },
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Background" />
        </SelectTrigger>
        <SelectContent>
          {BG_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {bg.mode === "color" && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={bg.color}
            onChange={(e) => onParamsChange({ background: { ...bg, color: e.target.value } })}
            className="h-8 w-12 cursor-pointer rounded border border-border p-0"
          />
          <Label className="text-xs">Background color</Label>
        </div>
      )}

      <Select
        value={params.crop.ratio}
        onValueChange={(v) => onParamsChange({ crop: { ...params.crop, ratio: v } })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Aspect ratio" />
        </SelectTrigger>
        <SelectContent>
          {RATIOS.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div>
        <Button variant="ghost" size="sm" className="w-full justify-between" onClick={() => setShadowExpanded(!shadowExpanded)}>
          <span>Shadow Presets</span>
          {shadowExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {shadowExpanded && (
          <div className="mt-2 flex flex-col gap-1.5">
            {SHADOW_PRESETS.map((p) => (
              <Button
                key={p.id}
                variant="outline"
                size="sm"
                className="h-auto justify-start text-xs"
                onClick={() => applyShadowPreset(p)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
        <Upload className="h-4 w-4" />
        Custom Background
      </Button>
    </div>
  );
}
