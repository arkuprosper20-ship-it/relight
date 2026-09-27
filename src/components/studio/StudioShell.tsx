import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Save, Menu, X } from "lucide-react";
import type { Tool } from "@/lib/image/types";
import { ToolPanel } from "./ToolPanel";

export interface StudioShellProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  completedTools: Partial<Record<Tool, boolean>>;
  hasImage: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  toolLabels: Partial<Record<Tool, string>>;
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  canvas: React.ReactNode;
  isMobile: boolean;
}

export function StudioShell({
  activeTool,
  onToolChange,
  completedTools,
  hasImage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  toolLabels,
  leftPanel,
  rightPanel,
  canvas,
  isMobile,
}: StudioShellProps) {
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [showToolPanel, setShowToolPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) onUndo();
      }
      if (((e.metaKey || e.ctrlKey) && e.key === "y") || ((e.metaKey || e.ctrlKey) && e.key === "Z")) {
        e.preventDefault();
        if (canRedo) onRedo();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  useEffect(() => {
    if (window.innerWidth < 768 && activeTool !== "export") {
      setMobilePanelOpen(true);
    }
  }, [activeTool]);

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex h-12 items-center justify-between border-b border-border bg-card px-3">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowToolPanel(!showToolPanel)}>
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <Logo className="h-6 w-auto" />
          {hasImage && <span className="text-xs text-foreground/60">|</span>}
          {hasImage && <span className="text-xs text-foreground/60">{toolLabels[activeTool] || ""}</span>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={onUndo} disabled={!canUndo} title="Undo (⌘Z)">
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={onRedo} disabled={!canRedo} title="Redo (⌘Y)">
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={onSave} title="Save project">
            <Save className="h-3.5 w-3.5" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {showToolPanel && (
          <nav className="w-12 border-r border-border bg-card">
            <ToolPanel
              activeTool={activeTool}
              onToolChange={(t) => {
                onToolChange(t);
                if (isMobile) setMobilePanelOpen(true);
              }}
              hasImage={hasImage}
              completedTools={completedTools}
            />
          </nav>
        )}

        {canvas}

        {!isMobile && showRightPanel && (
          <aside className="w-80 border-l border-border bg-card overflow-y-auto">
            {leftPanel}
          </aside>
        )}
      </div>

      {isMobile && (
        <>
          {mobilePanelOpen && <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setMobilePanelOpen(false)} />}
          <div
            className="fixed inset-y-0 right-0 z-40 flex max-h-[90vh] w-[85vw] max-w-sm flex-col rounded-l-xl border-l border-border bg-card shadow-xl transition-transform duration-200"
            style={{ transform: mobilePanelOpen ? "translateX(0)" : "translateX(100%)" }}
          >
            <div className="flex h-12 items-center justify-between border-b border-border px-3">
              <span className="text-sm font-medium">{toolLabels[activeTool] || "Settings"}</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setMobilePanelOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="overflow-y-auto">{rightPanel}</div>
          </div>
        </>
      )}
    </div>
  );
}
