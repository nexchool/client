import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useStructure,
  useAcademicYears,
  useAvailableClassesForStructure,
  useUpdateStructure,
  useDeleteStructure,
} from "@/modules/finance/hooks/useFinance";
import type { FeeStructure } from "@/modules/finance/types";
import { ClassMultiSelect } from "@/common/components/ClassMultiSelect";
import { calendarLocaleForLanguage } from "@/i18n";
import { DatePicker } from '@/common/components/datepicker';
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { DetailCard } from "@/common/components/DetailCard";
import { DetailRow } from "@/common/components/DetailRow";
import { EmptyState } from "@/common/components/EmptyState";

function formatDate(s: string, locale: string) {
  try {
    return new Date(s).toLocaleDateString(locale);
  } catch {
    return s;
  }
}

function formatCurrency(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

export default function FeeStructureInfoPage() {
  const { t, i18n } = useTranslation("finance");
  const locale = calendarLocaleForLanguage(i18n.language ?? "en");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: structure, isLoading, error, refetch } = useStructure(id);
  const { data: academicYears = [] } = useAcademicYears(false);

  const updateMut = useUpdateStructure();
  const deleteMut = useDeleteStructure();

  const academicYearName =
    academicYears.find((ay) => ay.id === structure?.academic_year_id)?.name ??
    structure?.academic_year_id ??
    "—";

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
              Alert.alert(
                t("common.error"),
                e instanceof Error
                  ? e.message
                  : t("structureDetail.deleteFailed")
              );
            }
          },
        },
      ]
    );
  };

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <BackHeader title={t("structureDetail.title")} />
        <EmptyState
          icon={<AppIcon name="alert-circle-outline" size="xl" color="error" />}
          title={
            error instanceof Error ? error.message : t("common.failedToLoad")
          }
          action={{ label: t("common.retry"), onPress: () => refetch() }}
        />
      </View>
    );
  }

  if (isLoading || !structure) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <BackHeader title={t("structureDetail.title")} />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: spacing.xl,
          }}
        >
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </View>
    );
  }

  const componentsTotal = (structure.components ?? []).reduce(
    (sum, c) => sum + (c.amount ?? 0),
    0
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          gap: spacing.sm,
        }}
      >
        <AppIcon
          name="arrow-back"
          size="lg"
          color="onSurface"
          onPress={() => router.back()}
          accessibilityLabel="Back"
        />
        <Text variant="headlineLg" color="onSurface" style={{ flex: 1 }}>
          {t("structureDetail.title")}
        </Text>
        <AppIcon
          name="trash-outline"
          size="lg"
          color="error"
          onPress={handleDelete}
          accessibilityLabel={t("common.delete")}
        />
        <AppIcon
          name="create-outline"
          size="lg"
          color="primary"
          onPress={handleEdit}
          accessibilityLabel={t("structures.modal.editTitle")}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.marginMobile,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xl * 2,
          gap: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — structure name + total */}
        <View
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
              borderLeftWidth: 4,
              borderLeftColor: palette.primary,
            },
          ]}
        >
          <Text variant="headlineLg" color="onSurface" numberOfLines={2}>
            {structure.name}
          </Text>
          <Text
            variant="display"
            color="onSurface"
            style={{ marginTop: spacing.md }}
          >
            {formatCurrency(componentsTotal)}
          </Text>
          <Text variant="labelMd" color="onSurfaceVariant" style={{ marginTop: 2 }}>
            {t("common.componentsLine", {
              count: structure.components?.length ?? 0,
            })}
          </Text>
        </View>

        {/* Info rows */}
        <DetailCard title={t("structureDetail.title")}>
          <DetailRow
            icon="calendar-outline"
            label={t("structureDetail.academicYear")}
            value={academicYearName}
          />
          <DetailRow
            icon="time-outline"
            label={t("structureDetail.dueDate")}
            value={formatDate(structure.due_date, locale)}
          />
          <DetailRow
            icon="people-outline"
            label={t("structureDetail.classes")}
            value={structure.class_name ?? t("common.allClasses")}
          />
        </DetailCard>

        {/* Components */}
        <View
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
            },
          ]}
        >
          <Text
            variant="headlineMd"
            color="onSurface"
            style={{ marginBottom: spacing.md }}
          >
            {t("structureDetail.components")}
          </Text>
          {structure.components?.length ? (
            structure.components.map((c, idx) => (
              <View
                key={c.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: spacing.sm,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: palette.outlineVariant,
                }}
              >
                <Text
                  variant="bodyMd"
                  color="onSurface"
                  style={{ flex: 1, marginRight: spacing.sm }}
                  numberOfLines={1}
                >
                  {c.name}
                  {c.is_optional
                    ? ` ${t("structureDetail.optionalSuffix")}`
                    : ""}
                </Text>
                <Text variant="labelMd" color="onSurface">
                  {formatCurrency(c.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text variant="bodyMd" color="onSurfaceVariant">
              {t("structureDetail.noComponents")}
            </Text>
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
    </View>
  );
}

function BackHeader({ title }: { title: string }) {
  const { spacing } = useTheme();
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.marginMobile,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        gap: spacing.sm,
      }}
    >
      <AppIcon
        name="arrow-back"
        size="lg"
        color="onSurface"
        onPress={() => router.back()}
        accessibilityLabel="Back"
      />
      <Text variant="headlineLg" color="onSurface" numberOfLines={1} style={{ flex: 1 }}>
        {title}
      </Text>
    </View>
  );
}

