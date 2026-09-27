import { useState, useCallback } from "react";
import { ToolPanel } from "@/components/studio/ToolPanel";
import { LightingPanel } from "@/components/studio/LightingPanel";
import { BackgroundPanel } from "@/components/studio/BackgroundPanel";
import { CropPanel } from "@/components/studio/CropPanel";
import { PresetPanel } from "@/components/studio/PresetPanel";
import { ExportPanel } from "@/components/studio/ExportPanel";
import { CanvasEditor } from "@/components/studio/CanvasEditor";
import { UploadZone } from "@/components/studio/UploadZone";
import { useImageEditor } from "@/hooks/useImageEditor";
import { useMobileStudio } from "@/hooks/useMobileStudio";
import { type EditorParams, type Tool, DEFAULT_LIGHTING } from "@/lib/image/types";
import { PRESETS, applyPreset } from "@/lib/image/presets";
import { exportCanvas, type ExportOptions, type ExportFormat, type ExportScale } from "@/lib/image/export";
import { type ShadowOptions } from "@/lib/pipeline/shadow";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";

const TOOL_LABELS: Partial<Record<Tool, string>> = {
  clean: "Background Removal",
  relight: "Lighting & Filters",
  background: "Background & Layout",
  crop: "Crop & Shadows",
  styles: "Presets",
  export: "Export",
};

export default function Studio() {
  const {
    stage,
    error,
    activeTool,
    setTool,
    params: editorParams,
    updateParams,
    canUndo,
    canRedo,
    undo,
    redo,
    cutout,
    processed,
    loadFile,
    loadSample,
    renderToCanvas,
  } = useImageEditor();

  const { isMobile } = useMobileStudio();

  const [exportOpts, setExportOpts] = useState<{
    format: ExportFormat;
    quality: number;
    scale: ExportScale;
  }>({ format: "png", quality: 0.9, scale: 2 });
  const [isExporting, setIsExporting] = useState(false);

  const shadow = editorParams.shadow;
  const onShadowChange = useCallback(
    (s: ShadowOptions) => {
      updateParams({ shadow: s }, "change shadow");
    },
    [updateParams],
  );

  const completedTools: Partial<Record<Tool, boolean>> = {
    clean: cutout !== null,
  };

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        await loadFile(file);
      } catch (e) {
        console.error(e);
      }
    },
    [loadFile],
  );

  const handlePresetApply = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      const newParams = applyPreset(editorParams, preset);
      updateParams(newParams as Partial<EditorParams>, `Apply preset: ${preset.label}`);
    },
    [editorParams, updateParams],
  );

  const handleExport = useCallback(async () => {
    const canvas = renderToCanvas();
    if (!canvas) {
      return;
    }

    setIsExporting(true);
    try {
      const opts: ExportOptions = {
        format: exportOpts.format,
        quality: exportOpts.quality,
        scale: exportOpts.scale,
      };
      await exportCanvas(canvas, opts, processed.fileName || "relight-export");
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  }, [renderToCanvas, exportOpts, processed.fileName]);

  const renderSidePanel = () => {
    switch (activeTool) {
      case "relight":
        return (
          <LightingPanel
            params={editorParams}
            onParamsChange={(p) => updateParams(p, "adjust lighting")}
            onReset={() => updateParams({ lighting: { ...DEFAULT_LIGHTING } } as Partial<EditorParams>, "reset lighting")}
          />
        );
      case "background":
        return (
          <BackgroundPanel
            params={editorParams}
            onParamsChange={(p) => updateParams(p, "change background")}
            shadow={shadow}
            onShadowChange={onShadowChange}
          />
        );
      case "crop":
        return <CropPanel params={editorParams} onParamsChange={(p) => updateParams(p, "adjust crop")} />;
      case "styles":
        return <PresetPanel params={editorParams} onPresetApply={handlePresetApply} />;
      case "export":
        return (
          <ExportPanel
            format={exportOpts.format}
            onFormatChange={(f) => setExportOpts({ ...exportOpts, format: f })}
            quality={exportOpts.quality}
            onQualityChange={(q) => setExportOpts({ ...exportOpts, quality: q })}
            scale={exportOpts.scale}
            onScaleChange={(s) => setExportOpts({ ...exportOpts, scale: s })}
            onExport={handleExport}
            isExporting={isExporting}
          />
        );
      default:
        return null;
    }
  };

  if (stage === "empty") {
    return (
      <div className="flex h-screen flex-col">
        <header className="flex h-12 items-center justify-between border-b border-border bg-card px-3">
          <Logo className="h-6 w-auto" />
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-2xl space-y-4">
            <h1 className="text-2xl font-bold">Relight Studio</h1>
            <p className="text-sm text-foreground/60">
              Upload a product photo and we'll remove the background, then you can relight, swap
              backdrops, and export.
            </p>
            <div className="mt-6">
              <UploadZone onUpload={handleUpload} isUploading={false} />
            </div>
            <div className="mt-4 flex justify-center">
              <Button variant="link" onClick={() => loadSample()}>
                Or try a sample image
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex h-12 items-center justify-between border-b border-border bg-card px-3">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setTool("relight")}>
              <Undo2 className="h-4 w-4" />
            </Button>
          )}
          <span className="font-medium">Relight Studio</span>
          {stage === "ready" && <span className="text-xs text-foreground/40">• Image ready</span>}
        </div>
        <div className="flex items-center gap-1">
          {error && <span className="text-xs text-destructive">{error}</span>}
          <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={undo} disabled={!canUndo}>
            Undo
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <nav className="w-12 border-r border-border bg-card">
            <ToolPanel
              activeTool={activeTool}
              onToolChange={setTool}
              hasImage={cutout !== null}
              completedTools={completedTools}
            />
          </nav>
        )}

        <main className="relative flex-1 overflow-hidden bg-muted/20">
          {stage === "processing" && <ProcessingOverlay />}

          {cutout && (
            <CanvasEditor
              cutout={cutout}
              params={editorParams}
              ratioId="4:5"
              beforeUrl={null}
              isMobile={isMobile}
            />
          )}
        </main>

        {!isMobile && (
          <aside className="w-80 border-l border-border bg-card overflow-y-auto">
            {renderSidePanel()}
          </aside>
        )}
      </div>

      {isMobile && (
        <div
          className="fixed inset-y-0 right-0 z-50 w-[80vw] max-w-sm translate-x-0 rounded-l-xl border-l border-border bg-card shadow-xl"
        >
          <div className="h-12 border-b border-border px-3 flex items-center justify-between">
            <span className="text-sm font-medium">{TOOL_LABELS[activeTool] || "Settings"}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setTool("relight")}>
              <Undo2 className="h-3 w-3" />
            </Button>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-3rem)]">{renderSidePanel()}</div>
        </div>
      )}
    </div>
  );
}

function ProcessingOverlay() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-foreground/70">Removing background...</p>
      </div>
    </div>
  );
}
