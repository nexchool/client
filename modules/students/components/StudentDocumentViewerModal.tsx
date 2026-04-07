/**
 * Authenticated in-app document preview (GET /api/students/.../documents/.../file).
 *
 * Native: streams to cache via FileSystem.downloadAsync (no Blob round-trip).
 * Web: Blob from apiGetBlob + URL.createObjectURL (ArrayBuffer-backed Blobs).
 * PDF: react-native-pdf on dev builds; Expo Go / missing module → share sheet.
 */
import React, { createElement, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Constants from "expo-constants";
import * as ScreenCapture from "expo-screen-capture";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { getApiUrl } from "@/common/constants/api";
import { apiGetBlob } from "@/common/services/api";
import {
  getAccessToken,
  getRefreshToken,
  getTenantId,
} from "@/common/utils/storage";
import { Colors } from "@/common/constants/colors";
import { Spacing } from "@/common/constants/spacing";
import type { StudentDocument } from "../types";

// --- constants ----------------------------------------------------------------

const SCREEN_CAPTURE_KEY = "student-document-viewer";
const isExpoGo = Constants.appOwnership === "expo";

const STORAGE_UNAVAILABLE_EN = "Storage is not available.";

// --- PDF (native module, not in Expo Go) --------------------------------------

function loadPdfNative(): React.ComponentType<Record<string, unknown>> | undefined {
  if (Platform.OS === "web" || isExpoGo) return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-pdf").default;
  } catch {
    return undefined;
  }
}

const PdfNative = loadPdfNative();

// --- types --------------------------------------------------------------------

type DocumentKind = "pdf" | "image";

type Preview =
  | { kind: "image"; uri: string }
  | { kind: "pdf"; uri: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  document: StudentDocument | null;
};

// --- pure helpers --------------------------------------------------------------

function fileEndpoint(doc: StudentDocument): string {
  return `/api/students/${doc.student_id}/documents/${doc.id}/file`;
}

function stripMime(m: string): string {
  return (m || "").split(";")[0]?.trim() || "";
}

function classifyKind(filename: string, mime: string): DocumentKind {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png|gif|webp|heic|heif)$/i.test(filename)) return "image";
  const m = mime.toLowerCase();
  if (m.includes("pdf")) return "pdf";
  if (m.startsWith("image/")) return "image";
  return "image";
}

function imageExtension(filename: string, mime: string): string {
  const n = filename.toLowerCase();
  if (n.endsWith(".png")) return ".png";
  if (n.endsWith(".webp")) return ".webp";
  if (n.endsWith(".gif")) return ".gif";
  if (n.endsWith(".heic") || n.endsWith(".heif")) return ".heic";
  const m = mime.toLowerCase();
  if (m.includes("png")) return ".png";
  if (m.includes("webp")) return ".webp";
  if (m.includes("gif")) return ".gif";
  if (m.includes("heic") || m.includes("heif")) return ".heic";
  if (m.includes("jpeg") || m.includes("jpg")) return ".jpg";
  return ".jpg";
}

function webImageMime(filename: string, mime: string): string {
  const m = stripMime(mime).toLowerCase();
  if (m.startsWith("image/")) return m;
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  if (/\.(jpe?g)$/i.test(lower)) return "image/jpeg";
  return "image/jpeg";
}

function webPdfMime(mime: string): string {
  const m = stripMime(mime).toLowerCase();
  if (m.includes("pdf")) return "application/pdf";
  return "application/pdf";
}

function normalizeFileUri(uri: string): string {
  if (uri.startsWith("blob:")) return uri;
  if (uri.startsWith("file://")) return uri;
  return `file://${uri.replace(/^file:\/\//, "")}`;
}

// --- authenticated download (native) -------------------------------------------