interface StructureEditModalProps {
  visible: boolean;
  onClose: () => void;
  structure: FeeStructure;
  onUpdate: (data: {
    name?: string;
    due_date?: string;
    class_ids?: string[];
    components?: { name: string; amount: number; is_optional: boolean }[];
  }) => Promise<void>;
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
  const { palette, spacing, radius } = useTheme();
  const [name, setName] = useState(structure.name ?? "");
  const [classIds, setClassIds] = useState<string[]>(structure.class_ids ?? []);
  const [dueDate, setDueDate] = useState(structure.due_date ?? "");
  const [components, setComponents] = useState<
    { name: string; amount: string; is_optional: boolean }[]
  >(
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

  const updateComponent = (
    i: number,
    field: string,
    value: string | boolean
  ) => {
    const next = [...components];
    if (field === "name") next[i] = { ...next[i], name: value as string };
    else if (field === "amount")
      next[i] = { ...next[i], amount: value as string };
    else if (field === "is_optional")
      next[i] = { ...next[i], is_optional: value as boolean };
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
      Alert.alert(
        t("common.error"),
        t("structures.modal.alerts.componentsEdit")
      );
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
      Alert.alert(
        t("common.error"),
        e instanceof Error ? e.message : t("structures.modal.alerts.saveFailed")
      );
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: radius.md,
    padding: spacing.md,
    color: palette.onSurface,
    marginBottom: spacing.md,
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
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
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            maxHeight: "90%",
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
              {t("structures.modal.editTitle")}
            </Text>
            <AppIcon
              name="close"
              size="lg"
              color="onSurface"
              onPress={onClose}
              accessibilityLabel={t("structures.modal.cancel")}
            />
          </View>
          <ScrollView
            style={{ padding: spacing.lg, maxHeight: 400 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              variant="labelMd"
              color="onSurface"
              style={{ marginBottom: spacing.sm }}
            >
              {t("structures.modal.structureName")}
            </Text>
            <TextInput
              style={inputStyle}
              value={name}
              onChangeText={setName}
              placeholder={t("structures.modal.namePlaceholder")}
              placeholderTextColor={palette.onSurfaceVariant}
            />
            <Text
              variant="labelMd"
              color="onSurface"
              style={{ marginBottom: spacing.sm }}
            >
              {t("structures.modal.classes")}
            </Text>
            <ClassMultiSelect
              value={classIds}
              onChange={setClassIds}
              options={classOptions}
              placeholder={t("structures.modal.classesPlaceholder")}
            />
            <DatePicker
              label={t("structures.modal.dueDate")}
              value={dueDate}
              onChange={setDueDate}
              placeholder={t("structures.modal.dueDatePlaceholder")}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text variant="labelMd" color="onSurface">
                {t("structures.modal.components")}
              </Text>
              <TouchableOpacity
                onPress={addComponent}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <AppIcon name="add" size="md" color="primary" />
                <Text variant="labelMd" color="primary">
                  {t("structures.modal.add")}
                </Text>
              </TouchableOpacity>
            </View>
            {components.map((c, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: spacing.sm,
                }}
              >
                <TextInput
                  style={[inputStyle, { flex: 1, marginRight: spacing.sm, marginBottom: 0 }]}
                  value={c.name}
                  onChangeText={(v) => updateComponent(i, "name", v)}
                  placeholder={t("structures.modal.componentName")}
                  placeholderTextColor={palette.onSurfaceVariant}
                />
                <TextInput
                  style={[
                    inputStyle,
                    { width: 90, marginRight: spacing.sm, marginBottom: 0 },
                  ]}
                  value={c.amount}
                  onChangeText={(v) => updateComponent(i, "amount", v)}
                  placeholder={t("structures.modal.amount")}
                  placeholderTextColor={palette.onSurfaceVariant}
                  keyboardType="decimal-pad"
                />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginRight: spacing.sm,
                  }}
                >
                  <Text
                    variant="labelSm"
                    color="onSurfaceVariant"
                    style={{ marginRight: spacing.xs }}
                  >
                    {t("structures.modal.optional")}
                  </Text>
                  <Switch
                    value={c.is_optional}
                    onValueChange={(v) => updateComponent(i, "is_optional", v)}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => removeComponent(i)}
                  disabled={components.length <= 1}
                  style={{ padding: spacing.sm }}
                >
                  <AppIcon
                    name="remove-circle-outline"
                    size="lg"
                    color="error"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <View
            style={{
              flexDirection: "row",
              gap: spacing.md,
              padding: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: palette.outlineVariant,
            }}
          >
            <TouchableOpacity
              style={{ flex: 1, padding: spacing.md, alignItems: "center" }}
              onPress={onClose}
            >
              <Text variant="labelMd" color="onSurfaceVariant">
                {t("structures.modal.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: palette.primary,
                padding: spacing.md,
                borderRadius: radius.md,
                alignItems: "center",
                opacity: isUpdating ? 0.7 : 1,
              }}
              onPress={handleSubmit}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={palette.onPrimary} />
              ) : (
                <Text variant="labelMd" color="onPrimary">
                  {t("structures.modal.update")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
