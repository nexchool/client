import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Switch,
  SafeAreaView,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useStructures,
  useAcademicYears,
  useClasses,
  useAvailableClassesForStructure,
  useCreateStructure,
  useUpdateStructure,
} from "@/modules/finance/hooks/useFinance";
import { useAcademicYearContext } from "@/modules/academics/context/AcademicYearContext";
import type { FeeStructure } from "@/modules/finance/types";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { ClassMultiSelect } from "@/common/components/ClassMultiSelect";
import { calendarLocaleForLanguage } from "@/i18n";
import { DateField } from "@/common/components/DateField";

function formatDate(s: string, locale: string) {
  try {
    return new Date(s).toLocaleDateString(locale);
  } catch {
    return s;
  }
}

export default function FeeStructuresPage() {
  const { t, i18n } = useTranslation("finance");
  const locale = calendarLocaleForLanguage(i18n.language ?? "en");
  const router = useRouter();
  const { selectedAcademicYearId: contextYearId } = useAcademicYearContext();
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: academicYears = [] } = useAcademicYears(false);
  const { data: classes = [] } = useClasses();

  useEffect(() => {
    if (contextYearId) setAcademicYearFilter((prev) => (prev === "" ? contextYearId : prev));
  }, [contextYearId]);

  const { data: structures = [], isLoading, error, refetch, isRefetching } = useStructures({
    academic_year_id: academicYearFilter || undefined,
  });

  const createMut = useCreateStructure();
  const updateMut = useUpdateStructure();

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : t("common.failedToLoad")}
        </Text>
      </View>
    );
  }

  const renderStructureItem = ({ item: s }: { item: FeeStructure }) => (
    <TouchableOpacity
      style={styles.classCard}
      onPress={() => router.push(`/(protected)/finance/structures/${s.id}` as never)}
      activeOpacity={0.7}
    >
      <View style={styles.classIcon}>
        <Ionicons name="layers" size={24} color={Colors.primary} />
      </View>
      <View style={styles.classInfo}>
        <Text style={styles.className}>{s.name}</Text>
        <Text style={styles.classDetail}>
          {t("structures.classDetail", {
            classes: s.class_name ?? t("common.allClasses"),
            date: formatDate(s.due_date, locale),
          })}
        </Text>
        {s.components?.length ? (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="document-text-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.statText}>
                {t("common.componentsLine", { count: s.components.length })}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("structures.title")}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalOpen(true)}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>{t("structures.academicYear")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !academicYearFilter && styles.filterChipActive]}
            onPress={() => setAcademicYearFilter("")}
          >
            <Text style={[styles.filterChipText, !academicYearFilter && styles.filterChipTextActive]}>
              {t("common.all")}
            </Text>
          </TouchableOpacity>
          {academicYears.map((ay) => (
            <TouchableOpacity
              key={ay.id}
              style={[styles.filterChip, academicYearFilter === ay.id && styles.filterChipActive]}
              onPress={() => setAcademicYearFilter(academicYearFilter === ay.id ? "" : ay.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  academicYearFilter === ay.id && styles.filterChipTextActive,
                ]}
              >
                {ay.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading && structures.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={structures}
          keyExtractor={(item) => item.id}
          renderItem={renderStructureItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="layers-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>{t("structures.emptyTitle")}</Text>
              <Text style={styles.emptySubtext}>
                {t("structures.emptySubtext")}
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => setModalOpen(true)}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyCtaText}>{t("structures.createStructure")}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

        <StructureModal
          visible={modalOpen}
          onClose={() => setModalOpen(false)}
          editingId={null}
          structures={structures}
          academicYears={academicYears}
          allClasses={classes}
          defaultAcademicYearId={contextYearId ?? undefined}
          onCreate={async (data) => {
            await createMut.mutateAsync(data);
            setModalOpen(false);
          }}
          onUpdate={async (id, data) => {
            await updateMut.mutateAsync({ id, data });
            setModalOpen(false);
          }}
          isCreating={createMut.isPending}
          isUpdating={updateMut.isPending}
        />
    </SafeAreaView>
  );
}

interface StructureModalProps {
  visible: boolean;
  onClose: () => void;
  editingId: string | null;
  structures: FeeStructure[];
  academicYears: { id: string; name: string }[];
  allClasses: { id: string; name: string; section?: string }[];
  defaultAcademicYearId?: string;
  onCreate: (data: {
    name: string;
    academic_year_id: string;
    due_date: string;
    class_ids?: string[];
    components: { name: string; amount: number; is_optional: boolean }[];
  }) => Promise<void>;
  onUpdate: (id: string, data: { name?: string; due_date?: string; class_ids?: string[]; components?: { name: string; amount: number; is_optional: boolean }[] }) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
}

function StructureModal({
  visible,
  onClose,
  editingId,
  structures,
  academicYears,
  allClasses,
  defaultAcademicYearId,
  onCreate,
  onUpdate,
  isCreating,
  isUpdating,
}: StructureModalProps) {
  const { t } = useTranslation("finance");
  const editing = editingId ? structures.find((s) => s.id === editingId) : null;

  const [name, setName] = useState(editing?.name ?? "");
  const [academicYearId, setAcademicYearId] = useState(
    editing?.academic_year_id ?? defaultAcademicYearId ?? ""
  );
  const [classIds, setClassIds] = useState<string[]>(
    editing?.class_ids ?? (editing?.class_id ? [editing.class_id] : [])
  );
  const [dueDate, setDueDate] = useState(editing?.due_date ?? "");
  const [components, setComponents] = useState<
    { name: string; amount: string; is_optional: boolean }[]
  >(
    editing?.components?.map((c) => ({
      name: c.name,
      amount: String(c.amount ?? 0),
      is_optional: c.is_optional ?? false,
    })) ?? [{ name: "", amount: "", is_optional: false }]
  );

  useEffect(() => {
    if (visible) {
      setName(editing?.name ?? "");
      setAcademicYearId(editing?.academic_year_id ?? defaultAcademicYearId ?? "");
      setClassIds(editing?.class_ids ?? (editing?.class_id ? [editing.class_id] : []));
      setDueDate(editing?.due_date ?? "");
      setComponents(
        editing?.components?.map((c) => ({
          name: c.name,
          amount: String(c.amount ?? 0),
          is_optional: c.is_optional ?? false,
        })) ?? [{ name: "", amount: "", is_optional: false }]
      );
    }
  }, [visible, editingId, editing, defaultAcademicYearId]);

  const addComponent = () => {
    setComponents([...components, { name: "", amount: "", is_optional: false }]);
  };

  const removeComponent = (i: number) => {
    if (components.length <= 1) return;
    setComponents(components.filter((_, idx) => idx !== i));
  };

  const updateComponent = (i: number, field: string, value: string | boolean) => {
    const next = [...components];
    if (field === "name") next[i] = { ...next[i], name: value as string };
    else if (field === "amount") next[i] = { ...next[i], amount: value as string };
    else if (field === "is_optional") next[i] = { ...next[i], is_optional: value as boolean };
    setComponents(next);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("structures.modal.alerts.nameRequired"));
      return;
    }
    if (!editingId && !academicYearId) {
      Alert.alert(t("common.error"), t("structures.modal.alerts.yearRequired"));
      return;
    }
    if (!dueDate.trim()) {
      Alert.alert(t("common.error"), t("structures.modal.alerts.dueRequired"));
      return;
    }
    const comps = components
      .filter((c) => c.name.trim() && c.amount.trim())
      .map((c) => ({
        name: c.name.trim(),
        amount: parseFloat(c.amount) || 0,
        is_optional: c.is_optional,
      }));
    if (!editingId && comps.length === 0) {
      Alert.alert(t("common.error"), t("structures.modal.alerts.componentsCreate"));
      return;
    }
    if (editingId && comps.length === 0) {
      Alert.alert(t("common.error"), t("structures.modal.alerts.componentsEdit"));
      return;
    }

    try {
      if (editingId) {
        await onUpdate(editingId, {
          name: name.trim(),
          due_date: dueDate.trim(),
          class_ids: classIds,
          components: comps,
        });
      } else {
        await onCreate({
          name: name.trim(),
          academic_year_id: academicYearId,
          class_ids: classIds,
          due_date: dueDate.trim(),
          components: comps,
        });
      }
    } catch (e: unknown) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("structures.modal.alerts.saveFailed"));
    }
  };

  const effectiveAcademicYearId = academicYearId || (editing?.academic_year_id ?? "");
  const { data: availableClasses = [] } = useAvailableClassesForStructure(
    effectiveAcademicYearId || undefined,
    editingId ?? undefined,
    visible && !!effectiveAcademicYearId
  );
  const classOptions = availableClasses.map((c) => ({
    id: c.id,
    label: c.section ? `${c.name}-${c.section}` : c.name,
    name: c.name,
    section: c.section,
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingId ? t("structures.modal.editTitle") : t("structures.modal.createTitle")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>{t("structures.modal.structureName")}</Text>
            <Text style={styles.helperText}>{t("structures.modal.structureNameHint")}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t("structures.modal.namePlaceholder")}
            />

            {!editingId && (
              <>
                <Text style={styles.inputLabel}>{t("structures.modal.academicYear")}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipRow}
                >
                  {academicYears.map((ay) => (
                    <TouchableOpacity
                      key={ay.id}
                      style={[styles.formChip, academicYearId === ay.id && styles.formChipActive]}
                      onPress={() => setAcademicYearId(ay.id)}
                    >
                      <Text
                        style={[
                          styles.formChipText,
                          academicYearId === ay.id && styles.formChipTextActive,
                        ]}
                      >
                        {ay.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.inputLabel}>{t("structures.modal.classes")}</Text>
            <Text style={styles.helperText}>
              {t("structures.modal.classesHint")}
            </Text>
            <ClassMultiSelect
              value={classIds}
              onChange={setClassIds}
              options={classOptions}
              placeholder={t("structures.modal.classesPlaceholder")}
            />

            <DateField
              label={t("structures.modal.dueDate")}
              value={dueDate}
              onChange={setDueDate}
              placeholder={t("structures.modal.dueDatePlaceholder")}
            />

            <View style={styles.componentHeader}>
              <Text style={styles.inputLabel}>{t("structures.modal.components")}</Text>
              <TouchableOpacity onPress={addComponent} style={styles.addComponentBtn}>
                <Ionicons name="add" size={20} color={Colors.primary} />
                <Text style={styles.addComponentText}>{t("structures.modal.add")}</Text>
              </TouchableOpacity>
            </View>
            {components.map((c, i) => (
              <View key={i} style={styles.componentFormRow}>
                <TextInput
                  style={[styles.input, styles.componentInput]}
                  value={c.name}
                  onChangeText={(v) => updateComponent(i, "name", v)}
                  placeholder={t("structures.modal.componentName")}
                />
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  value={c.amount}
                  onChangeText={(v) => updateComponent(i, "amount", v)}
                  placeholder={t("structures.modal.amount")}
                  keyboardType="decimal-pad"
                />
                <View style={styles.optionalRow}>
                  <Text style={styles.optionalLabel}>{t("structures.modal.optional")}</Text>
                  <Switch
                    value={c.is_optional}
                    onValueChange={(v) => updateComponent(i, "is_optional", v)}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => removeComponent(i)}
                  disabled={components.length <= 1}
                  style={styles.removeBtn}
                >
                  <Ionicons name="remove-circle-outline" size={22} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>{t("structures.modal.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, (isCreating || isUpdating) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <Text style={styles.submitBtnText}>{editingId ? t("structures.modal.update") : t("structures.modal.create")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backIcon: { padding: Spacing.sm, marginRight: Spacing.sm },
  headerTitle: { flex: 1, fontSize: 24, fontWeight: "bold", color: Colors.text },
  addButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
  },
  filterSection: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.sm },
  filterScroll: { marginTop: Spacing.xs },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    marginRight: Spacing.sm,
  },
  filterChipActive: { backgroundColor: Colors.primary },
  filterChipText: { fontSize: 14, color: Colors.text },
  filterChipTextActive: { fontSize: 14, color: Colors.background, fontWeight: "600" },
  listContent: { padding: Spacing.md },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },
  classCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  classIcon: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  classInfo: { flex: 1 },
  className: { fontSize: 16, fontWeight: "600", color: Colors.text },
  classDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: "row", marginTop: Spacing.xs, gap: Spacing.md },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, color: Colors.textSecondary },
  cardActions: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  actionBtn: { alignItems: "center", paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  actionLabel: { fontSize: 10, color: Colors.primary, marginTop: 2 },
  actionBtnDanger: {},
  actionLabelDanger: { fontSize: 10, color: Colors.error, marginTop: 2 },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: Colors.text, marginTop: Spacing.md },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
  },
  emptyCtaText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  errorText: { color: Colors.error, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  modalBody: { padding: Spacing.lg, maxHeight: 400 },
  modalFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  inputLabel: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: Spacing.sm },
  helperText: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  chipRow: { marginBottom: Spacing.md },
  formChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    marginRight: Spacing.sm,
  },
  formChipActive: { backgroundColor: Colors.primary },
  formChipText: { fontSize: 14, color: Colors.text },
  formChipTextActive: { fontSize: 14, color: Colors.background, fontWeight: "600" },
  componentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  componentFormRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm },
  componentInput: { flex: 1, marginRight: Spacing.sm },
  amountInput: { width: 90, marginRight: Spacing.sm },
  optionalRow: { flexDirection: "row", alignItems: "center", marginRight: Spacing.sm },
  optionalLabel: { fontSize: 12, color: Colors.textSecondary, marginRight: Spacing.xs },
  removeBtn: { padding: Spacing.sm },
  addComponentBtn: { flexDirection: "row", alignItems: "center" },
  addComponentText: { fontSize: 14, color: Colors.primary, marginLeft: Spacing.xs },
  cancelBtn: { flex: 1, padding: Spacing.md, alignItems: "center" },
  cancelBtnText: { fontSize: 16, color: Colors.textSecondary },
  submitBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontWeight: "600", color: Colors.background },
});
