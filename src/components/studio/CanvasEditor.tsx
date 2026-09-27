import { useEffect, useRef, useState } from "react";
import type { Cutout } from "@/lib/pipeline/segment";
import type { RatioId } from "@/lib/pipeline/banner";
import type { EditorParams } from "@/lib/image/types";
import { getRatio } from "@/lib/pipeline/banner";
import { renderCanvas, poolCanvas } from "@/lib/image/renderer";

export interface CanvasViewState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  viewMode: "fit" | "actual" | "fill";
  compare: boolean;
  comparePos: number;
  showBefore: boolean;
  fullscreen: boolean;
}

export interface CanvasEditorProps {
  cutout: Cutout | null;
  params: EditorParams;
  ratioId: RatioId;
  beforeUrl: string | null;
  onViewChange?: (state: CanvasViewState) => void;
  viewState?: CanvasViewState;
  isMobile: boolean;
  isPanning: boolean;
}

function getInitialViewState(): CanvasViewState {
  return {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    viewMode: "fit",
    compare: false,
    comparePos: 50,
    showBefore: false,
    fullscreen: false,
  };
}

export function CanvasEditor({
  cutout,
  params,
  ratioId,
  beforeUrl,
  onUpdateViewState,
  viewState: externalViewState,
  isMobile,
}: {
  cutout: Cutout | null;
  params: EditorParams;
  ratioId: RatioId;
  beforeUrl: string | null;
  onUpdateViewState?: (fn: (v: CanvasViewState) => CanvasViewState) => void;
  viewState?: CanvasViewState;
  isMobile: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastRenderParams = useRef<{ hash: string } | null>(null);
  const [localView, setLocalView] = useState<CanvasViewState>(getInitialViewState());

  const viewState = externalViewState ?? localView;
  const setViewState = onUpdateViewState
    ? (fn: (v: CanvasViewState) => CanvasViewState) => onUpdateViewState(fn)
    : (fn: (v: CanvasViewState) => CanvasViewState) => setLocalView(fn);

  const fitCanvas = () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height, 1.5);
    setViewState((v) => ({ ...v, zoom: scale, offsetX: (rect.width - canvas.width * scale) / 2, offsetY: (rect.height - canvas.height * scale) / 2, viewMode: "fit" }));
  };

  const resetView = () => {
    setViewState((v) => ({ ...getInitialViewState(), fullscreen: v.fullscreen, compare: v.compare }));
  };

  const setZoom = (zoom: number) => {
    setViewState((v) => ({ ...v, zoom, viewMode: "actual" }));
  };

  const toggleFullscreen = () => {
    setViewState((v) => {
      if (v.fullscreen) {
        document.exitFullscreen?.();
      } else {
        canvasRef.current?.requestFullscreen?.();
      }
      return { ...v, fullscreen: !v.fullscreen };
    });
  };

  const toggleCompare = () => {
    setViewState((v) => ({ ...v, compare: !v.compare, showBefore: false }));
  };

  const setComparePos = (pos: number) => {
    setViewState((v) => ({ ...v, comparePos: Math.max(0, Math.min(100, pos)) }));
  };

  const toggleBefore = (on: boolean) => {
    setViewState((v) => ({ ...v, showBefore: on }));
  };

  useEffect(() => {
    fitCanvas();
    const handleResize = () => fitCanvas();
    window.addEventListener("resize", handleResize);
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setViewState((v) => ({ ...v, fullscreen: false }));
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === " " && (cutout || beforeUrl)) {
        e.preventDefault();
        setViewState((v) => ({ ...v, showBefore: true }));
      }
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === "Escape") {
        if (viewState.fullscreen) {
          e.preventDefault();
          toggleFullscreen();
        }
      }
      if (e.key === "c" && (e.ctrlKey || e.metaKey) && (cutout || beforeUrl)) {
        e.preventDefault();
        toggleCompare();
      }
    };
    const handleKeyup = (e: KeyboardEvent) => {
      if (e.key === " ") {
        setViewState((v) => ({ ...v, showBefore: false }));
      }
    };
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [cutout, beforeUrl, viewState.fullscreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const rCanvas = renderCanvasRef.current;
    if (!cutout || !canvas || !rCanvas) return;

    const ratio = getRatio(ratioId);
    const result = renderCanvas(cutout, params, { width: ratio.w, height: ratio.h });
    renderCanvasRef.current = result.canvas;

    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    if (canvas.width !== result.width || canvas.height !== result.height) {
      canvas.width = result.width;
      canvas.height = result.height;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(result.canvas, 0, 0);

    const fitTimer = setTimeout(() => fitCanvas(), 10);
    return () => {
      clearTimeout(fitTimer);
      poolCanvas(result.canvas);
    };
  }, [cutout, params, ratioId]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-muted/30 touch-none"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{
          transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${viewState.zoom})`,
          transformOrigin: "0 0",
        }}
      />

      {beforeUrl && viewState.compare && (
        <img
          src={beforeUrl}
          alt="Before"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            clipPath: `inset(0 ${100 - viewState.comparePos}% 0 0)`,
            pointerEvents: "none",
          }}
          draggable={false}
        />
      )}

      {beforeUrl && viewState.showBefore && (
        <img
          src={beforeUrl}
          alt="Before"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ pointerEvents: "none", zIndex: 1 }}
          draggable={false}
        />
      )}

      {viewState.showBefore && <BeforeLabel />}
      {!viewState.showBefore && !viewState.compare && <AfterLabel />}

      <CompareHandle
        pos={viewState.comparePos}
        onMove={setComparePos}
        visible={viewState.compare}
      />

      <ViewControls
        viewState={viewState}
        onFit={fitCanvas}
        onReset={resetView}
        onZoom={setZoom}
        onFullscreen={toggleFullscreen}
        onCompare={toggleCompare}
      />
    </div>
  );
}

function BeforeLabel() {
  return (
    <div className="absolute left-3 top-3 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
      BEFORE
    </div>
  );
}

function AfterLabel() {
  return (
    <div className="absolute right-3 top-3 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
      AFTER
    </div>
  );
}

function CompareHandle({
  pos,
  onMove,
  visible,
}: { pos: number; onMove: (pos: number) => void; visible: boolean }) {
  if (!visible) return null;
  const [dragging, setDragging] = useState(false);

  return (
    <>
      <div
        className="absolute inset-0 z-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      <div
        data-compare-handle
        className="absolute inset-y-0 z-20 flex items-center"
        style={{ left: `calc(${pos}% - 1px)` }}
        data-dragging={dragging}
      >
        <div className="h-full w-px bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" />
        <div
          className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10"
          aria-hidden="true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-foreground">
            <path d="M8 7 3 12l5 5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div
          className="absolute inset-y-0 flex cursor-ew-resize"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            setDragging(true);
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!dragging) return;
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            onMove(Math.max(0, Math.min(100, pct)));
          }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        />
      </div>
    </>
  );
}

function ViewControls({
  viewState,
  onFit,
  onReset,
  onZoom,
  onFullscreen,
  onCompare,
}: {
  viewState: CanvasViewState;
  onFit: () => void;
  onReset: () => void;
  onZoom: (z: number) => void;
  onFullscreen: () => void;
  onCompare: () => void;
}) {
  return (
    <div className="absolute bottom-3 right-3 z-10 flex gap-1.5">
      <button
        onClick={onFit}
        className="rounded-lg border border-border/50 bg-card/80 px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-card hover:text-foreground backdrop-blur-sm"
        title="Fit to screen"
      >
        Fit
      </button>
      <button
        onClick={onCompare}
        className="rounded-lg border border-border/50 bg-card/80 px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-card hover:text-foreground backdrop-blur-sm"
        title="Compare (Space to peek)"
      >
        {viewState.compare ? "Single" : "Before/After"}
      </button>
      <button
        onClick={onFullscreen}
        className="rounded-lg border border-border/50 bg-card/80 px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-card hover:text-foreground backdrop-blur-sm"
        title="Fullscreen (F)"
      >
        {viewState.fullscreen ? "Exit" : "Full"}
      </button>
    </div>
  );
}
