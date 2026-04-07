import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { CreateSubjectDTO, Subject } from "../types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSubjectDTO) => Promise<void>;
  initialData?: Subject | null;
  mode?: "create" | "edit";
}

export const CreateSubjectModal: React.FC<Props> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
}) => {
  const { t } = useTranslation("subjects");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (initialData && mode === "edit") {
      setName(initialData.name || "");
      setCode(initialData.code || "");
      setDescription(initialData.description || "");
    } else {
      resetForm();
    }
  }, [initialData, mode, visible]);

  const resetForm = () => {
    setName("");
    setCode("");
    setDescription("");
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t("modal.nameRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data: CreateSubjectDTO = {
        name: name.trim(),
      };
      if (code.trim()) data.code = code.trim();
      if (description.trim()) data.description = description.trim();

      await onSubmit(data);
      resetForm();
    } catch (err: any) {
      setError(err.message || t("modal.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === "edit" ? t("modal.titleEdit") : t("modal.titleCreate")}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t("modal.name")}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t("modal.placeholderName")}
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t("modal.code")}</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder={t("modal.placeholderCode")}
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t("modal.description")}</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder={t("modal.placeholderDescription")}
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === "edit" ? t("modal.update") : t("modal.create")}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  form: {
    flex: 1,
    padding: Spacing.lg,
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
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
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorContainer: {
    backgroundColor: "#FFF0F0",
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
