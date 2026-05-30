/**
 * UploadDocumentModal
 * Modal for uploading a student document.
 * Document type picker, file picker (PDF/images), upload button, loading and error states.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import {
  DOCUMENT_TYPES,
  type DocumentTypeValue,
  type StudentDocument,
  type UploadDocumentInput,
} from "../types";
import type { UseMutationResult } from "@tanstack/react-query";
import { prepareFileForUpload } from "@/common/utils/prepareUploadFile";

interface UploadDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string;
  uploadMutation: UseMutationResult<
    StudentDocument,
    Error,
    UploadDocumentInput,
    unknown
  >;
}

export function UploadDocumentModal({
  visible,
  onClose,
  onSuccess,
  uploadMutation,
}: UploadDocumentModalProps) {
  const { t } = useTranslation("profile");
  const { palette, spacing, radius } = useTheme();
  const [documentType, setDocumentType] = useState<DocumentTypeValue | "">("");
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    mimeType?: string;
  } | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  const { mutate: upload, isPending, error, reset } = uploadMutation;

  const resetForm = () => {
    setDocumentType("");
    setSelectedFile(null);
    setShowTypePicker(false);
    reset();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (asset?.uri && asset?.name) {
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? undefined,
        });
      }
    } catch (e) {
      console.error("Document picker error:", e);
      Alert.alert(t("uploadModal.error"), t("uploadModal.pickFileError"));
    }
  };

  const handleUpload = async () => {
    if (isPreparing || isPending) return;
    if (!documentType || !selectedFile) {
      Alert.alert(
        t("uploadModal.validationTitle"),
        documentType
          ? t("uploadModal.selectFileFirst")
          : t("uploadModal.selectTypeFirst"),
      );
      return;
    }

    setIsPreparing(true);
    try {
      const file = await prepareFileForUpload(selectedFile);
      upload(
        { documentType: documentType as DocumentTypeValue, file },
        {
          onSuccess: () => {
            handleClose();
            onSuccess();
          },
          onError: () => {},
        },
      );
    } catch (e: unknown) {
      Alert.alert(
        t("uploadModal.cannotUploadTitle"),
        e instanceof Error ? e.message : t("uploadModal.prepareFailed"),
      );
    } finally {
      setIsPreparing(false);
    }
  };

  const isValid = Boolean(documentType && selectedFile && !isPending && !isPreparing);

  const pickerBoxStyle = {
    padding: spacing.md,
    backgroundColor: palette.surfaceContainerLow,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: palette.surface,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            maxHeight: "80%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: palette.outlineVariant,
            }}
          >
            <Text variant="headlineMd" color="onSurface">
              {t("uploadModal.title")}
            </Text>
            <AppIcon
              name="close"
              size="lg"
              color="onSurface"
              onPress={handleClose}
              style={{ padding: spacing.xs }}
            />
          </View>

          <ScrollView style={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
            {/* Document Type */}
            <Text variant="labelMd" color="onSurfaceVariant" style={{ marginBottom: spacing.xs }}>
              {t("uploadModal.documentType")}
            </Text>
            <TouchableOpacity
              style={{
                ...pickerBoxStyle,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onPress={() => setShowTypePicker(!showTypePicker)}
            >
              <Text
                variant="bodyMd"
                color={documentType ? "onSurface" : "outline"}
              >
                {documentType
                  ? t(`documentTypes.${documentType}`)
                  : t("uploadModal.selectType")}
              </Text>
              <AppIcon
                name={showTypePicker ? "chevron-up" : "chevron-down"}
                size="md"
                color="onSurfaceVariant"
              />
            </TouchableOpacity>
            {showTypePicker && (
              <View
                style={{
                  marginTop: spacing.xs,
                  backgroundColor: palette.surfaceContainerLow,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: palette.outlineVariant,
                  overflow: "hidden",
                }}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={{
                      padding: spacing.md,
                      borderBottomWidth: 1,
                      borderBottomColor: palette.outlineVariant,
                    }}
                    onPress={() => {
                      setDocumentType(type);
                      setShowTypePicker(false);
                    }}
                  >
                    <Text variant="bodyMd" color="onSurface">
                      {t(`documentTypes.${type}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* File Picker */}
            <Text
              variant="labelMd"
              color="onSurfaceVariant"
              style={{ marginBottom: spacing.xs, marginTop: spacing.md }}
            >
              {t("uploadModal.file")}
            </Text>
            <TouchableOpacity
              style={{
                ...pickerBoxStyle,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                borderStyle: "dashed",
              }}
              onPress={handlePickFile}
            >
              <AppIcon name="document-attach-outline" size="lg" color="primary" />
              <Text variant="bodyMd" color="primary" style={{ flex: 1 }}>
                {selectedFile ? selectedFile.name : t("uploadModal.chooseFile")}
              </Text>
            </TouchableOpacity>

            {error && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  marginTop: spacing.md,
                  padding: spacing.md,
                  backgroundColor: palette.errorContainer,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: palette.error,
                }}
              >
                <AppIcon name="alert-circle" size="sm" color="error" />
                <Text variant="labelMd" color="error" style={{ flex: 1 }}>
                  {typeof error === "object" && error !== null && "data" in error
                    ? (error as { data?: { message?: string } }).data?.message ||
                      (typeof (error as Error).message === "string" &&
                      (error as Error).message !== "true"
                        ? (error as Error).message
                        : t("uploadModal.uploadFailedHint"))
                    : typeof (error as Error).message === "string" &&
                        (error as Error).message !== "true"
                      ? (error as Error).message
                      : t("uploadModal.uploadFailedHint")}
                </Text>
              </View>
            )}
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: spacing.md,
              padding: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: palette.outlineVariant,
            }}
          >
            <TouchableOpacity
              style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
              onPress={handleClose}
            >
              <Text variant="bodyMd" color="onSurfaceVariant">
                {t("uploadModal.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                backgroundColor: palette.primary,
                borderRadius: radius.sm,
                minWidth: 100,
                alignItems: "center",
                opacity: isValid ? 1 : 0.5,
              }}
              onPress={() => void handleUpload()}
              disabled={!isValid}
            >
              {isPending || isPreparing ? (
                <ActivityIndicator size="small" color={palette.onPrimary} />
              ) : (
                <Text variant="labelLg" color="onPrimary">
                  {t("uploadModal.upload")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
