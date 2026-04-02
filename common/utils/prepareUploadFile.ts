/**
 * Prepares picked files for upload: compresses large images toward a target size
 * and enforces a hard ceiling under typical nginx `client_max_body_size` (≈5 MB).
 * PDFs are not re-encoded (no lightweight option in-app); oversized PDFs are rejected.
 */
import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

/** Aim ~3 MB for memory / transfer; not a hard failure threshold. */
export const UPLOAD_TARGET_MAX_BYTES = 3 * 1024 * 1024;

/** Stay below nginx 5m (5×1024²) with margin for multipart overhead. */
export const UPLOAD_HARD_MAX_BYTES = 5 * 1024 * 1024 - 200 * 1024;

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isLikelyImage(mime?: string, name?: string): boolean {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(name || "");
}

function isLikelyPdf(mime?: string, name?: string): boolean {
  const m = (mime || "").toLowerCase();
  if (m.includes("pdf")) return true;
  return /\.pdf$/i.test(name || "");
}

async function getFileSize(uri: string): Promise<number | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || typeof info.size !== "number") return null;
    return info.size;
  } catch {
    return null;
  }
}

export type UploadableFile = {
  uri: string;
  name: string;
  mimeType?: string;
};

/**
 * Returns a file URI/name/mime suitable for FormData upload.
 * @throws Error with user-facing message if file cannot be made small enough (PDF too large, etc.)
 */
export async function prepareFileForUpload(file: UploadableFile): Promise<{
  uri: string;
  name: string;
  mimeType: string;
}> {
  const { uri, name, mimeType } = file;
  const size = await getFileSize(uri);

  if (isLikelyPdf(mimeType, name)) {
    if (size != null && size > UPLOAD_HARD_MAX_BYTES) {
      throw new Error(
        `This PDF is too large (${formatMb(size)}). Please use a file under ${formatMb(
          UPLOAD_HARD_MAX_BYTES,
        )} (for example export “reduced size” from your PDF app).`,
      );
    }
    return { uri, name, mimeType: mimeType || "application/pdf" };
  }

  if (!isLikelyImage(mimeType, name)) {
    if (size != null && size > UPLOAD_HARD_MAX_BYTES) {
      throw new Error(
        `This file is too large (${formatMb(size)}). Maximum is about ${formatMb(UPLOAD_HARD_MAX_BYTES)}.`,
      );
    }
    return { uri, name, mimeType: mimeType || "application/octet-stream" };
  }

  if (size != null && size <= UPLOAD_TARGET_MAX_BYTES) {
    return { uri, name, mimeType: mimeType || "image/jpeg" };
  }

  let workingUri = uri;
  let maxWidth = 2048;
  let quality = 0.82;
  const baseName = name.replace(/\.[^/.]+$/, "") || "document";

  for (let round = 0; round < 14; round++) {
    const actions =
      maxWidth >= 480 ? [{ resize: { width: maxWidth } } as const] : [];

    const result = await manipulateAsync(workingUri, actions, {
      compress: quality,
      format: SaveFormat.JPEG,
    });

    if (workingUri !== uri) {
      await FileSystem.deleteAsync(workingUri, { idempotent: true }).catch(() => {});
    }
    workingUri = result.uri;

    const newSize = await getFileSize(workingUri);
    if (newSize != null && newSize <= UPLOAD_TARGET_MAX_BYTES) {
      return { uri: workingUri, name: `${baseName}.jpg`, mimeType: "image/jpeg" };
    }
    if (newSize != null && newSize <= UPLOAD_HARD_MAX_BYTES && round >= 3) {
      return { uri: workingUri, name: `${baseName}.jpg`, mimeType: "image/jpeg" };
    }

    if (maxWidth > 640) {
      maxWidth = Math.round(maxWidth * 0.82);
    } else {
      quality = Math.max(0.32, quality - 0.07);
    }
  }

  const finalSize = await getFileSize(workingUri);
  if (finalSize != null && finalSize > UPLOAD_HARD_MAX_BYTES) {
    throw new Error(
      `Could not compress the image below ${formatMb(UPLOAD_HARD_MAX_BYTES)}. Try a smaller photo or a lower-resolution scan.`,
    );
  }

  return { uri: workingUri, name: `${baseName}.jpg`, mimeType: "image/jpeg" };
}
