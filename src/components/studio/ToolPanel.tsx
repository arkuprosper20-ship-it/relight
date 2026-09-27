import { Check, Contrast, Crop, Export, Grid3x3, ImageIcon, Lightbulb, Palette, Scissors, Sparkles, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/image/types";

export interface ToolPanelProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  hasImage: boolean;
  completedTools: Partial<Record<Tool, boolean>>;
}

const toolSections = [
  {
    tools: [
      { id: "clean" as const, label: "Clean", icon: Scissors, desc: "Remove background" },
      { id: "relight" as const, label: "Relight", icon: Lightbulb, desc: "Lighting & shadows" },
      { id: "background" as const, label: "Background", icon: Grid3x3, desc: "Backdrop & layout" },
      { id: "crop" as const, label: "Crop", icon: Crop, desc: "Frame & composition" },
    ],
  },
  {
    tools: [
      { id: "styles" as const, label: "Styles", icon: Palette, desc: "Presets & styles" },
      { id: "upscale" as const, label: "Upscale", icon: Sparkles, desc: "Increase resolution" },
      { id: "text" as const, label: "Text", icon: Type, desc: "Add text overlay" },
      { id: "export" as const, label: "Export", icon: Export, desc: "Download your image" },
    ],
  },
] as const;

export function ToolPanel({ activeTool, onToolChange, hasImage, completedTools }: ToolPanelProps) {
  const allTools = [...toolSections[0].tools, ...toolSections[1].tools];

  return (
    <div className="flex flex-col gap-1.5 px-2 py-3">
      {allTools.map((tool) => {
        const Icon = tool.icon;
        const isDone = completedTools[tool.id];
        const isLocked = !hasImage && tool.id !== "clean";
        return (
          <button
            key={tool.id}
            onClick={() => !isLocked && onToolChange(tool.id)}
            disabled={isLocked}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
              activeTool === tool.id
                ? "bg-primary/15 text-primary"
                : "text-foreground/70 hover:bg-muted hover:text-foreground",
              isDone && activeTool !== tool.id && "text-green-500",
              isLocked && "opacity-40",
            )}
            title={tool.desc}
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{tool.label}</span>
            {isDone && activeTool !== tool.id && (
              <Check className="absolute right-2 h-3.5 w-3.5 text-green-500" />
            )}
            {activeTool === tool.id && (
              <div className="absolute right-0 top-0 h-full w-0.5 bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
