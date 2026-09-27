export type ValidationResult =
  | { ok: true; file: File }
  | { ok: false; error: string };

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_DIMENSION = 6000;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export function validateImageFile(file: File): ValidationResult {
  if (!file) {
    return { ok: false, error: "No file selected." };
  }

  const ext = getFileExtension(file.name);
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return { ok: false, error: `That image format isn't supported. Use JPG, PNG, or WEBP.` };
  }

  if (!ACCEPTED_TYPES.includes(file.type) && file.type !== "") {
    return { ok: false, error: `That image format isn't supported. Use JPG, PNG, or WEBP.` };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: `That file is too large. Maximum size is 20 MB.` };
  }

  return { ok: true, file };
}

export async function validateImageDimensions(file: File): Promise<ValidationResult> {
  const res = validateImageFile(file);
  if (!res.ok) return res;

  try {
    const img = await loadImageFromFile(res.file);
    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
      return { ok: false, error: "That image appears to be corrupted." };
    }
    if (img.naturalWidth > MAX_DIMENSION || img.naturalHeight > MAX_DIMENSION) {
      return {
        ok: false,
        error: `Image is too large (${img.naturalWidth}×${img.naturalHeight}). Maximum dimension is ${MAX_DIMENSION}.`,
      };
    }
    return { ok: true, file };
  } catch {
    return { ok: false, error: "We couldn't read that image. Try another photo." };
  }
}

export function validateDropFiles(files: FileList | File[]): { valid: File[]; errors: string[] } {
  const valid: File[] = [];
  const errors: string[] = [];

  for (const file of Array.from(files)) {
    const res = validateImageFile(file);
    if (res.ok) {
      valid.push(res.file);
    } else {
      errors.push(`${file.name}: ${res.error}`);
    }
  }

  return { valid, errors };
}

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

export function createBitmapFromFile(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

export function canCaptureCamera(): boolean {
  return typeof navigator !== "undefined" && "mediaDevices" in navigator && "getMediaDevices" in navigator || typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

export async function captureFromCamera(): Promise<File | null> {
  if (!canCaptureCamera()) return null;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    const video = document.createElement("video");
    video.srcObject = stream;
    await video.play();
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    stream.getTracks().forEach((t) => t.stop());
    if (!blob) return null;
    return new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
  } catch {
    return null;
  }
}
