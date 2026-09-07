/**
 * Download an authenticated PDF endpoint to the cache directory and open the
 * native share / "Save to Files" / print sheet.
 *
 * Native only — web callers keep their own `URL.createObjectURL` + anchor flow.
 * Uses `FileSystem.downloadAsync` with the auth headers (no Blob round-trip,
 * which is unreliable on native), mirroring the student document viewer.
 */
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getApiUrl } from "@/common/constants/api";
import { authHeaders, refreshSession } from "@/common/services/sessionRefresh";

export async function downloadAndSharePdf(
  endpoint: string,
  filename: string,
  dialogTitle?: string,
): Promise<void> {
  const cache = FileSystem.cacheDirectory;
  if (!cache) throw new Error("Storage is not available.");

  const base = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  const safeName = base.replace(/[^\w.-]+/g, "_");
  const dest = `${cache}${safeName}`;

  let result = await FileSystem.downloadAsync(getApiUrl(endpoint), dest, {
    headers: await authHeaders(),
  });
  // The same one renewal the API client does, for the same reason: an expired
  // access token is ordinary. Once only — a second refusal is real.
  if (result.status === 401 && (await refreshSession())) {
    result = await FileSystem.downloadAsync(getApiUrl(endpoint), dest, {
      headers: await authHeaders(),
    });
  }
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Download failed (${result.status})`);
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device.");
  }
  await Sharing.shareAsync(result.uri, {
    mimeType: "application/pdf",
    dialogTitle: dialogTitle ?? safeName,
    UTI: "com.adobe.pdf",
  });
}
