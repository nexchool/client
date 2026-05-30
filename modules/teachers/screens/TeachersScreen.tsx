import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TextInput,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useTeachers } from "../hooks/useTeachers";
import { TeacherListItem } from "../components/TeacherListItem";
import { Protected } from "@/modules/permissions/components/Protected";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { Teacher } from "../types";

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
  const { palette, radius, elevation } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  // Real filter: department. Options come from the list-endpoint envelope.
  const [department, setDepartment] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, department]);

  const loadData = () => {
    fetchTeachers({
      search: debouncedSearch || undefined,
      department: department || undefined,
    });
  };

  const handleTeacherPress = (teacher: Teacher) => {
    router.push(`/teachers/${teacher.id}` as any);
  };

  const cycleDepartment = () => {
    if (departments.length === 0) return;
    setDepartment((prev) => {
      if (prev === null) return departments[0];
      const idx = departments.indexOf(prev);
      return idx === -1 || idx === departments.length - 1
        ? null
        : departments[idx + 1];
    });
  };

  const departmentActive = department !== null;
  const departmentLabel = department ?? t("list.filterDepartmentAll");

  const renderToolbar = () => (
    <View
      style={[
        styles.toolbar,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          ...elevation.card,
        },
      ]}
    >
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
    <SafeAreaView style={[styles.container, { backgroundColor: palette.surface }]}>
      <View style={[styles.header, { borderBottomColor: palette.outlineVariant }]}>
        <Text variant="headlineLg" color="onSurface">
          {t("list.title")}
        </Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={styles.subtitle}>
          {t("list.subtitle")}
        </Text>
      </View>

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
          contentContainerStyle={styles.listContent}
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
            bottom: 96,
            right: 20,
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
    </SafeAreaView>
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
    padding: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subtitle: {
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  toolbar: {
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    maxWidth: "100%",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    textAlign: "center",
  },
});
