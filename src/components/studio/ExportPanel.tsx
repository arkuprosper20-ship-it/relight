import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Maximize2 } from "lucide-react";
import type { ExportFormat, ExportScale } from "@/lib/image/types";
import { EXPORT_FORMATS, EXPORT_SCALES } from "@/lib/image/types";

export interface ExportPanelProps {
  format: ExportFormat;
  onFormatChange: (f: ExportFormat) => void;
  quality: number;
  onQualityChange: (q: number) => void;
  scale: ExportScale;
  onScaleChange: (s: ExportScale) => void;
  onExport: () => Promise<void>;
  isExporting: boolean;
}

export function ExportPanel({
  format,
  onFormatChange,
  quality,
  onQualityChange,
  scale,
  onScaleChange,
  onExport,
  isExporting,
}: ExportPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-semibold">Export</h3>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Format</Label>
          <Select value={format} onValueChange={(v) => onFormatChange(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPORT_FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {format !== "png" && (
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Quality</Label>
              <Badge variant="outline" className="text-xs">{quality * 100}%</Badge>
            </div>
            <input
              type="range"
              min={60}
              max={100}
              step={5}
              value={quality * 100}
              onChange={(e) => onQualityChange(Number(e.target.value) / 100)}
              className="w-full"
            />
          </div>
        )}

        <div>
          <Label className="text-xs">Resolution</Label>
          <div className="flex gap-2">
            {EXPORT_SCALES.map((s) => (
              <Button
                key={s}
                variant={scale === s ? "default" : "outline"}
                size="sm"
                onClick={() => onScaleChange(s)}
                className="flex-1 gap-1"
              >
                <Maximize2 className="h-3 w-3" />
                {s === 1 ? "1x" : s === 2 ? "2x" : "4x"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Button
        variant="default"
        size="lg"
        className="w-full gap-2"
        onClick={onExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Export Image
          </>
        )}
      </Button>
    </div>
  );
}
