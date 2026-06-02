/**
 * StudentDocumentsSection
 * Renders document list, empty state, Add Document button, and document cards.
 * Opens documents in-app via authenticated API (no public URLs).
 */
import React, { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import type { Ionicons } from "@expo/vector-icons";
import {
  useStudentDocuments,
  useUploadStudentDocument,
  useDeleteStudentDocument,
} from "../hooks/useStudentDocuments";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import {
  StudentDocument,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "../types";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { StudentDocumentViewerModal } from "./StudentDocumentViewerModal";

interface StudentDocumentsSectionProps {
  studentId: string;
}

function FileTypeIcon({
  mimeType,
  documentType,
  palette,
}: {
  mimeType?: string | null;
  documentType?: string | null;
  palette: ReturnType<typeof useTheme>["palette"];
}) {
  const mime = (mimeType || "").toLowerCase();
  const dt = (documentType || "").toLowerCase();
  let iconName: keyof typeof Ionicons.glyphMap = "document-outline";
  if (mime.startsWith("image") || dt.includes("photo") || dt.includes("image")) {
    iconName = "image-outline";
  } else if (
    mime.includes("pdf") ||
    dt.includes("pdf") ||
    dt.includes("certificate") ||
    dt.includes("id")
  ) {
    iconName = "document-text-outline";
  }
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: palette.tertiaryContainer,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppIcon name={iconName} size="md" color="onTertiaryContainer" />
    </View>
  );
}

export function StudentDocumentsSection({ studentId }: StudentDocumentsSectionProps) {
  const { t } = useTranslation("profile");
  const { palette, spacing, radius, elevation } = useTheme();
  const {
    data: documents,
    isLoading,
    isError,
    refetch,
  } = useStudentDocuments(studentId);
  const uploadMutation = useUploadStudentDocument(studentId);
  const deleteMutation = useDeleteStudentDocument(studentId);
  const { hasPermission } = usePermissions();
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<StudentDocument | null>(null);

  const canManage = hasPermission(PERMS.STUDENT_MANAGE);

  const handleDeleteDocument = (doc: StudentDocument) => {
    Alert.alert(
      t("documents.deleteTitle"),
      t("documents.deleteMessage", { filename: doc.original_filename }),
      [
        { text: t("documents.cancel"), style: "cancel" },
        {
          text: t("documents.delete"),
          style: "destructive",
          onPress: () => {
            deleteMutation.mutate(doc.id, {
              onError: (err) => {
                Alert.alert(t("documents.error"), err.message);
              },
            });
          },
        },
      ]
    );
  };

  const handleOpenDocument = (doc: StudentDocument) => {
    if (doc.id && doc.student_id) {
      setViewerDoc(doc);
    } else {
      Alert.alert(
        t("documents.unavailableTitle"),
        t("documents.unavailableMessage"),
      );
    }
  };

  const handleUploadSuccess = () => {
    setUploadModalVisible(false);
    refetch();
  };

  const sectionWrapperStyle = [
    elevation.card,
    {
      backgroundColor: palette.surfaceContainerLowest,
      borderRadius: radius.xl,
      padding: spacing.lg,
      gap: spacing.md,
    },
  ];

  const list = Array.isArray(documents) ? documents : [];

  if (isLoading) {
    return (
      <View style={sectionWrapperStyle}>
        <Text variant="headlineMd" color="onSurface">
          {t("documents.title")}
        </Text>
        <View style={[styles.centerPad, { padding: spacing.xl }]}>
          <ActivityIndicator size="small" color={palette.primary} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <Fragment>
        <View style={sectionWrapperStyle}>
          <Text variant="headlineMd" color="onSurface">
            {t("documents.title")}
          </Text>
          <View style={[styles.centerPad, { padding: spacing.xl, gap: spacing.md }]}>
            <Text
              variant="bodyMd"
              color="onSurfaceVariant"
              style={{ textAlign: "center" }}
            >
              {t("documents.errorMessage")}
            </Text>
            <View style={[styles.actionsRow, { gap: spacing.sm }]}>
              <TouchableOpacity
                style={[
                  styles.iconActionBtn,
                  {
                    gap: spacing.xs,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: palette.surfaceContainer,
                    borderRadius: radius.DEFAULT,
                  },
                ]}
                onPress={() => refetch()}
              >
                <AppIcon name="refresh" size="sm" color="primary" />
                <Text variant="labelMd" color="primary">
                  {t("documents.retry")}
                </Text>
              </TouchableOpacity>
              {canManage && (
                <TouchableOpacity
                  style={[
                    styles.iconActionBtn,
                    {
                      gap: spacing.xs,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: palette.surfaceContainer,
                      borderRadius: radius.DEFAULT,
                    },
                  ]}
                  onPress={() => setUploadModalVisible(true)}
                >
                  <AppIcon name="add" size="sm" color="primary" />
                  <Text variant="labelMd" color="primary">
                    {t("documents.addDocument")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <UploadDocumentModal
            visible={uploadModalVisible}
            onClose={() => setUploadModalVisible(false)}
            onSuccess={handleUploadSuccess}
            studentId={studentId}
            uploadMutation={uploadMutation}
          />
        </View>
        <StudentDocumentViewerModal
          visible={viewerDoc !== null}
          onClose={() => setViewerDoc(null)}
          document={viewerDoc}
        />
      </Fragment>
    );
  }

  return (
    <Fragment>
      <View style={sectionWrapperStyle}>
        <View style={styles.headerRow}>
          <View style={[styles.titleWithCount, { gap: spacing.sm }]}>
            <Text variant="headlineMd" color="onSurface">
              {t("documents.title")}
            </Text>
            {list.length > 0 ? (
              <View
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 2,
                  borderRadius: radius.full,
                  backgroundColor: palette.surfaceContainer,
                  minWidth: 24,
                  alignItems: "center",
                }}
              >
                <Text variant="labelSm" color="onSurfaceVariant">
                  {list.length}
                </Text>
              </View>
            ) : null}
          </View>
          {canManage && (
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  gap: spacing.xs,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                },
              ]}
              onPress={() => setUploadModalVisible(true)}
              hitSlop={8}
            >
              <AppIcon name="add" size="md" color="primary" />
              <Text variant="labelMd" color="primary">
                {t("documents.addDocument")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {list.length === 0 ? (
          <View style={[styles.emptyState, { paddingVertical: spacing.xl, gap: spacing.md }]}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: palette.surfaceContainer,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon
                name="document-outline"
                size="xl"
                color="onSurfaceVariant"
              />
            </View>
            <Text
              variant="bodyMd"
              color="onSurfaceVariant"
              style={{ textAlign: "center" }}
            >
              {t("documents.emptyState")}
            </Text>
            {canManage && (
              <TouchableOpacity
                style={{
                  marginTop: spacing.xs,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  backgroundColor: palette.primary,
                  borderRadius: radius.DEFAULT,
                }}
                onPress={() => setUploadModalVisible(true)}
              >
                <Text variant="labelMd" color="onPrimary">
                  {t("documents.addDocument")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {list.map((doc) => {
              const label =
                doc.document_type_label ||
                t(`documentTypes.${doc.document_type}`, {
                  defaultValue:
                    DOCUMENT_TYPE_LABELS[doc.document_type as DocumentType] ??
                    doc.document_type,
                });
              const dateText = doc.created_at
                ? new Date(doc.created_at).toLocaleDateString()
                : "";
              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.docCard,
                    {
                      padding: spacing.md,
                      gap: spacing.md,
                      backgroundColor: palette.surfaceContainerLowest,
                      borderRadius: radius.lg,
                      borderColor: palette.outlineVariant,
                    },
                  ]}
                  onPress={() => handleOpenDocument(doc)}
                  onLongPress={() => canManage && handleDeleteDocument(doc)}
                  activeOpacity={0.7}
                  delayLongPress={400}
                >
                  <FileTypeIcon
                    mimeType={doc.mime_type}
                    documentType={doc.document_type}
                    palette={palette}
                  />
                  <View style={styles.docCardContent}>
                    <Text variant="labelMd" color="onSurface" numberOfLines={1}>
                      {doc.original_filename}
                    </Text>
                    <Text
                      variant="bodySm"
                      color="onSurfaceVariant"
                      style={{ marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {label}
                      {dateText ? ` · ${dateText}` : ""}
                    </Text>
                  </View>
                  {canManage && (
                    <TouchableOpacity
                      style={{ padding: spacing.xs }}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <AppIcon name="trash-outline" size="md" color="error" />
                    </TouchableOpacity>
                  )}
                  <AppIcon
                    name="chevron-forward"
                    size="md"
                    color="onSurfaceVariant"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <UploadDocumentModal
          visible={uploadModalVisible}
          onClose={() => setUploadModalVisible(false)}
          onSuccess={handleUploadSuccess}
          studentId={studentId}
          uploadMutation={uploadMutation}
        />
      </View>
      <StudentDocumentViewerModal
        visible={viewerDoc !== null}
        onClose={() => setViewerDoc(null)}
        document={viewerDoc}
      />
    </Fragment>
  );
}

const styles = StyleSheet.create({
  centerPad: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  iconActionBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleWithCount: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  docCardContent: {
    flex: 1,
  },
});
