import { Button } from "@/components/ui/button";
import { PRESETS, type Preset } from "@/lib/image/presets";
import type { EditorParams } from "@/lib/image/types";
import { Paintbrush, Check } from "lucide-react";

export interface PresetPanelProps {
  params: EditorParams;
  onPresetApply: (preset: Preset) => void;
}

export function PresetPanel({ params, onPresetApply }: PresetPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-semibold">Presets</h3>

      <div className="space-y-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onPresetApply(preset)}
            className="group flex items-center gap-3 rounded-lg border border-border/50 p-3 text-left transition-all hover:border-primary/30 hover:bg-muted"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Paintbrush className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{preset.label}</span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase text-foreground/50">
                  {preset.icon}
                </span>
              </div>
              <p className="text-xs text-foreground/60">{preset.description}</p>
            </div>
            <div className="opacity-0 transition-opacity group-hover:opacity-100">
              <Check className="h-4 w-4 text-primary" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
