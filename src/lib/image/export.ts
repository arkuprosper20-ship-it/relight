export type ExportFormat = "png" | "jpg" | "webp";
export type ExportScale = 1 | 2 | 4;

export interface ExportOptions {
  format: ExportFormat;
  quality: number;
  scale: ExportScale;
}

export const EXPORT_FORMATS: ExportFormat[] = ["png", "jpg", "webp"];
export const EXPORT_SCALES: ExportScale[] = [1, 2, 4];

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function exportCanvas(
  canvas: HTMLCanvasElement,
  opts: ExportOptions,
  filename: string = "relight-export",
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = `image/${opts.format}`;
    const quality = opts.format === "png" ? undefined : opts.quality / 100;

    const scale = opts.scale;
    const targetW = Math.round(canvas.width * scale);
    const targetH = Math.round(canvas.height * scale);

    if (scale === 1) {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            triggerDownload(blob, `${filename}.${opts.format}`);
            resolve(blob);
          } else {
            reject(new Error("Export failed"));
          }
        },
        mimeType,
        quality,
      );
      return;
    }

    const scaled = document.createElement("canvas");
    scaled.width = targetW;
    scaled.height = targetH;
    const ctx = scaled.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, targetW, targetH);

    scaled.toBlob(
      (blob) => {
        if (blob) {
          triggerDownload(blob, `${filename}.${opts.format}`);
          resolve(blob);
        } else {
          reject(new Error("Export failed"));
        }
      },
      mimeType,
      quality,
    );
  });
}

export function exportFullQuality(
  canvas: HTMLCanvasElement,
  opts: ExportOptions,
  filename: string = "relight-export",
): Promise<Blob> {
  return exportCanvas(canvas, opts, filename);
}

export function getDefaultExportOptions(): ExportOptions {
  return {
    format: "png",
    quality: 90,
    scale: 1,
  };
}

export function getFormatLabel(format: ExportFormat): string {
  return format.toUpperCase();
}

export function getScaleLabel(scale: ExportScale): string {
  return `${scale}×`;
}
