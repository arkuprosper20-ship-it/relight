interface PreferenceData {
  theme: "light" | "dark";
  lastExportFormat: string;
  lastExportQuality: number;
  lastExportScale: number;
  lastCropRatio: string;
  historyDepth: number;
}

const DEFAULTS: PreferenceData = {
  theme: "light",
  lastExportFormat: "png",
  lastExportQuality: 90,
  lastExportScale: 1,
  lastCropRatio: "4:5",
  historyDepth: 50,
};

export class PreferenceStore {
  static readonly KEY = "relight-preferences";
  private data: PreferenceData;

  constructor() {
    this.data = { ...DEFAULTS, ...this.load() };
  }

  private load(): Partial<PreferenceData> {
    try {
      const raw = localStorage.getItem(PreferenceStore.KEY);
      if (raw) return JSON.parse(raw) as Partial<PreferenceData>;
    } catch {
    }
    return {};
  }

  private save(): void {
    try {
      localStorage.setItem(PreferenceStore.KEY, JSON.stringify(this.data));
    } catch {
    }
  }

  get<K extends keyof PreferenceData>(key: K): PreferenceData[K] {
    return this.data[key];
  }

  set<K extends keyof PreferenceData>(key: K, value: PreferenceData[K]): void {
    this.data[key] = value;
    this.save();
  }

  getAll(): PreferenceData {
    return { ...this.data };
  }

  reset(): void {
    this.data = { ...DEFAULTS };
    this.save();
  }
}

export const preferences = new PreferenceStore();

export interface ProjectData {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  params: string;
  fileName: string | null;
}

const PROJECTS_KEY = "relight-projects";

export function saveProject(data: ProjectData): void {
  try {
    const existing = listProjects();
    const idx = existing.findIndex((p) => p.id === data.id);
    if (idx >= 0) {
      existing[idx] = data;
    } else {
      existing.unshift(data);
    }
    if (existing.length > 20) existing.pop();
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(existing));
  } catch {
  }
}

export function listProjects(): ProjectData[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (raw) return JSON.parse(raw) as ProjectData[];
  } catch {
  }
  return [];
}

export function clearOldSessions(): void {
  try {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const existing = listProjects();
    const filtered = existing.filter((p) => p.updatedAt > cutoff);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
  } catch {
  }
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(PROJECTS_KEY);
    localStorage.removeItem(PreferenceStore.KEY);
    localStorage.removeItem("relight-theme");
  } catch {
  }
  try {
    indexedDB?.deleteDatabase("relight-storage");
  } catch {
  }
}
