import { useCallback, useEffect, useRef, useState } from "react";
import type { Cutout } from "@/lib/pipeline/segment";
import { segmentAsync } from "@/lib/pipeline/segmentClient";
import { aiMatte, matteToCutout } from "@/lib/pipeline/aiMatting";
import { analyzeCutout } from "@/lib/pipeline/styles";
import { renderCanvas } from "@/lib/image/renderer";
import { defaultEditorParams, type EditorParams, type Tool, type Stage } from "@/lib/image/types";
import { validateImageFile, type ValidationResult } from "@/lib/image/validation";
import { useHistory } from "./useHistory";
import { getRatio, type RatioId } from "@/lib/pipeline/banner";
import { DEFAULT_SHADOW } from "@/lib/pipeline/shadow";

export interface ProcessedState {
  cutout: Cutout | null;
  originalBitmap: ImageBitmap | null;
  originalData: { data: Uint8ClampedArray; width: number; height: number } | null;
  fileName: string | null;
  analysis: ReturnType<typeof analyzeCutout> | null;
  edgeWarning: boolean;
  fitWarning: boolean;
}

export type InitResult =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "timeout" }
  | { status: "error"; message: string };

const MAX_SIDE = 1400;
const INIT_TIMEOUT_MS = 8000;

export function useImageEditor() {
  const [stage, setStage] = useState<Stage>("empty");
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("relight");
  const [ratioId, setRatioId] = useState<RatioId>("4:5");

  const [cutout, setCutout] = useState<Cutout | null>(null);
  const processedRef = useRef<ProcessedState>({
    cutout: null,
    originalBitmap: null,
    originalData: null,
    fileName: null,
    analysis: null,
    edgeWarning: false,
    fitWarning: false,
  });

  const initTimerRef = useRef<number>(0);
  const [initResult, setInitResult] = useState<InitResult>({ status: "ready" });

  const { current: params, push, undo, redo, reset, canUndo, canRedo, batchUpdate } = useHistory(defaultEditorParams());

  const [paramsState, setParamsState] = useState(params);

  useEffect(() => {
    setParamsState(params);
  }, [params]);

  const updateParams = useCallback(
    (patch: Partial<EditorParams>, label: string) => {
      batchUpdate((draft) => {
        Object.assign(draft, patch);
      }, label);
    },
    [batchUpdate],
  );

  const setErrorState = useCallback((msg: string) => {
    setError(msg);
    setStage("error");
  }, []);

  const handleValidationError = useCallback((result: ValidationResult) => {
    if (!result.ok) {
      setErrorState(result.error);
    }
    return result;
  }, [setErrorState]);

  const processImageBitmap = useCallback(
    async (bitmap: ImageBitmap, fileName: string) => {
      setInitResult({ status: "loading" });
      setStage("processing");
      setError(null);
      const timeout = window.setTimeout(() => {
        setInitResult({ status: "timeout" });
      }, INIT_TIMEOUT_MS);

      try {
        let w = bitmap.width;
        let h = bitmap.height;
        const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
        if (scale < 1) {
          w = Math.max(1, Math.round(w * scale));
          h = Math.max(1, Math.round(h * scale));
        }

        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(bitmap, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;

        const source = { data, width: w, height: h };
        processedRef.current = {
          ...processedRef.current,
          originalBitmap: bitmap,
          originalData: source,
          fileName,
          edgeWarning: false,
          fitWarning: false,
        };

        clearTimeout(timeout);
        setInitResult({ status: "ready" });

        await runSegmentation(source, fileName);
      } catch (err) {
        clearTimeout(timeout);
        console.error(err);
        setInitResult({ status: "ready" });
        setErrorState("We couldn't process this image. Try another image.");
      }
    },
    [setErrorState],
  );

  const runSegmentation = useCallback(
    async (source: { data: Uint8ClampedArray; width: number; height: number }, fileName: string) => {
      try {
        const cutout = await segmentAsync({
          rgba: source.data,
          width: source.width,
          height: source.height,
          tolerance: 26,
        });

        processedRef.current.cutout = cutout;
        setCutout(cutout);

        try {
          const analysis = analyzeCutout(cutout);
          processedRef.current.analysis = analysis;
        } catch {
          processedRef.current.analysis = null;
        }

        const { box } = cutout;
        processedRef.current.edgeWarning = cutout.touchedEdges.size > 0;
        const coversAll = box.w > source.width * 0.97 && box.h > source.height * 0.97;
        processedRef.current.fitWarning = coversAll;

        reset(defaultEditorParams());
        setStage(coversAll ? "error" : "ready");
        setError(null);
      } catch (err) {
        console.error(err);
        setErrorState("We couldn't isolate a product in that photo. Try a photo where the product stands out from the background.");
      }
    },
    [reset, setErrorState],
  );

  const loadFile = useCallback(
    async (file: File) => {
      const result = validateImageFile(file);
      if (!result.ok) {
        handleValidationError(result);
        return;
      }
      try {
        const bitmap = await createImageBitmap(result.file);
        await processImageBitmap(bitmap, result.file.name);
      } catch (err) {
        console.error(err);
        setErrorState("That image format isn't supported.");
      }
    },
    [processImageBitmap, handleValidationError, setErrorState],
  );

  const loadSample = useCallback(async () => {
    try {
      const { getDemoBefore } = await import("@/lib/pipeline/demo");
      const url = getDemoBefore();
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("sample failed"));
        img.src = url;
      });
      const cv = document.createElement("canvas");
      cv.width = img.naturalWidth;
      cv.height = img.naturalHeight;
      const ctx = cv.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
      const source = { data, width: cv.width, height: cv.height };
      processedRef.current = {
        ...processedRef.current,
        originalBitmap: null,
        originalData: source,
        fileName: "sample-mug.jpg",
      };
      setInitResult({ status: "loading" });
      const timeout = window.setTimeout(() => {
        setInitResult({ status: "timeout" });
      }, INIT_TIMEOUT_MS);
      setStage("processing");
      clearTimeout(timeout);
      setInitResult({ status: "ready" });
      await runSegmentation(source, "sample-mug.jpg");
    } catch (err) {
      console.error(err);
      setInitResult({ status: "ready" });
      setErrorState("The sample image could not be loaded.");
    }
  }, [runSegmentation, setErrorState]);

  const retry = useCallback(() => {
    const src = processedRef.current.originalData;
    if (!src) {
      setErrorState("No image to retry.");
      return;
    }
    runSegmentation(src, processedRef.current.fileName || "photo");
  }, [runSegmentation, setErrorState]);

  const resetEditor = useCallback(() => {
    if (stage !== "empty" && stage !== "ready" && stage !== "error") return;

    processedRef.current = {
      cutout: null,
      originalBitmap: null,
      originalData: null,
      fileName: null,
      analysis: null,
      edgeWarning: false,
      fitWarning: false,
    };

    const canvasRef = processedRef.current;
    if (canvasRef && processedRef.current.originalBitmap) {
      processedRef.current.originalBitmap.close?.();
    }

    reset(defaultEditorParams());
    setCutout(null);
    setStage("empty");
    setError(null);
    setRatioId("4:5");
    setActiveTool("relight");
  }, [stage, reset]);

  const setTolerance = useCallback(
    async (tolerance: number) => {
      const src = processedRef.current.originalData;
      if (!src) return;
      setStage("processing");
      try {
        const cutout = await segmentAsync({
          rgba: src.data,
          width: src.width,
          height: src.height,
          tolerance,
        });
        processedRef.current.cutout = cutout;
        setCutout(cutout);
        const analysis = analyzeCutout(cutout);
        processedRef.current.analysis = analysis;
        setStage("ready");
        setError(null);
      } catch (err) {
        console.error(err);
        setErrorState("Segmentation failed. Try adjusting the tolerance.");
      }
    },
    [setErrorState],
  );

  const setTool = useCallback((tool: Tool) => {
    setActiveTool(tool);
  }, []);

  const renderToCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!cutout) return null;
    const ratio = getRatio(ratioId);
    const result = renderCanvas(cutout, paramsState, { width: ratio.w, height: ratio.h });
    return result.canvas;
  }, [cutout, paramsState, ratioId]);

  const exportCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!cutout) return null;
    const ratio = getRatio(ratioId);
    const result = renderCanvas(cutout, paramsState, { width: ratio.w, height: ratio.h });
    return result.canvas;
  }, [cutout, paramsState, ratioId]);

  return {
    stage,
    error,
    activeTool,
    setTool,
    params: paramsState,
    updateParams,
    canUndo,
    canRedo,
    undo,
    redo,
    resetEditor,
    ratioId,
    setRatioId,
    cutout,
    processed: processedRef.current,
    loadFile,
    loadSample,
    retry,
    setTolerance,
    renderToCanvas,
    exportCanvas,
    initResult,
    initRetry: () => {},
  };
}

export const TOOLS: Array<{ id: Tool; label: string; icon: string }> = [
  { id: "clean", label: "Clean", icon: "clean" },
  { id: "relight", label: "Relight", icon: "relight" },
  { id: "background", label: "Background", icon: "background" },
  { id: "crop", label: "Crop", icon: "crop" },
  { id: "compare", label: "Compare", icon: "compare" },
];
