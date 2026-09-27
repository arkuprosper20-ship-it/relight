import { useCallback, useState } from "react";
import { HistoryManager, type HistoryAction, applyHistoryAction } from "@/lib/image/history";
import type { EditorParams, FilterParams } from "@/lib/image/types";

export function useHistory(initial: EditorParams) {
  const [history, setHistory] = useState(() => new HistoryManager(initial));
  const [current, setCurrent] = useState<EditorParams>(initial);

  const push = useCallback((newState: EditorParams, label: string) => {
    setHistory((h) => {
      const next = new HistoryManager(h.current);
      next.push(newState, label);
      return next;
    });
    setCurrent(newState);
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.canUndo) return h;
      const next = new HistoryManager(h.current);
      const prev = next.undo();
      if (prev) {
        setCurrent(prev);
      }
      return next;
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (!h.canRedo) return h;
      const next = new HistoryManager(h.current);
      const restored = next.redo();
      if (restored) {
        setCurrent(restored);
      }
      return next;
    });
  }, []);

  const reset = useCallback((newState: EditorParams) => {
    const next = new HistoryManager(newState);
    setHistory(next);
    setCurrent(newState);
  }, []);

  const applyAction = useCallback(
    (action: HistoryAction, label: string) => {
      const next = applyHistoryAction(current, action);
      push(next, label);
    },
    [current, push],
  );

  const batchUpdate = useCallback(
    (updater: (draft: EditorParams) => void, label: string) => {
      const draft = {
        filters: { ...current.filters },
        background: { ...current.background },
        crop: { ...current.crop },
        lighting: { ...current.lighting },
        shadow: { ...current.shadow },
        shadowOn: current.shadowOn,
      };
      updater(draft);
      push(draft, label);
    },
    [current, push],
  );

  return {
    current,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    push,
    undo,
    redo,
    reset,
    applyAction,
    batchUpdate,
  };
}
