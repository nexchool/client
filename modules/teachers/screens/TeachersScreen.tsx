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
  const { palette, spacing, radius, elevation } = useTheme();

  // Seeded from the global search screen's "See all", so the term the
  // person typed there is already applied when this list opens.
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [searchQuery, setSearchQuery] = useState(q ?? "");
  // Real filter: department. Options come from the list-endpoint envelope.
  // Holding the object (not just the id) means the chip keeps showing the
  // right name even if a later facet refresh drops this department (e.g. it
  // was deactivated) — see cycleDepartment for how that case resets.
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

  const cycleDepartment = () => {
    if (departments.length === 0) return;
    setDepartment((prev) => {
      if (prev === null) return departments[0];
      const idx = departments.findIndex((d) => d.id === prev.id);
      // -1 covers the stale-selection case: the previously selected
      // department is no longer in the (possibly refreshed) facet, e.g. it
      // was deactivated. Rather than get stuck cycling from an id that no
      // longer resolves to anything, treat it the same as "at the end of
      // the list" and reset to "All" on the next tap.
      return idx === -1 || idx === departments.length - 1
        ? null
        : departments[idx + 1];
    });
  };

  const departmentActive = department !== null;
  const departmentLabel = department?.name ?? t("list.filterDepartmentAll");

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
          style={[styles.searchInput, { color: palette.onSurface }]}
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
        <View style={styles.chipRow}>
          <Pressable
            onPress={cycleDepartment}
            accessibilityRole="button"
            accessibilityLabel={departmentLabel}
            style={({ pressed }) => [
              styles.chip,
              {
                borderRadius: radius.full,
                backgroundColor: departmentActive
                  ? palette.surfaceContainerLow
                  : palette.surfaceContainerLowest,
                borderColor: departmentActive
                  ? palette.primary
                  : palette.outlineVariant,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <AppIcon
              name="briefcase-outline"
              size="sm"
              color={departmentActive ? "primary" : "onSurfaceVariant"}
            />
            <Text
              variant="labelMd"
              color={departmentActive ? "primary" : "onSurfaceVariant"}
              numberOfLines={1}
            >
              {departmentLabel}
            </Text>
            <AppIcon
              name={departmentActive ? "close" : "chevron-down"}
              size="sm"
              color={departmentActive ? "primary" : "onSurfaceVariant"}
            />
          </Pressable>
        </View>
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    maxWidth: "100%",
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
