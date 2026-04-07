import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { academicYearService, type AcademicYear } from "../services/academicYearService";
import { DateField } from "@/common/components/DateField";

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
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("academicYearCreate.title")}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>{t("academicYearCreate.nameLabel")}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("academicYearCreate.namePlaceholder")}
            placeholderTextColor={Colors.textTertiary}
            editable={!loading}
          />

          <DateField
            label={t("academicYearCreate.startDate")}
            value={startDate}
            onChange={setStartDate}
            placeholder={t("academicYearCreate.datePlaceholder")}
          />

          <DateField
            label={t("academicYearCreate.endDate")}
            value={endDate}
            onChange={setEndDate}
            placeholder={t("academicYearCreate.datePlaceholder")}
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>{t("academicYearCreate.create")}</Text>
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
    padding: Spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modal: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 360,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  closeBtn: { padding: Spacing.xs },
  errorBox: {
    backgroundColor: "#FFF0F0",
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  errorText: { color: Colors.error, fontSize: 14 },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Layout.borderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.backgroundSecondary,
    marginBottom: Spacing.md,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
