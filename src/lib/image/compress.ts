// Client-side image downscaling. Phone cameras produce 3–8MB photos; shipping
// those raw would blow past the serverless request body limit and bloat the
// storefront. Re-encoding in the browser keeps uploads well under 1MB.
const MAX_DIMENSION = 1600;
const QUALITY = 0.82;
/** Below this a photo is already small enough that re-encoding only loses detail. */
const SKIP_BELOW_BYTES = 600 * 1024;

let webpEncodable: boolean | undefined;

/** Safari only gained canvas WebP encoding in 14; fall back to JPEG below that. */
function canEncodeWebp(): boolean {
  if (webpEncodable === undefined) {
    const probe = document.createElement("canvas");
    probe.width = probe.height = 1;
    webpEncodable = probe.toDataURL("image/webp").startsWith("data:image/webp");
  }
  return webpEncodable;
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Older Safari rejects some sources here; the <img> path still handles them.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error("Зургийн формат дэмжигдэхгүй байна."));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sizeOf(source: ImageBitmap | HTMLImageElement) {
  return source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };
}

function renamed(name: string, type: string) {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${type === "image/webp" ? "webp" : "jpg"}`;
}

/**
 * Shrink `file` to at most MAX_DIMENSION on its long edge. Returns the original
 * untouched when it is already small, or when re-encoding would not help.
 */
export async function compressImage(file: File): Promise<File> {
  // Animated GIFs would be flattened to a single frame by the canvas.
  if (file.type === "image/gif") return file;

  const source = await decode(file);
  const { width, height } = sizeOf(source);
  if (!width || !height) throw new Error("Зургийг уншиж чадсангүй.");

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  if (scale === 1 && file.size <= SKIP_BELOW_BYTES) {
    if ("close" in source) source.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Зургийг боловсруулж чадсангүй.");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();

  // WebP keeps transparency, which matters for cut-out product shots.
  const type = canEncodeWebp() ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, QUALITY),
  );

  if (!blob || blob.size >= file.size) return file;
  return new File([blob], renamed(file.name, type), { type });
}
