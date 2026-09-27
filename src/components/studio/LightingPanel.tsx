import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sun, Contrast, MoveUp, Wind, Droplets, RefreshCw } from "lucide-react";
import type { EditorParams } from "@/lib/image/types";
import { DEFAULT_LIGHTING } from "@/lib/image/types";
import { LIGHTING_PRESETS } from "@/lib/image/presets";
import { cn } from "@/lib/utils";

export interface LightingPanelProps {
  params: EditorParams;
  onParamsChange: (params: Partial<EditorParams>) => void;
  onReset: () => void;
}

export function LightingPanel({ params, onParamsChange, onReset }: LightingPanelProps) {
  const lighting = params.lighting;

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-semibold">Lighting & Filters</h3>

      <div className="grid grid-cols-2 gap-2">
        {LIGHTING_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant={
              lighting.exposure === preset.exposure && lighting.contrast === preset.contrast
                ? "default"
                : "outline"
            }
            size="sm"
            className="h-auto py-2"
            onClick={() =>
              onParamsChange({
                lighting: { ...lighting, exposure: preset.exposure, contrast: preset.contrast },
              })
            }
          >
            <div className="flex flex-col items-center gap-1">
              <Sun className="h-4 w-4" />
              <span className="text-xs">{preset.label}</span>
            </div>
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        <ParamSlider
          label="Exposure"
          icon={<Sun className="h-3.5 w-3.5" />}
          value={lighting.exposure}
          min={-100}
          max={100}
          step={5}
          onChange={(v) => onParamsChange({ lighting: { ...lighting, exposure: v } })}
        />
        <ParamSlider
          label="Contrast"
          icon={<Contrast className="h-3.5 w-3.5" />}
          value={lighting.contrast}
          min={-100}
          max={100}
          step={5}
          onChange={(v) => onParamsChange({ lighting: { ...lighting, contrast: v } })}
        />
        <ParamSlider
          label="Highlights"
          icon={<MoveUp className="h-3.5 w-3.5" />}
          value={lighting.highlights}
          min={-100}
          max={100}
          step={5}
          onChange={(v) => onParamsChange({ lighting: { ...lighting, highlights: v } })}
        />
        <ParamSlider
          label="Shadows"
          icon={<Wind className="h-3.5 w-3.5" />}
          value={lighting.shadows}
          min={-100}
          max={100}
          step={5}
          onChange={(v) => onParamsChange({ lighting: { ...lighting, shadows: v } })}
        />
        <ParamSlider
          label="Saturation"
          icon={<Droplets className="h-3.5 w-3.5" />}
          value={lighting.saturation}
          min={-100}
          max={100}
          step={5}
          onChange={(v) => onParamsChange({ lighting: { ...lighting, saturation: v } })}
        />
        <ParamSlider
          label="Warmth"
          icon={<Sun className="h-3.5 w-3.5" />}
          value={lighting.warmth}
          min={-100}
          max={100}
          step={5}
          onChange={(v) => onParamsChange({ lighting: { ...lighting, warmth: v } })}
        />
        <ParamSlider
          label="Sharpness"
          icon={<Sun className="h-3.5 w-3.5" />}
          value={lighting.sharpness}
          min={0}
          max={100}
          step={5}
          onChange={(v) => onParamsChange({ lighting: { ...lighting, sharpness: v } })}
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onParamsChange({ lighting: { ...DEFAULT_LIGHTING } })}
        className="gap-2"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Reset All
      </Button>
    </div>
  );
}

function ParamSlider({
  label,
  icon,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex items-center gap-1.5 text-xs text-foreground/60">
        {icon}
        <Label className="whitespace-nowrap">{label}</Label>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
      <span className="w-12 text-right text-xs text-foreground/40">{value > 0 ? "+" : ""}{value}</span>
    </div>
  );
}