async function downloadToCache(endpoint: string, destPath: string): Promise<string> {
  const url = getApiUrl(endpoint);
  const [accessToken, refreshToken, tenantId] = await Promise.all([
    getAccessToken(),
    getRefreshToken(),
    getTenantId(),
  ]);
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (refreshToken) headers["X-Refresh-Token"] = refreshToken;
  if (tenantId) headers["X-Tenant-ID"] = tenantId;

  const result = await FileSystem.downloadAsync(url, destPath, { headers });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Download failed (${result.status})`);
  }
  return result.uri;
}

// --- web: blob → object URL ----------------------------------------------------

async function webObjectUrlFromBlob(blob: Blob, filename: string, kind: DocumentKind): Promise<string> {
  const ab = await blob.arrayBuffer();
  const mime =
    kind === "pdf"
      ? webPdfMime(blob.type)
      : webImageMime(filename, blob.type || "");
  return URL.createObjectURL(new Blob([ab], { type: mime }));
}

// --- component ----------------------------------------------------------------

export function StudentDocumentViewerModal({ visible, onClose, document }: Props) {
  const { t } = useTranslation("profile");
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);

  const tempFilePathRef = useRef<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const deleteTempFile = useCallback(() => {
    const p = tempFilePathRef.current;
    if (p) {
      tempFilePathRef.current = null;
      FileSystem.deleteAsync(p, { idempotent: true }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    ScreenCapture.preventScreenCaptureAsync(SCREEN_CAPTURE_KEY).catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync(SCREEN_CAPTURE_KEY).catch(() => {});
    };
  }, [visible]);

  /* Depend on document fields, not `document`, to avoid refetch when parent passes a new object reference. */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!visible || !document?.id || !document.student_id) {
      setPreview(null);
      setLoadError(null);
      setImageError(false);
      return;
    }

    let cancelled = false;
    const filename = document.original_filename || "document";
    const mimeHint = stripMime(document.mime_type || "");
    const endpoint = fileEndpoint(document);

    setLoading(true);
    setLoadError(null);
    setImageError(false);
    setPreview(null);
    revokeBlob();

    (async () => {
      try {
        const kind = classifyKind(filename, mimeHint);

        if (Platform.OS === "web") {
          const blob = await apiGetBlob(endpoint);
          if (cancelled) return;
          const url = await webObjectUrlFromBlob(blob, filename, kind);
          blobUrlRef.current = url;
          if (!cancelled) {
            setPreview(kind === "pdf" ? { kind: "pdf", uri: url } : { kind: "image", uri: url });
          }
          return;
        }

        const cache = FileSystem.cacheDirectory;
        if (!cache) {
          throw new Error(STORAGE_UNAVAILABLE_EN);
        }

        const stamp = Date.now();
        const destPath =
          kind === "pdf"
            ? `${cache}doc-${document.id}-${stamp}.pdf`
            : `${cache}img-${document.id}-${stamp}${imageExtension(filename, mimeHint)}`;

        const uri = await downloadToCache(endpoint, destPath);
        if (cancelled) return;

        tempFilePathRef.current = destPath;
        const displayUri = normalizeFileUri(uri);

        if (!cancelled) {
          setPreview(kind === "pdf" ? { kind: "pdf", uri: displayUri } : { kind: "image", uri: displayUri });
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Could not open document",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      revokeBlob();
      deleteTempFile();
    };
  }, [
    visible,
    document?.id,
    document?.student_id,
    document?.original_filename,
    document?.mime_type,
    revokeBlob,
    deleteTempFile,
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const displayLoadError = (msg: string | null) => {
    if (msg === null) return null;
    if (msg === STORAGE_UNAVAILABLE_EN) return t("viewer.storageUnavailable");
    if (msg === "Could not open document") return t("viewer.couldNotOpenDocument");
    return msg;
  };

  const openPdfExternally = useCallback(
    async (uri: string) => {
      try {
        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert(
            t("documents.unavailableTitle"),
            t("viewer.sharingUnavailable"),
          );
          return;
        }
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle:
            document?.original_filename ?? t("viewer.fallbackTitle"),
        });
      } catch (e: unknown) {
        Alert.alert(
          t("uploadModal.error"),
          e instanceof Error ? e.message : t("viewer.couldNotOpen"),
        );
      }
    },
    [document?.original_filename, t],
  );

  const showPdfWeb =
    preview?.kind === "pdf" &&
    !loading &&
    !loadError &&
    Platform.OS === "web";
  const showPdfNative =
    preview?.kind === "pdf" &&
    !loading &&
    !loadError &&
    Platform.OS !== "web" &&
    PdfNative &&
    !isExpoGo;
  const showPdfShare =
    preview?.kind === "pdf" &&
    !loading &&
    !loadError &&
    Platform.OS !== "web" &&
    (isExpoGo || !PdfNative);

  const bodyReady = !loading && !loadError && preview !== null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.screen, { width: winW, height: winH }]}>
        <View style={[styles.toolbar, { paddingTop: insets.top + Spacing.sm }]}>
          <Text style={styles.title} numberOfLines={1}>
            {document?.original_filename ?? t("viewer.fallbackTitle")}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel={t("viewer.close")}
          >
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {loading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}

          {loadError && !loading && (
            <View style={styles.centered}>
              <Text style={styles.err}>{displayLoadError(loadError)}</Text>
            </View>
          )}

          {bodyReady && preview.kind === "image" && (
            <View style={styles.previewArea}>
              {!imageError ? (
                <Image
                  source={{ uri: preview.uri }}
                  style={styles.imageFill}
                  contentFit="contain"
                  transition={0}
                  cachePolicy="none"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.centered}>
                  <Text style={styles.err}>{t("viewer.imageError")}</Text>
                </View>
              )}
            </View>
          )}

          {showPdfWeb && (
            <View style={styles.pdf}>
              {createElement("iframe", {
                src: preview.uri,
                style: {
                  width: "100%",
                  height: "100%",
                  border: "none",
                  backgroundColor: "#525659",
                },
                title: document?.original_filename ?? t("viewer.pdfIframeTitle"),
              })}
            </View>
          )}

          {showPdfNative && (
            <PdfNative
              key={preview.uri}
              source={{ uri: normalizeFileUri(preview.uri), cache: false }}
              style={styles.pdf}
              fitPolicy={0}
              trustAllCerts={false}
            />
          )}

          {showPdfShare && (
            <View style={styles.centered}>
              {isExpoGo && (
                <Text style={styles.hint}>{t("viewer.expoGoHint")}</Text>
              )}
              <TouchableOpacity style={styles.btn} onPress={() => openPdfExternally(preview.uri)}>
                <Text style={styles.btnText}>{t("viewer.openPdf")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.background,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  body: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    backgroundColor: "#EAEAEC",
  },
  previewArea: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    position: "relative",
    backgroundColor: "#EAEAEC",
  },
  imageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  pdf: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    backgroundColor: "#525659",
  },
  centered: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  err: {
    color: Colors.error,
    textAlign: "center",
    fontSize: 15,
  },
  hint: {
    color: Colors.textSecondary,
    textAlign: "center",
    fontSize: 15,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: 8,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
