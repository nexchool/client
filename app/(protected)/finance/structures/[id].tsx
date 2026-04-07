import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useStructure,
  useAcademicYears,
  useAvailableClassesForStructure,
  useUpdateStructure,
  useDeleteStructure,
} from "@/modules/finance/hooks/useFinance";
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

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function FeeStructureInfoPage() {
  const { t, i18n } = useTranslation("finance");
  const locale = calendarLocaleForLanguage(i18n.language ?? "en");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: structure, isLoading, error, refetch } = useStructure(id);
  const { data: academicYears = [] } = useAcademicYears(false);

  const updateMut = useUpdateStructure();
  const deleteMut = useDeleteStructure();

  const academicYearName =
    academicYears.find((ay) => ay.id === structure?.academic_year_id)?.name ?? structure?.academic_year_id ?? "—";

  const handleEdit = () => setModalOpen(true);

  const handleDelete = () => {
    if (!structure) return;
    Alert.alert(
      t("structureDetail.deleteTitle"),
      t("structureDetail.deleteMessage", { name: structure.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMut.mutateAsync(structure.id);
              router.back();
            } catch (e: unknown) {
              Alert.alert(t("common.error"), e instanceof Error ? e.message : t("structureDetail.deleteFailed"));
            }
          },
        },
      ]
    );
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : t("common.failedToLoad")}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || !structure) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("structureDetail.title")}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleDelete} style={styles.headerIconBtn}>
            <Ionicons name="trash-outline" size={24} color={Colors.error} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEdit} style={styles.headerIconBtn}>
            <Ionicons name="create-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{structure.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("structureDetail.academicYear")}</Text>
          <Text style={styles.sectionValue}>{academicYearName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("structureDetail.dueDate")}</Text>
          <Text style={styles.sectionValue}>{formatDate(structure.due_date, locale)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("structureDetail.classes")}</Text>
          <Text style={styles.sectionValue}>
            {structure.class_name ?? t("common.allClasses")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("structureDetail.components")}</Text>
          {structure.components?.length ? (
            <View style={styles.componentsList}>
              {structure.components.map((c) => (
                <View key={c.id} style={styles.componentRow}>
                  <Text style={styles.componentName}>
                    {c.name} {c.is_optional ? t("structureDetail.optionalSuffix") : ""}
                  </Text>
                  <Text style={styles.componentAmount}>{formatCurrency(c.amount)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>{t("structureDetail.noComponents")}</Text>
          )}
        </View>
      </ScrollView>

      {modalOpen && (
        <StructureEditModal
          visible={modalOpen}
          onClose={() => setModalOpen(false)}
          structure={structure}
          onUpdate={async (data) => {
            await updateMut.mutateAsync({ id: structure.id, data });
            setModalOpen(false);
          }}
          isUpdating={updateMut.isPending}
        />
      )}
    </SafeAreaView>
  );
}

interface StructureEditModalProps {
  visible: boolean;
  onClose: () => void;
  structure: FeeStructure;
  onUpdate: (data: { name?: string; due_date?: string; class_ids?: string[]; components?: { name: string; amount: number; is_optional: boolean }[] }) => Promise<void>;
  isUpdating: boolean;
}

function StructureEditModal({
  visible,
  onClose,
  structure,
  onUpdate,
  isUpdating,
}: StructureEditModalProps) {
  const { t } = useTranslation("finance");
  const [name, setName] = useState(structure.name ?? "");
  const [classIds, setClassIds] = useState<string[]>(structure.class_ids ?? []);
  const [dueDate, setDueDate] = useState(structure.due_date ?? "");
  const [components, setComponents] = useState<{ name: string; amount: string; is_optional: boolean }[]>(
    structure.components?.map((c) => ({
      name: c.name,
      amount: String(c.amount ?? 0),
      is_optional: c.is_optional ?? false,
    })) ?? []
  );

  React.useEffect(() => {
    if (visible) {
      setName(structure.name ?? "");
      setClassIds(structure.class_ids ?? []);
      setDueDate(structure.due_date ?? "");
      setComponents(
        structure.components?.map((c) => ({
          name: c.name,
          amount: String(c.amount ?? 0),
          is_optional: c.is_optional ?? false,
        })) ?? []
      );
    }
  }, [visible, structure]);

  const { data: availableClasses = [] } = useAvailableClassesForStructure(
    structure.academic_year_id,
    structure.id,
    visible
  );
  const classOptions = availableClasses.map((c) => ({
    id: c.id,
    label: c.section ? `${c.name}-${c.section}` : c.name,
    name: c.name,
    section: c.section,
  }));

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
    if (comps.length === 0) {
      Alert.alert(t("common.error"), t("structures.modal.alerts.componentsEdit"));
      return;
    }
    try {
      await onUpdate({
        name: name.trim(),
        due_date: dueDate.trim(),
        class_ids: classIds,
        components: comps,
      });
    } catch (e: unknown) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("structures.modal.alerts.saveFailed"));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("structures.modal.editTitle")}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>{t("structures.modal.structureName")}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t("structures.modal.namePlaceholder")}
            />
            <Text style={styles.inputLabel}>{t("structures.modal.classes")}</Text>
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
              style={[styles.submitBtn, isUpdating && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <Text style={styles.submitBtnText}>{t("structures.modal.update")}</Text>
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
  headerTitle: { flex: 1, fontSize: 22, fontWeight: "bold", color: Colors.text },
  headerActions: { flexDirection: "row", gap: Spacing.sm, alignItems: "center" },
  headerIconBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
  },
  actionLabel: { fontSize: 11, color: Colors.primary, marginTop: 2 },
  actionBtnDanger: {},
  actionLabelDanger: { fontSize: 11, color: Colors.error, marginTop: 2 },
  content: { flex: 1 },
  contentContainer: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", color: Colors.text },
  section: { marginBottom: Spacing.lg },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.xs },
  sectionValue: { fontSize: 16, color: Colors.text, fontWeight: "500" },
  componentsList: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
    overflow: "hidden",
  },
  componentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  componentName: { fontSize: 15, color: Colors.text },
  componentAmount: { fontSize: 15, fontWeight: "600", color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  errorText: { color: Colors.error, fontSize: 16, marginBottom: Spacing.md },
  retryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
  },
  retryBtnText: { color: "#fff", fontWeight: "600" },

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
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
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
  submitBtn: { flex: 1, backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Layout.borderRadius.md, alignItems: "center" },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontWeight: "600", color: Colors.background },
});
