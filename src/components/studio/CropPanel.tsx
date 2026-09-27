import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RotateCw, FlipHorizontal, Grid3x3 } from "lucide-react";
import type { EditorParams } from "@/lib/image/types";

export interface CropPanelProps {
  params: EditorParams;
  onParamsChange: (params: Partial<EditorParams>) => void;
}

export function CropPanel({ params, onParamsChange }: CropPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-semibold">Crop & Composition</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-xs">
            <Grid3x3 className="h-3.5 w-3.5" />
            Shadow
          </Label>
          <Switch
            checked={params.shadowOn}
            onCheckedChange={(v) => onParamsChange({ shadowOn: v })}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => onParamsChange({ shadow: { ...params.shadow, direction: 55 } })}
        >
          <RotateCw className="h-3.5 w-3.5" />
          Reset Shadow Direction
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => onParamsChange({ crop: { ...params.crop, flipX: !params.crop.flipX } })}
        >
          <FlipHorizontal className="h-3.5 w-3.5" />
          Flip Horizontal
        </Button>

        <div>
          <Label className="text-xs">Shadow Intensity</Label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={params.shadow.opacity * 100}
            onChange={(e) => onParamsChange({ shadow: { ...params.shadow, opacity: Number(e.target.value) / 100 } })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-foreground/40">
            <span>0%</span>
            <span>{params.shadow.opacity * 100}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
