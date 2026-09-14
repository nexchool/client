import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Pressable,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTeachers } from "../hooks/useTeachers";
import { TeacherListItem } from "../components/TeacherListItem";
import { Protected } from "@/modules/permissions/components/Protected";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { useTheme, Spacing } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PageHeader } from "@/common/components/PageHeader";
import { SelectSheet } from "@/common/components/SelectSheet";
import { Teacher, TeacherDepartmentOption } from "../types";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function TeachersScreen() {
  const { t } = useTranslation("teachers");
  const router = useRouter();
  const { teachers, departments, loading, fetchTeachers } = useTeachers();
  const { palette, spacing, radius, elevation, typography } = useTheme();

  // Seeded from the global search screen's "See all", so the term the
  // person typed there is already applied when this list opens.
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [searchQuery, setSearchQuery] = useState(q ?? "");
  // Real filter: department. Options come from the list-endpoint envelope.
  // Holding the object (not just the id) means the field keeps showing the
  // right name even if a later facet refresh drops this department (e.g. it
  // was deactivated) — see selectDepartment for how that case resets.
  const [department, setDepartment] = useState<TeacherDepartmentOption | null>(
    null
  );
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, department]);

  const loadData = () => {
    fetchTeachers({
      search: debouncedSearch || undefined,
      department_id: department?.id || undefined,
    });
  };

  const handleTeacherPress = (teacher: Teacher) => {
    router.push(`/teachers/${teacher.id}` as any);
  };

  // Resolve the picked id back to the full option, the same defensive lookup
  // `cycleDepartment` used to do: if the department is no longer in a
  // refreshed facet (e.g. it was deactivated), fall back to "All" rather
  // than holding an id that resolves to nothing.
  const selectDepartment = (id: string | null) => {
    setDepartment(id ? (departments.find((d) => d.id === id) ?? null) : null);
  };

  const departmentActive = department !== null;
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));

  const renderToolbar = () => (
    <View style={styles.toolbar}>
      <View
        style={[
          styles.searchContainer,
          {
            borderRadius: radius.DEFAULT,
            borderColor: palette.outlineVariant,
            backgroundColor: palette.surfaceContainerLowest,
          },
        ]}
      >
        <AppIcon name="search" size="md" color="outline" />
        <TextInput
          style={[typography.bodyMd, styles.searchInput, { color: palette.onSurface }]}
          placeholder={t("list.searchPlaceholder")}
          placeholderTextColor={palette.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <AppIcon
            name="close-circle"
            size="md"
            color="onSurfaceVariant"
            onPress={() => setSearchQuery("")}
            accessibilityLabel="Clear search"
          />
        )}
      </View>

      {departments.length > 0 && (
        <SelectSheet
          value={department?.id ?? null}
          onChange={selectDepartment}
          options={departmentOptions}
          allowEmpty
          emptyLabel={t("list.filterDepartmentAll")}
          placeholder={t("list.filterDepartmentAll")}
          sheetTitle={t("field.department", { defaultValue: "Department" })}
        />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.surface }]}>
      <PageHeader title={t("list.title")} subtitle={t("list.subtitle")} />

      {loading && teachers.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <FlatList
          data={teachers}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderToolbar()}
          renderItem={({ item }) => (
            <TeacherListItem teacher={item} onPress={handleTeacherPress} />
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.marginMobile,
            paddingTop: spacing.md,
            paddingBottom: spacing[40] * 3,
          }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadData}
              tintColor={palette.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <AppIcon name="people-outline" size="hero" color="outline" />
              <Text
                variant="bodyMd"
                color="onSurfaceVariant"
                style={styles.emptyText}
              >
                {searchQuery || departmentActive
                  ? t("list.emptySearch")
                  : t("list.emptyNone")}
              </Text>
            </View>
          }
        />
      )}

      <Protected permission={PERMS.TEACHER_CREATE}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add teacher"
          onPress={() => router.push("/(protected)/teachers/new" as any)}
          style={({ pressed }) => ({
            position: "absolute",
            bottom: spacing.lg,
            right: spacing.marginMobile,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: palette.primary,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : 1,
            ...elevation.card,
          })}
        >
          <AppIcon name="add" size="xl" color="onPrimary" />
        </Pressable>
      </Protected>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  toolbar: {
    marginBottom: Spacing.md,
    gap: Spacing[12],
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing[12],
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing[48] + Spacing.md,
    gap: Spacing[12],
  },
  emptyText: {
    textAlign: "center",
  },
});
