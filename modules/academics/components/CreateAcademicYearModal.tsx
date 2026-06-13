import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { academicYearService, type AcademicYear } from "../services/academicYearService";
import { DatePicker } from '@/common/components/datepicker';

interface CreateAcademicYearModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (year: AcademicYear) => void;
}

export function CreateAcademicYearModal({
  visible,
  onClose,
  onSuccess,
}: CreateAcademicYearModalProps) {
  const { t } = useTranslation("common");
  const { palette, spacing, radius, typography: { bodyMd: bodyMdType } } = useTheme();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName("");
      setStartDate("");
      setEndDate("");
      setError(null);
    }
  }, [visible]);

  const handleSubmit = async () => {
    const n = name.trim();
    const sd = startDate.trim();
    const ed = endDate.trim();
    if (!n || !sd || !ed) {
      setError(t("academicYearCreate.errors.required"));
      return;
    }
    const startMatch = /^\d{4}-\d{2}-\d{2}$/.test(sd);
    const endMatch = /^\d{4}-\d{2}-\d{2}$/.test(ed);
    if (!startMatch || !endMatch) {
      setError(t("academicYearCreate.errors.dateFormat"));
      return;
    }
    if (new Date(sd) >= new Date(ed)) {
      setError(t("academicYearCreate.errors.startBeforeEnd"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await academicYearService.createAcademicYear({
        name: n,
        start_date: sd,
        end_date: ed,
        is_active: true,
      });
      onSuccess(created);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? t("academicYearCreate.errors.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.4)" }]}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: radius.md,
            padding: spacing.lg,
            width: "100%",
            maxWidth: 360,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <Text variant="headlineMd" color="onSurface">
              {t("academicYearCreate.title")}
            </Text>
            <AppIcon
              name="close"
              size="lg"
              color="onSurface"
              onPress={onClose}
              style={{ padding: spacing.xs }}
            />
          </View>

          {error && (
            <View
              style={{
                backgroundColor: palette.errorContainer,
                padding: spacing.sm,
                borderRadius: radius.sm,
                marginBottom: spacing.md,
                borderLeftWidth: 4,
                borderLeftColor: palette.error,
              }}
            >
              <Text variant="labelMd" color="error">
                {error}
              </Text>
            </View>
          )}

          <Text
            variant="labelMd"
            color="onSurface"
            style={{ marginBottom: spacing.xs }}
          >
            {t("academicYearCreate.nameLabel")}
          </Text>
          <TextInput
            style={[
              styles.input,
              bodyMdType,
              {
                borderColor: palette.outlineVariant,
                borderRadius: radius.sm,
                padding: spacing.md,
                color: palette.onSurface,
                backgroundColor: palette.surfaceContainerLow,
                marginBottom: spacing.md,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder={t("academicYearCreate.namePlaceholder")}
            placeholderTextColor={palette.outline}
            editable={!loading}
          />

          <DatePicker
            label={t("academicYearCreate.startDate")}
            value={startDate}
            onChange={setStartDate}
            placeholder={t("academicYearCreate.datePlaceholder")}
          />

          <DatePicker
            label={t("academicYearCreate.endDate")}
            value={endDate}
            onChange={setEndDate}
            placeholder={t("academicYearCreate.datePlaceholder")}
          />

          <TouchableOpacity
            style={{
              backgroundColor: palette.primary,
              padding: spacing.md,
              borderRadius: radius.md,
              alignItems: "center",
              marginTop: spacing.sm,
              opacity: loading ? 0.6 : 1,
            }}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={palette.onPrimary} />
            ) : (
              <Text variant="labelLg" color="onPrimary">
                {t("academicYearCreate.create")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  input: {
    borderWidth: 1,
  },
});
