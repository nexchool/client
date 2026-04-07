import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSubjects } from "../hooks/useSubjects";
import { CreateSubjectModal } from "../components/CreateSubjectModal";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { Subject, CreateSubjectDTO } from "../types";
import { classService } from "@/modules/classes/services/classService";
import { useAcademicYears } from "@/modules/academics/hooks/useAcademicYears";
import { useAcademicYearContext } from "@/modules/academics/context/AcademicYearContext";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function SubjectsScreen() {
  const { t } = useTranslation("subjects");
  const { subjects, loading, fetchSubjects, createSubject, updateSubject, deleteSubject } =
    useSubjects();
  const { hasPermission } = usePermissions();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const canCreate = hasPermission(PERMS.SUBJECT_CREATE);
  const canUpdate = hasPermission(PERMS.SUBJECT_UPDATE);
  const canDelete = hasPermission(PERMS.SUBJECT_DELETE);
  const canApplyToGrade =
    hasPermission(PERMS.CLASS_SUBJECT_MANAGE) || hasPermission(PERMS.CLASS_MANAGE);

  const { selectedAcademicYearId } = useAcademicYearContext();
  const { data: academicYears = [] } = useAcademicYears(false);
  const [gradeApplyYear, setGradeApplyYear] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [gradeWeekly, setGradeWeekly] = useState("5");
  const [gradeSubjectId, setGradeSubjectId] = useState<string | null>(null);
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [gradeApplyBusy, setGradeApplyBusy] = useState(false);

  useEffect(() => {
    if (selectedAcademicYearId) setGradeApplyYear(selectedAcademicYearId);
  }, [selectedAcademicYearId]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const filteredSubjects = useMemo(() => {
    if (!debouncedSearch.trim()) return subjects;
    const q = debouncedSearch.toLowerCase().trim();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code?.toLowerCase().includes(q) ?? false) ||
        (s.description?.toLowerCase().includes(q) ?? false)
    );
  }, [subjects, debouncedSearch]);

  const handleCreate = () => {
    setEditingSubject(null);
    setModalVisible(true);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingSubject(null);
  };

  const handleCreateSubject = async (data: CreateSubjectDTO) => {
    try {
      await createSubject(data);
      handleModalClose();
      Alert.alert(t("list.success"), t("list.created"));
      fetchSubjects();
    } catch (error: any) {
      throw error;
    }
  };

  const handleUpdateSubject = async (data: CreateSubjectDTO) => {
    if (!editingSubject) return;
    try {
      await updateSubject(editingSubject.id, data);
      handleModalClose();
      Alert.alert(t("list.success"), t("list.updated"));
      fetchSubjects();
    } catch (error: any) {
      throw error;
    }
  };

  const handleSubmit = editingSubject ? handleUpdateSubject : handleCreateSubject;

  const handleApplyToGrade = async () => {
    if (!gradeApplyYear || !gradeLevel.trim() || !gradeSubjectId) {
      Alert.alert(t("list.missingFieldsTitle"), t("list.missingFieldsBody"));
      return;
    }
    const gl = parseInt(gradeLevel.trim(), 10);
    const wk = parseInt(gradeWeekly.trim(), 10);
    if (Number.isNaN(gl) || gl < 1 || gl > 20) {
      Alert.alert(t("list.invalidGradeTitle"), t("list.invalidGradeBody"));
      return;
    }
    if (Number.isNaN(wk) || wk < 1) {
      Alert.alert(t("list.invalidPeriodsTitle"), t("list.invalidPeriodsBody"));
      return;
    }
    try {
      setGradeApplyBusy(true);
      const r = await classService.applySubjectToGrade({
        academic_year_id: gradeApplyYear,
        grade_level: gl,
        subject_id: gradeSubjectId,
        weekly_periods: wk,
      });
      let message = t("list.appliedBody", { count: r.applied_count });
      if (r.skipped?.length > 0) {
        message += t("list.appliedSkipped", { count: r.skipped.length });
      }
      Alert.alert(t("list.appliedTitle"), message);
    } catch (e: any) {
      Alert.alert(t("list.errorTitle"), e.message || t("list.applyError"));
    } finally {
      setGradeApplyBusy(false);
    }
  };

  const handleDelete = (subject: Subject) => {
    Alert.alert(t("list.deleteTitle"), t("list.deleteMessage", { name: subject.name }), [
      { text: t("list.cancel"), style: "cancel" },
      {
        text: t("list.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSubject(subject.id);
            Alert.alert(t("list.success"), t("list.deleted"));
            fetchSubjects();
          } catch (error: any) {
            Alert.alert(t("list.errorTitle"), error.message || t("list.deleteError"));
          }
        },
      },
    ]);
  };

  const renderSubjectCard = ({ item }: { item: Subject }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardIcon}>
          <Ionicons name="book" size={24} color={Colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          {item.code && (
            <Text style={styles.cardCode}>{t("list.codeLabel", { code: item.code })}</Text>
          )}
          {item.description ? (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.cardActions}>
        {canUpdate && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="pencil" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
        {canDelete && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("list.title")}</Text>
        {canCreate && (
          <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {canApplyToGrade ? (
        <View style={styles.gradeCard}>
          <Text style={styles.gradeCardTitle}>{t("list.gradeCardTitle")}</Text>
          <Text style={styles.gradeCardHint}>{t("list.gradeCardHint")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {academicYears.map((ay) => (
              <TouchableOpacity
                key={ay.id}
                style={[styles.chip, gradeApplyYear === ay.id && styles.chipActive]}
                onPress={() => setGradeApplyYear(ay.id)}
              >
                <Text style={[styles.chipText, gradeApplyYear === ay.id && styles.chipTextActive]}>{ay.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.gradeRow}>
            <View style={styles.gradeField}>
              <Text style={styles.gradeLabel}>{t("list.standard")}</Text>
              <TextInput
                style={styles.gradeInput}
                value={gradeLevel}
                onChangeText={setGradeLevel}
                placeholder="10"
                keyboardType="number-pad"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <View style={styles.gradeField}>
              <Text style={styles.gradeLabel}>{t("list.periodsPerWeek")}</Text>
              <TextInput
                style={styles.gradeInput}
                value={gradeWeekly}
                onChangeText={setGradeWeekly}
                placeholder="5"
                keyboardType="number-pad"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.subjectPick} onPress={() => setSubjectPickerOpen(true)}>
            <Text style={styles.subjectPickTxt}>
              {gradeSubjectId
                ? subjects.find((s) => s.id === gradeSubjectId)?.name ?? t("list.selectedSubject")
                : t("list.selectSubjectPrompt")}
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyBtn, gradeApplyBusy && styles.applyBtnDisabled]}
            onPress={handleApplyToGrade}
            disabled={gradeApplyBusy}
          >
            {gradeApplyBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.applyBtnTxt}>{t("list.applyButton")}</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>{t("list.sectionCatalog")}</Text>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("list.searchPlaceholder")}
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading && subjects.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredSubjects}
          keyExtractor={(item) => item.id}
          renderItem={renderSubjectCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => fetchSubjects()} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {searchQuery ? t("list.emptySearch") : t("list.emptyNone")}
              </Text>
            </View>
          }
        />
      )}

      {(canCreate || canUpdate) && (
        <CreateSubjectModal
          visible={modalVisible}
          onClose={handleModalClose}
          onSubmit={handleSubmit}
          initialData={editingSubject}
          mode={editingSubject ? "edit" : "create"}
        />
      )}

      <Modal visible={subjectPickerOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setSubjectPickerOpen(false)}>
              <Text style={styles.pickerCancel}>{t("list.pickerCancel")}</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>{t("list.pickerTitle")}</Text>
            <View style={{ width: 56 }} />
          </View>
          <FlatList
            data={subjects}
            keyExtractor={(s) => s.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => {
                  setGradeSubjectId(item.id);
                  setSubjectPickerOpen(false);
                }}
              >
                <Text style={styles.pickerRowTxt}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t("list.pickerEmpty")}</Text>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: Colors.text },
  addButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    margin: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: 16, color: Colors.text, padding: Spacing.sm },
  listContent: { padding: Spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  cardContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: "600", color: Colors.text },
  cardCode: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardDescription: { fontSize: 13, color: Colors.textTertiary, marginTop: 4 },
  cardActions: { flexDirection: "row", gap: Spacing.sm },
  actionButton: { padding: Spacing.sm },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  gradeCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  gradeCardTitle: { fontSize: 16, fontWeight: "600", color: Colors.text, marginBottom: Spacing.xs },
  gradeCardHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 18 },
  chipRow: { marginBottom: Spacing.sm },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + "18" },
  chipText: { fontSize: 13, color: Colors.text },
  chipTextActive: { color: Colors.primary, fontWeight: "600" },
  gradeRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.sm },
  gradeField: { flex: 1 },
  gradeLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  gradeInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Layout.borderRadius.sm,
    padding: Spacing.sm,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  subjectPick: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  subjectPickTxt: { fontSize: 15, color: Colors.text, flex: 1 },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
  },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnTxt: { color: "#fff", fontWeight: "600", fontSize: 15 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  pickerModal: { flex: 1, backgroundColor: Colors.background },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerCancel: { fontSize: 16, color: Colors.primary },
  pickerTitle: { fontSize: 17, fontWeight: "600", color: Colors.text },
  pickerRow: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  pickerRowTxt: { fontSize: 16, color: Colors.text },
});
