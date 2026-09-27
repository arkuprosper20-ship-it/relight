import { useEffect } from "react";
import { ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/image/types";

export interface MobileToolSheetProps {
  activeTool: Tool;
  openTool: Tool | null;
  onOpenTool: (tool: Tool | null) => void;
  toolLabels: Partial<Record<Tool, string>>;
}

export function MobileToolSheet({
  activeTool,
  openTool,
  onOpenTool,
  toolLabels,
}: MobileToolSheetProps) {
  useEffect(() => {
    if (!openTool) return;
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenTool(null);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [openTool, onOpenTool]);

  if (!openTool) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => onOpenTool(null)} />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[70vh] flex-col gap-3 rounded-t-xl border-t border-border bg-popover p-4 shadow-lg",
          "animate-in slide-in-from-bottom duration-200",
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{toolLabels[openTool] || openTool}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenTool(null)}
              className="rounded-md p-1 text-foreground/50 hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <ChevronUp className="h-4 w-4 text-foreground/30" />
          </div>
        </div>
      </div>
    </>
  );
}
