import React, { useState, useEffect, useMemo } from "react";
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
import { SelectSheet } from "@/common/components/SelectSheet";
import type { CreateClassDTO } from "../types";
import { DatePicker } from '@/common/components/datepicker';
import { useAcademicYears } from "@/modules/academics/hooks/useAcademicYears";
import { useAcademicYearContext } from "@/modules/academics/context/AcademicYearContext";
import { useSchoolUnits } from "@/modules/academics/hooks/useSchoolUnits";
import { useProgrammes } from "@/modules/academics/hooks/useProgrammes";
import { useGrades, useCreateGrade } from "@/modules/academics/hooks/useGrades";
import { useMediums } from "@/modules/academics/hooks/useMediums";
import { useAcademicCycles } from "@/modules/academics/hooks/useAcademicCycles";
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

  // Edit-mode fields — unchanged from before this change, still the legacy
  // grade_level shape. Admin web's structured fields (below) are create-only:
  // an existing class already has a campus/programme/grade and this modal's
  // edit path has never touched them.
  const [name, setName] = useState("");
  const [standardNum, setStandardNum] = useState("");
  const [section, setSection] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [classTeacherId, setClassTeacherId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Create-mode fields — same shape as admin-web's CreateSectionModal.
  const [campusId, setCampusId] = useState("");
  const [programmeId, setProgrammeId] = useState("");
  const [gradeId, setGradeId] = useState("");
  /** Typing a name not in `grades` creates it on submit — see useCreateGrade. */
  const [newGradeName, setNewGradeName] = useState("");
  const [mediumId, setMediumId] = useState("");
  const [academicCycleId, setAcademicCycleId] = useState("");

  const { data: academicYears = [], isLoading: academicYearsLoading } = useAcademicYears(false);
  const { selectedAcademicYearId: contextYearId } = useAcademicYearContext();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);

  const { data: campuses = [] } = useSchoolUnits();
  const { data: programmes = [] } = useProgrammes();
  const { data: grades = [] } = useGrades();
  const { data: mediums = [] } = useMediums();
  const { data: cycles = [] } = useAcademicCycles(academicYearId);
  const createGrade = useCreateGrade();

  // A school has one cycle per year until it opens a second — the field only
  // appears when there is a real choice, matching admin-web.
  const mustChooseCycle = cycles.length > 1;
  const effectiveCycle = mustChooseCycle ? academicCycleId : (cycles[0]?.id ?? "");

  const sortedGrades = useMemo(
    () => [...grades].sort((a, b) => a.sequence - b.sequence),
    [grades],
  );
  const existingGrade = sortedGrades.find((g) => g.id === gradeId);
  const trimmedNewGradeName = newGradeName.trim();

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
      } else {
        setAcademicYearId(contextYearId || "");
        setCampusId("");
        setProgrammeId("");
        setGradeId("");
        setNewGradeName("");
        setMediumId("");
        setAcademicCycleId("");
      }
      setTeachersLoading(true);
      classService
        .getAvailableClassTeachers(classId)
        .then(setTeachers)
        .finally(() => setTeachersLoading(false));
    }
  }, [visible, contextYearId, initialData, classId]);

  // Header-context defaults, same intent as admin-web's ActiveUnitContext /
  // ActiveAcademicYearContext fallback: pick the one obvious answer for a
  // single-campus or single-programme school instead of asking. Only fires
  // for Create (never overwrites an edit's real values) and only once the
  // field is still unset, so it never fights a person's own choice.
  useEffect(() => {
    if (visible && !isEditMode && !campusId && campuses.length === 1) {
      setCampusId(campuses[0].id);
    }
  }, [visible, isEditMode, campuses, campusId]);

  useEffect(() => {
    if (visible && !isEditMode && !programmeId && programmes.length === 1) {
      setProgrammeId(programmes[0].id);
    }
  }, [visible, isEditMode, programmes, programmeId]);

  useEffect(() => {
    if (visible && !isEditMode && !academicYearId && academicYears.length > 0) {
      setAcademicYearId(academicYears[0].id);
    }
  }, [visible, isEditMode, academicYears, academicYearId]);

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
      setCampusId("");
      setProgrammeId("");
      setGradeId("");
      setNewGradeName("");
      setMediumId("");
      setAcademicCycleId("");
    }
    setError(null);
  };

  // Same completeness rule as admin-web's `complete` boolean: campus, year,
  // programme, a grade (picked or typed) and a section are all required;
  // the cycle joins that list only when there is more than one to choose.
  const createComplete = Boolean(
    campusId &&
      academicYearId &&
      programmeId &&
      (gradeId || trimmedNewGradeName) &&
      section.trim() &&
      (!mustChooseCycle || academicCycleId),
  );

  const handleSubmit = async () => {
    if (isEditMode) {
      if (!section.trim() || !academicYearId) {
        setError(t("modal.errSectionYear"));
        return;
      }
      if (!name.trim()) {
        setError(t("modal.errNameRequired"));
        return;
      }
    } else if (!createComplete) {
      setError(t("modal.errIncomplete"));
      return;
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
        // A grade typed rather than picked is created first — same order as
        // admin-web, which reads the grade's place in the ladder from the
        // number in its name at creation time.
        let finalGradeId = gradeId;
        if (!finalGradeId && trimmedNewGradeName) {
          try {
            const created = await createGrade.mutateAsync(trimmedNewGradeName);
            finalGradeId = created.id;
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : t("modal.errGradeCreateFailed", { name: trimmedNewGradeName }),
            );
            setLoading(false);
            return;
          }
        }
        await onSubmit({
          name: "",
          section: section.trim().toUpperCase(),
          academic_year_id: academicYearId,
          academic_cycle_id: effectiveCycle || undefined,
          school_unit_id: campusId,
          programme_id: programmeId,
          grade_id: finalGradeId,
          medium_id: mediumId || null,
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

        <ScrollView style={[styles.form, { padding: spacing.lg }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                <DatePicker
                  label={t("modal.startDate")}
                  value={startDate}
                  onChange={setStartDate}
                  placeholder={t("modal.datePlaceholder")}
                />
              </View>

              <View style={[styles.fieldContainer, { marginBottom: spacing.md }]}>
                <DatePicker
                  label={t("modal.endDate")}
                  value={endDate}
                  onChange={setEndDate}
                  placeholder={t("modal.datePlaceholder")}
                />
              </View>
            </>
          ) : (
            <>
              {/* A class is one grade, on one programme, at one campus, for one
                  academic year — same fields, same order as admin-web's
                  Create Class. */}
              <View style={{ marginBottom: spacing.md }}>
                <SelectSheet
                  label={t("modal.campus")}
                  value={campusId || null}
                  onChange={(v) => setCampusId(v || "")}
                  options={campuses.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder={t("modal.campusPlaceholder")}
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

              {mustChooseCycle ? (
                <View style={[styles.fieldContainer, { marginBottom: spacing.md }]}>
                  <Text variant="labelMd" color="onSurface" style={{ marginBottom: spacing.xs }}>{t("modal.academicCycle")}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xs }}>
                    {cycles.map((cycle) =>
                      renderChip(academicCycleId === cycle.id, cycle.name, () => setAcademicCycleId(cycle.id), cycle.id)
                    )}
                  </ScrollView>
                  <Text variant="bodySm" color="onSurfaceVariant">{t("modal.academicCycleHint")}</Text>
                </View>
              ) : null}

              <View style={{ marginBottom: spacing.md }}>
                <SelectSheet
                  label={t("modal.programme")}
                  value={programmeId || null}
                  onChange={(v) => setProgrammeId(v || "")}
                  options={programmes.map((p) => ({ value: p.id, label: p.name }))}
                  placeholder={t("modal.programmePlaceholder")}
                />
                {programmes.length === 0 ? (
                  <Text variant="bodySm" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
                    {t("modal.noProgrammes")}
                  </Text>
                ) : null}
              </View>

              <View style={{ marginBottom: spacing.md }}>
                <SelectSheet
                  label={t("modal.grade")}
                  value={gradeId || null}
                  onChange={(v) => {
                    setGradeId(v || "");
                    if (v) setNewGradeName("");
                  }}
                  options={sortedGrades.map((g) => ({ value: g.id, label: g.name }))}
                  placeholder={t("modal.gradePlaceholder")}
                  disabled={!!trimmedNewGradeName}
                />
                <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
                  {t("modal.gradeOr")}
                </Text>
                <TextInput
                  style={inputStyle}
                  value={newGradeName}
                  onChangeText={(v) => {
                    setNewGradeName(v);
                    if (v.trim()) setGradeId("");
                  }}
                  placeholder={t("modal.gradeNewPlaceholder")}
                  placeholderTextColor={palette.outline}
                  editable={!gradeId}
                />
                {trimmedNewGradeName ? (
                  <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
                    {t("modal.gradeNewHint", { name: trimmedNewGradeName })}
                  </Text>
                ) : null}
              </View>

              <View style={[styles.fieldContainer, { marginBottom: spacing.md }]}>
                <Text variant="labelMd" color="onSurface" style={{ marginBottom: spacing.xs }}>{t("modal.section")}</Text>
                <TextInput
                  style={inputStyle}
                  value={section}
                  onChangeText={setSection}
                  placeholder={t("modal.placeholderSection")}
                  placeholderTextColor={palette.outline}
                  maxLength={8}
                  autoCapitalize="characters"
                />
              </View>

              <View style={{ marginBottom: spacing.md }}>
                <SelectSheet
                  label={t("modal.mediumOptional")}
                  value={mediumId || null}
                  onChange={(v) => setMediumId(v || "")}
                  options={mediums.map((m) => ({ value: m.id, label: m.name }))}
                  placeholder={t("modal.mediumPlaceholder")}
                  allowEmpty
                  emptyLabel={t("modal.none")}
                />
              </View>

              {createComplete ? (
                <View
                  style={{
                    backgroundColor: palette.surfaceContainerLow,
                    borderRadius: radius.sm,
                    padding: spacing.md,
                    marginBottom: spacing.md,
                  }}
                >
                  <Text variant="bodySm" color="onSurfaceVariant">
                    {t("modal.previewLabel", {
                      label: `${existingGrade?.name ?? trimmedNewGradeName} ${section.trim().toUpperCase()}`.trim(),
                    })}
                  </Text>
                </View>
              ) : null}
            </>
          )}

          <PressScale
            style={[
              styles.submitButton,
              { backgroundColor: palette.primary, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.lg },
              (loading || (!isEditMode && !createComplete)) && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={loading || (!isEditMode && !createComplete)}
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
