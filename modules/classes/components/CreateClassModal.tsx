import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import type { CreateClassDTO } from "../types";
import { DateField } from "@/common/components/DateField";
import { useAcademicYears } from "@/modules/academics/hooks/useAcademicYears";
import { useAcademicYearContext } from "@/modules/academics/context/AcademicYearContext";
import { classService } from "@/modules/classes/services/classService";
import { Teacher } from "@/modules/teachers/types";

interface EditInitialData {
  name: string;
  section: string;
  academic_year_id: string;
  teacher_id?: string;
  start_date?: string;
  end_date?: string;
  grade_level?: number | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClassDTO) => Promise<void>;
  /** When provided, modal acts as Edit mode with pre-filled form. Pass classId for teacher picker. */
  initialData?: EditInitialData;
  classId?: string;
}

export const CreateClassModal: React.FC<Props> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  classId,
}) => {
  const { t } = useTranslation("classes");
  const { palette, spacing, radius, typography: { bodyMd: bodyMdType } } = useTheme();
  const isEditMode = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  /** Standard / grade (e.g. 10) — class display name becomes Grade {standard} when creating */
  const [standardNum, setStandardNum] = useState("");
  const [section, setSection] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [classTeacherId, setClassTeacherId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: academicYears = [], isLoading: academicYearsLoading } = useAcademicYears(false);
  const { selectedAcademicYearId: contextYearId } = useAcademicYearContext();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name);
        setStandardNum(
          initialData.grade_level != null && initialData.grade_level !== undefined
            ? String(initialData.grade_level)
            : ""
        );
        setSection(initialData.section);
        setAcademicYearId(initialData.academic_year_id);
        setClassTeacherId(initialData.teacher_id || "");
        setStartDate(initialData.start_date || "");
        setEndDate(initialData.end_date || "");
      }
      setTeachersLoading(true);
      classService
        .getAvailableClassTeachers(classId)
        .then(setTeachers)
        .finally(() => setTeachersLoading(false));
      if (!initialData) {
        setAcademicYearId(contextYearId || "");
      }
    }
  }, [visible, contextYearId, initialData, classId]);

  const resetForm = () => {
    if (initialData) {
      setName(initialData.name);
      setStandardNum(
        initialData.grade_level != null && initialData.grade_level !== undefined
          ? String(initialData.grade_level)
          : ""
      );
      setSection(initialData.section);
      setAcademicYearId(initialData.academic_year_id);
      setClassTeacherId(initialData.teacher_id || "");
      setStartDate(initialData.start_date || "");
      setEndDate(initialData.end_date || "");
    } else {
      setName("");
      setStandardNum("");
      setSection("");
      setAcademicYearId(contextYearId || "");
      setClassTeacherId("");
      setStartDate("");
      setEndDate("");
    }
    setError(null);
  };

  const handleSubmit = async () => {
    if (!section.trim() || !academicYearId) {
      setError(t("modal.errSectionYear"));
      return;
    }

    if (isEditMode) {
      if (!name.trim()) {
        setError(t("modal.errNameRequired"));
        return;
      }
    } else {
      const sn = parseInt(standardNum.trim(), 10);
      if (!standardNum.trim() || Number.isNaN(sn) || sn < 1 || sn > 20) {
        setError(t("modal.errStandard"));
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditMode) {
        const payload: CreateClassDTO = {
          name: name.trim(),
          section: section.trim(),
          academic_year_id: academicYearId,
          teacher_id: classTeacherId || undefined,
          start_date: startDate.trim() || undefined,
          end_date: endDate.trim() || undefined,
        };
        if (standardNum.trim()) {
          const sn = parseInt(standardNum.trim(), 10);
          if (!Number.isNaN(sn)) payload.grade_level = sn;
        }
        await onSubmit(payload);
      } else {
        const sn = parseInt(standardNum.trim(), 10);
        await onSubmit({
          section: section.trim(),
          academic_year_id: academicYearId,
          grade_level: sn,
          teacher_id: classTeacherId || undefined,
          start_date: startDate.trim() || undefined,
          end_date: endDate.trim() || undefined,
        });
      }
      resetForm();
    } catch (err) {
      setError(
        (err instanceof Error ? err.message : "") ||
          (isEditMode ? t("modal.errUpdateFailed") : t("modal.errCreateFailed")),
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    bodyMdType,
    {
      borderColor: palette.outlineVariant,
      borderRadius: radius.sm,
      padding: spacing.md,
      color: palette.onSurface,
      backgroundColor: palette.surfaceContainerLow,
    },
  ];

  const renderChip = (active: boolean, label: string, onPress: () => void, key: string) => (
    <PressScale
      key={key}
      style={[
        styles.chip,
        {
          marginRight: spacing.sm,
          borderRadius: radius.sm,
          borderColor: active ? palette.primary : palette.outlineVariant,
          backgroundColor: active ? palette.primaryContainer : palette.surfaceContainerLow,
        },
      ]}
      onPress={onPress}
    >
      <Text variant="bodySm" color={active ? "onPrimaryContainer" : "onSurface"} numberOfLines={1}>
        {label}
      </Text>
    </PressScale>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: palette.surface }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { padding: spacing.lg, borderBottomColor: palette.surfaceContainerHighest }]}>
          <AppIcon name="close" size="lg" color="onSurface" onPress={onClose} accessibilityLabel={t("modal.titleEdit")} />
          <Text variant="headlineMd" color="onSurface">
            {isEditMode ? t("modal.titleEdit") : t("modal.titleCreate")}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={[styles.form, { padding: spacing.lg }]} showsVerticalScrollIndicator={false}>
          {error && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: palette.errorContainer, padding: spacing.md, borderRadius: radius.sm, marginBottom: spacing.md, borderLeftColor: palette.error },
              ]}
            >
              <Text variant="bodySm" color="onErrorContainer">{error}</Text>
            </View>
          )}

          {isEditMode ? (
            <>
              <View style={[styles.fieldContainer, { marginBottom: spacing.md }]}>
                <Text variant="labelMd" color="onSurface" style={{ marginBottom: spacing.xs }}>{t("modal.standardGradeNumber")}</Text>
                <Text variant="bodySm" color="onSurfaceVariant" style={{ marginBottom: spacing.sm }}>{t("modal.standardHintEdit")}</Text>
                <TextInput
                  style={inputStyle}
                  value={standardNum}
                  onChangeText={setStandardNum}
                  placeholder={t("modal.placeholderStandard")}
                  keyboardType="number-pad"
                  placeholderTextColor={palette.outline}
                />
              </View>
              <View style={[styles.fieldContainer, { marginBottom: spacing.md }]}>
                <Text variant="labelMd" color="onSurface" style={{ marginBottom: spacing.xs }}>{t("modal.className")}</Text>
                <TextInput
                  style={inputStyle}
                  value={name}
                  onChangeText={setName}
                  placeholder={t("modal.placeholderName")}
                  placeholderTextColor={palette.outline}
                />
              </View>
            </>
          ) : (
            <View style={[styles.fieldContainer, { marginBottom: spacing.md }]}>
              <Text variant="labelMd" color="onSurface" style={{ marginBottom: spacing.xs }}>{t("modal.standardGrade")}</Text>
              <Text variant="bodySm" color="onSurfaceVariant" style={{ marginBottom: spacing.sm }}>{t("modal.standardHintCreate")}</Text>
              <TextInput
                style={inputStyle}
                value={standardNum}
                onChangeText={setStandardNum}
                placeholder={t("modal.placeholderStandard")}
                keyboardType="number-pad"
                placeholderTextColor={palette.outline}
              />
              {standardNum.trim() && !Number.isNaN(parseInt(standardNum, 10)) ? (
                <Text variant="labelLg" color="primary" style={{ marginTop: spacing.sm }}>
                  {t("modal.classNamePreview", { grade: parseInt(standardNum, 10) })}
                </Text>
              ) : null}
            </View>
          )}

          <View style={[styles.fieldContainer, { marginBottom: spacing.md }]}>
            <Text variant="labelMd" color="onSurface" style={{ marginBottom: spacing.xs }}>{t("modal.section")}</Text>
            <TextInput
              style={inputStyle}
              value={section}
              onChangeText={setSection}
              placeholder={t("modal.placeholderSection")}
              placeholderTextColor={palette.outline}
            />
          </View>

          <View style={[styles.fieldContainer, { marginBottom: spacing.md }]}>
            <Text variant="labelMd" color="onSurface" style={{ marginBottom: spacing.xs }}>{t("modal.academicYear")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xs }}>
              {academicYearsLoading ? (
                <Text variant="bodySm" color="onSurfaceVariant" style={{ paddingVertical: spacing.sm }}>{t("modal.loading")}</Text>
              ) : academicYears.length === 0 ? (
                <Text variant="bodySm" color="onSurfaceVariant" style={{ paddingVertical: spacing.sm }}>{t("modal.noAcademicYears")}</Text>
              ) : (
                academicYears.map((ay) =>
                  renderChip(academicYearId === ay.id, ay.name, () => setAcademicYearId(ay.id), ay.id)
                )
              )}
            </ScrollView>
          </View>

          <View style={[styles.fieldContainer, { marginBottom: spacing.md }]}>
            <Text variant="labelMd" color="onSurface" style={{ marginBottom: spacing.xs }}>{t("modal.classTeacherOptional")}</Text>
            <Text variant="bodySm" color="onSurfaceVariant" style={{ marginBottom: spacing.sm }}>{t("modal.classTeacherHint")}</Text>
            {teachersLoading ? (
              <ActivityIndicator size="small" color={palette.primary} style={{ marginVertical: spacing.sm }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xs }}>
                {renderChip(!classTeacherId, t("modal.none"), () => setClassTeacherId(""), "none")}
                {teachers.map((teacher) =>
                  renderChip(
                    classTeacherId === teacher.user_id,
                    `${teacher.name} (${teacher.employee_id})`,
                    () => setClassTeacherId(classTeacherId === teacher.user_id ? "" : teacher.user_id),
                    teacher.id
                  )
                )}
              </ScrollView>
            )}
          </View>

          <View style={[styles.fieldContainer, { marginBottom: spacing.md }]}>
            <DateField
              label={t("modal.startDate")}
              value={startDate}
              onChange={setStartDate}
              placeholder={t("modal.datePlaceholder")}
              useOverlayInsideModal
            />
          </View>

          <View style={[styles.fieldContainer, { marginBottom: spacing.md }]}>
            <DateField
              label={t("modal.endDate")}
              value={endDate}
              onChange={setEndDate}
              placeholder={t("modal.datePlaceholder")}
              useOverlayInsideModal
            />
          </View>

          <PressScale
            style={[
              styles.submitButton,
              { backgroundColor: palette.primary, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.lg },
              loading && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={palette.onPrimary} />
            ) : (
              <Text variant="labelLg" color="onPrimary">
                {isEditMode ? t("modal.update") : t("modal.create")}
              </Text>
            )}
          </PressScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  form: { flex: 1 },
  fieldContainer: {},
  input: { borderWidth: 1 },
  errorContainer: { borderLeftWidth: 4 },
  submitButton: { alignItems: "center" },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1 },
});
