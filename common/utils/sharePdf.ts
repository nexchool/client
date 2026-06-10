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
import {
  getAccessToken,
  getRefreshToken,
  getTenantId,
} from "@/common/utils/storage";

export async function downloadAndSharePdf(
  endpoint: string,
  filename: string,
  dialogTitle?: string,
): Promise<void> {
  const cache = FileSystem.cacheDirectory;
  if (!cache) throw new Error("Storage is not available.");

  const [accessToken, refreshToken, tenantId] = await Promise.all([
    getAccessToken(),
    getRefreshToken(),
    getTenantId(),
  ]);
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (refreshToken) headers["X-Refresh-Token"] = refreshToken;
  if (tenantId) headers["X-Tenant-ID"] = tenantId;

  const base = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  const safeName = base.replace(/[^\w.-]+/g, "_");
  const dest = `${cache}${safeName}`;

  const result = await FileSystem.downloadAsync(getApiUrl(endpoint), dest, {
    headers,
  });
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
