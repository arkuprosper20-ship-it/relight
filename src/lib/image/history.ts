import type { EditorParams } from "./types";

export type HistoryAction =
  | { type: "filter"; filter: Partial<EditorParams["filters"]> }
  | { type: "lighting"; lighting: Partial<EditorParams["lighting"]> }
  | { type: "background"; background: Partial<EditorParams["background"]> }
  | { type: "shadow"; shadow: Partial<EditorParams["shadow"]> & { shadowOn?: boolean } }
  | { type: "crop"; crop: Partial<EditorParams["crop"]> }
  | { type: "reset" }
  | { type: "snapshot"; label: string };

export class HistoryManager {
  private entries: EditorParams[] = [];
  private pointer: number = -1;
  private maxSize: number = 50;

  constructor(initial: EditorParams) {
    this.entries = [this.clone(initial)];
    this.pointer = 0;
  }

  private clone(state: EditorParams): EditorParams {
    return {
      filters: { ...state.filters },
      background: { ...state.background },
      crop: { ...state.crop },
      lighting: { ...state.lighting },
      shadow: { ...state.shadow },
      shadowOn: state.shadowOn,
    };
  }

  get canUndo(): boolean {
    return this.pointer > 0;
  }

  get canRedo(): boolean {
    return this.pointer < this.entries.length - 1;
  }

  get current(): EditorParams {
    return this.entries[this.pointer];
  }

  push(newState: EditorParams, label: string): void {
    const cloned = this.clone(newState);
    this.pointer++;
    if (this.pointer < this.entries.length) {
      this.entries.splice(this.pointer);
    }
    this.entries.push(cloned);
    if (this.entries.length > this.maxSize) {
      this.entries.shift();
      this.pointer--;
    }
  }

  undo(): EditorParams | null {
    if (!this.canUndo) return null;
    this.pointer--;
    return this.clone(this.entries[this.pointer]);
  }

  redo(): EditorParams | null {
    if (!this.canRedo) return null;
    this.pointer++;
    return this.clone(this.entries[this.pointer]);
  }

  reset(newState: EditorParams): void {
    this.entries = [this.clone(newState)];
    this.pointer = 0;
  }

  getHistory(): EditorParams[] {
    return this.entries.map((e) => this.clone(e));
  }

  clear(): void {
    this.entries = [];
    this.pointer = -1;
  }
}

export function applyHistoryAction(state: EditorParams, action: HistoryAction): EditorParams {
  const next: EditorParams = {
    filters: { ...state.filters },
    background: { ...state.background },
    crop: { ...state.crop },
    lighting: { ...state.lighting },
    shadow: { ...state.shadow },
    shadowOn: state.shadowOn,
  };

  switch (action.type) {
    case "filter":
      Object.assign(next.filters, action.filter);
      break;
    case "lighting":
      Object.assign(next.lighting, action.lighting);
      break;
    case "background":
      Object.assign(next.background, action.background);
      break;
    case "shadow":
      if (action.shadow.shadowOn !== undefined) next.shadowOn = action.shadow.shadowOn;
      Object.assign(next.shadow, {
        direction: action.shadow.direction ?? next.shadow.direction,
        length: action.shadow.length ?? next.shadow.length,
        softness: action.shadow.softness ?? next.shadow.softness,
        opacity: action.shadow.opacity ?? next.shadow.opacity,
        contact: action.shadow.contact ?? next.shadow.contact,
      });
      break;
    case "crop":
      Object.assign(next.crop, action.crop);
      break;
    case "reset":
      break;
    case "snapshot":
      break;
  }

  return next;
}
