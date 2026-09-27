import { useCallback, useEffect, useRef, useState } from "react";
import type { Cutout } from "@/lib/pipeline/segment";
import {
  RATIOS,
  type RatioId,
  getRatio,
} from "@/lib/pipeline/banner";
import type { EditorParams } from "@/lib/image/types";
import { renderCanvas, renderPreview, poolCanvas } from "@/lib/image/renderer";

export type ViewMode = "fit" | "actual" | "fill";

export interface CanvasViewState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  viewMode: ViewMode;
  compare: boolean;
  comparePos: number;
  showBefore: boolean;
  fullscreen: boolean;
}

export function useCanvas(initialRatio: RatioId = "4:5") {
  const [viewState, setViewState] = useState<CanvasViewState>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    viewMode: "fit",
    compare: false,
    comparePos: 50,
    showBefore: false,
    fullscreen: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  const [renderResult, setRenderResult] = useState<{
    canvas: HTMLCanvasElement | null;
    width: number;
    height: number;
  }>({ canvas: null, width: 0, height: 0 });

  const render = useCallback(
    (cutout: Cutout | null, params: EditorParams, ratioId: RatioId) => {
      if (!cutout || !canvasRef.current) return;

      const ratio = getRatio(ratioId);
      const result = renderCanvas(cutout, params, { width: ratio.w, height: ratio.h });
      setRenderResult({ canvas: result.canvas, width: result.width, height: result.height });

      const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true })!;
      canvasRef.current.width = result.width;
      canvasRef.current.height = result.height;
      ctx.clearRect(0, 0, result.width, result.height);
      ctx.drawImage(result.canvas, 0, 0);
    },
    [],
  );

  const fitCanvas = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height, 1);
    setViewState((v) => ({
      ...v,
      zoom: scale,
      offsetX: (rect.width - canvas.width * scale) / 2,
      offsetY: (rect.height - canvas.height * scale) / 2,
      viewMode: "fit",
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setViewState((v) => ({ ...v, zoom, viewMode: "actual" }));
  }, []);

  const resetView = useCallback(() => {
    setViewState((v) => ({
      ...v,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      viewMode: "fit",
    }));
  }, []);

  const enterFullscreen = useCallback(() => {
    setViewState((v) => ({ ...v, fullscreen: true }));
    const canvas = canvasRef.current;
    if (canvas?.requestFullscreen) {
      canvas.requestFullscreen().catch(() => {});
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    setViewState((v) => ({ ...v, fullscreen: false }));
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const toggleCompare = useCallback(() => {
    setViewState((v) => ({ ...v, compare: !v.compare }));
  }, []);

  const setComparePos = useCallback((pos: number) => {
    setViewState((v) => ({ ...v, comparePos: Math.max(0, Math.min(100, pos)) }));
  }, []);

  const toggleBefore = useCallback((show: boolean) => {
    setViewState((v) => ({ ...v, showBefore: show }));
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setViewState((v) => ({ ...v, showBefore: true }));
      }
      if (e.key === "Escape" && viewState.fullscreen) {
        e.preventDefault();
        exitFullscreen();
      }
      if (e.key === "f" || e.key === "F") {
        const isMod = e.ctrlKey || e.metaKey;
        if (isMod) {
          e.preventDefault();
          if (viewState.fullscreen) exitFullscreen();
          else enterFullscreen();
        }
      }
    };
    const handleKeyup = (e: KeyboardEvent) => {
      if (e.key === " ") {
        setViewState((v) => ({ ...v, showBefore: false }));
      }
    };
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) {
        setViewState((v) => ({ ...v, fullscreen: false }));
      }
    });
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [viewState.fullscreen, enterFullscreen, exitFullscreen]);

  useEffect(() => {
    return () => {
      if (renderResult.canvas) {
        poolCanvas(renderResult.canvas);
      }
    };
  }, [renderResult.canvas]);

  const canvasStyle: React.CSSProperties = {
    transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${viewState.zoom})`,
    transformOrigin: "0 0",
    maxWidth: "100%",
    height: "auto",
  };

  return {
    containerRef,
    canvasRef,
    viewState,
    setViewState,
    render,
    fitCanvas,
    setZoom,
    resetView,
    enterFullscreen,
    exitFullscreen,
    toggleCompare,
    setComparePos,
    toggleBefore,
    canvasStyle,
    renderResult,
  };
}

export function usePreviewImage(cutout: Cutout | null, params: EditorParams, ratioId: RatioId) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!cutout) {
      setPreviewUrl(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    const ratio = getRatio(ratioId);

    const raf = requestAnimationFrame(() => {
      try {
        const result = renderPreview(cutout, params, { width: ratio.w, height: ratio.h }, 640);
        if (!cancelled) {
          const url = result.canvas.toDataURL("image/jpeg", 0.85);
          setPreviewUrl(url);
          setIsLoading(false);
          poolCanvas(result.canvas);
        }
      } catch (err) {
        if (!cancelled) setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [cutout, params, ratioId]);

  return { previewUrl, isLoading };
}

export const RATIO_OPTIONS: Array<{ id: RatioId; label: string; hint: string }> = [
  { id: "4:5", label: "4:5", hint: "Vinted / Depop / IG feed" },
  { id: "1:1", label: "1:1", hint: "Square listing" },
  { id: "16:9", label: "16:9", hint: "Shop banner" },
];
export { RATIOS };
