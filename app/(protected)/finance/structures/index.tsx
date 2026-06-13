import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Switch,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
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
import { ClassMultiSelect } from "@/common/components/ClassMultiSelect";
import { calendarLocaleForLanguage } from "@/i18n";
import { DatePicker } from '@/common/components/datepicker';
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { EmptyState } from "@/common/components/EmptyState";

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
  const { palette, spacing, radius, elevation } = useTheme();
  const { selectedAcademicYearId: contextYearId } = useAcademicYearContext();
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: academicYears = [] } = useAcademicYears(false);
  const { data: classes = [] } = useClasses();

  useEffect(() => {
    if (contextYearId)
      setAcademicYearFilter((prev) => (prev === "" ? contextYearId : prev));
  }, [contextYearId]);

  const {
    data: structures = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useStructures({
    academic_year_id: academicYearFilter || undefined,
  });

  const createMut = useCreateStructure();
  const updateMut = useUpdateStructure();

  const renderStructureItem = ({ item: s }: { item: FeeStructure }) => (
    <PressScale
      onPress={() =>
        router.push(`/(protected)/finance/structures/${s.id}` as never)
      }
      style={[
        elevation.card,
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.md,
          marginBottom: spacing.md,
        },
      ]}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: radius.md,
          backgroundColor: palette.primaryContainer,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.md,
        }}
      >
        <AppIcon name="layers" size="lg" color="onPrimaryContainer" />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="labelMd" color="onSurface" numberOfLines={1}>
          {s.name}
        </Text>
        <Text
          variant="labelSm"
          color="onSurfaceVariant"
          numberOfLines={1}
          style={{ marginTop: 2 }}
        >
          {t("structures.classDetail", {
            classes: s.class_name ?? t("common.allClasses"),
            date: formatDate(s.due_date, locale),
          })}
        </Text>
        {s.components?.length ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: spacing.xs,
            }}
          >
            <AppIcon
              name="document-text-outline"
              size="sm"
              color="onSurfaceVariant"
            />
            <Text variant="labelSm" color="onSurfaceVariant">
              {t("common.componentsLine", { count: s.components.length })}
            </Text>
          </View>
        ) : null}
      </View>
      <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
    </PressScale>
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
          {t("structures.title")}
        </Text>
        <AppIcon
          name="add"
          size="lg"
          color="primary"
          onPress={() => setModalOpen(true)}
          accessibilityLabel={t("structures.createStructure")}
        />
      </View>

      {/* Academic year filter */}
      <View
        style={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.sm,
          gap: spacing.sm,
        }}
      >
        <Text variant="labelSm" color="onSurfaceVariant">
          {t("structures.academicYear")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          <Chip
            active={!academicYearFilter}
            label={t("common.all")}
            onPress={() => setAcademicYearFilter("")}
          />
          {academicYears.map((ay) => (
            <Chip
              key={ay.id}
              active={academicYearFilter === ay.id}
              label={ay.name}
              onPress={() =>
                setAcademicYearFilter(academicYearFilter === ay.id ? "" : ay.id)
              }
            />
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View style={{ padding: spacing.lg, alignItems: "center" }}>
          <Text variant="bodyMd" color="error">
            {error instanceof Error ? error.message : t("common.failedToLoad")}
          </Text>
        </View>
      ) : isLoading && structures.length === 0 ? (
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
      ) : (
        <FlatList
          data={structures}
          keyExtractor={(item) => item.id}
          renderItem={renderStructureItem}
          contentContainerStyle={{
            paddingHorizontal: spacing.marginMobile,
            paddingTop: spacing.md,
            paddingBottom: spacing.xl * 2,
          }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={
                <AppIcon name="layers-outline" size="xl" color="onSurfaceVariant" />
              }
              title={t("structures.emptyTitle")}
              description={t("structures.emptySubtext")}
              action={{
                label: t("structures.createStructure"),
                onPress: () => setModalOpen(true),
              }}
            />
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
    </View>
  );
}

function Chip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const { palette, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        backgroundColor: active ? palette.primary : palette.surfaceContainerLow,
        borderWidth: 1,
        borderColor: active ? palette.primary : palette.outlineVariant,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text variant="labelSm" color={active ? "onPrimary" : "onSurface"}>
        {label}
      </Text>
    </Pressable>
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
  onUpdate: (
    id: string,
    data: {
      name?: string;
      due_date?: string;
      class_ids?: string[];
      components?: { name: string; amount: number; is_optional: boolean }[];
    }
  ) => Promise<void>;
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
  const { palette, spacing, radius } = useTheme();
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
      setAcademicYearId(
        editing?.academic_year_id ?? defaultAcademicYearId ?? ""
      );
      setClassIds(
        editing?.class_ids ?? (editing?.class_id ? [editing.class_id] : [])
      );
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
      Alert.alert(
        t("common.error"),
        t("structures.modal.alerts.componentsCreate")
      );
      return;
    }
    if (editingId && comps.length === 0) {
      Alert.alert(
        t("common.error"),
        t("structures.modal.alerts.componentsEdit")
      );
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
      Alert.alert(
        t("common.error"),
        e instanceof Error ? e.message : t("structures.modal.alerts.saveFailed")
      );
    }
  };

  const effectiveAcademicYearId =
    academicYearId || (editing?.academic_year_id ?? "");
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
              {editingId
                ? t("structures.modal.editTitle")
                : t("structures.modal.createTitle")}
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
            <Text
              variant="labelSm"
              color="onSurfaceVariant"
              style={{ marginBottom: spacing.sm }}
            >
              {t("structures.modal.structureNameHint")}
            </Text>
            <TextInput
              style={inputStyle}
              value={name}
              onChangeText={setName}
              placeholder={t("structures.modal.namePlaceholder")}
              placeholderTextColor={palette.onSurfaceVariant}
            />

            {!editingId && (
              <>
                <Text
                  variant="labelMd"
                  color="onSurface"
                  style={{ marginBottom: spacing.sm }}
                >
                  {t("structures.modal.academicYear")}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.sm }}
                  style={{ marginBottom: spacing.md }}
                >
                  {academicYears.map((ay) => (
                    <Chip
                      key={ay.id}
                      active={academicYearId === ay.id}
                      label={ay.name}
                      onPress={() => setAcademicYearId(ay.id)}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            <Text
              variant="labelMd"
              color="onSurface"
              style={{ marginBottom: spacing.sm }}
            >
              {t("structures.modal.classes")}
            </Text>
            <Text
              variant="labelSm"
              color="onSurfaceVariant"
              style={{ marginBottom: spacing.sm }}
            >
              {t("structures.modal.classesHint")}
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
                opacity: isCreating || isUpdating ? 0.7 : 1,
              }}
              onPress={handleSubmit}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? (
                <ActivityIndicator size="small" color={palette.onPrimary} />
              ) : (
                <Text variant="labelMd" color="onPrimary">
                  {editingId
                    ? t("structures.modal.update")
                    : t("structures.modal.create")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
