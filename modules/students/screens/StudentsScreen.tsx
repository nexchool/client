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
import { useRouter } from "expo-router";
import { useStudents } from "../hooks/useStudents";
import { StudentListItem } from "../components/StudentListItem";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import { useAcademicYearContext } from "@/modules/academics/context/AcademicYearContext";
import { Protected } from "@/modules/permissions/components/Protected";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { useTheme, Spacing } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { Student } from "../types";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

type StatusFilter = "all" | "active" | "inactive";

export default function StudentsScreen() {
  const { t } = useTranslation("students");
  const router = useRouter();
  const {
    students,
    currentStudent,
    loading,
    fetchStudents,
    fetchMyProfile,
  } = useStudents();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { selectedAcademicYearId } = useAcademicYearContext();
  const { palette, spacing, radius, elevation } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Check permissions
  const canViewAll = hasAnyPermission([
    PERMS.STUDENT_READ_ALL,
    PERMS.STUDENT_READ_CLASS,
  ]);
  const canViewSelf = hasPermission(PERMS.STUDENT_READ_SELF);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAll, canViewSelf, debouncedSearch, statusFilter, selectedAcademicYearId]);

  const loadData = () => {
    if (canViewAll) {
      fetchStudents({
        search: debouncedSearch || undefined,
        academic_year_id: selectedAcademicYearId || undefined,
        student_status: statusFilter === "all" ? undefined : statusFilter,
      });
    } else if (canViewSelf) {
      fetchMyProfile();
    }
  };

  const handleStudentPress = (student: Student) => {
    router.push(`/students/${student.id}` as any);
  };

  const cycleStatusFilter = () => {
    setStatusFilter((prev) =>
      prev === "all" ? "active" : prev === "active" ? "inactive" : "all"
    );
  };

  const statusLabel =
    statusFilter === "active"
      ? t("list.filterStatusActive")
      : statusFilter === "inactive"
      ? t("list.filterStatusInactive")
      : t("list.filterStatusAll");

  const renderFilters = () => {
    const isActive = statusFilter !== "all";
    return (
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

        <View style={styles.chipRow}>
          <Pressable
            onPress={cycleStatusFilter}
            accessibilityRole="button"
            accessibilityLabel={statusLabel}
            style={({ pressed }) => [
              styles.chip,
              {
                borderRadius: radius.full,
                backgroundColor: isActive
                  ? palette.surfaceContainerLow
                  : palette.surfaceContainerLowest,
                borderColor: isActive ? palette.primary : palette.outlineVariant,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              variant="labelMd"
              color={isActive ? "primary" : "onSurfaceVariant"}
            >
              {statusLabel}
            </Text>
            <AppIcon
              name={isActive ? "close" : "chevron-down"}
              size="sm"
              color={isActive ? "primary" : "onSurfaceVariant"}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading && students.length === 0 && !currentStudent) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      );
    }

    if (canViewAll) {
      return (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderFilters()}
          renderItem={({ item }) => (
            <StudentListItem student={item} onPress={handleStudentPress} />
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
                {searchQuery ? t("list.emptySearch") : t("list.empty")}
              </Text>
            </View>
          }
        />
      );
    }

    if (canViewSelf && currentStudent) {
      return (
        <View style={styles.profileContainer}>
          <Text variant="headlineMd" color="onSurface" style={styles.profileTitle}>
            {t("list.myProfileTitle")}
          </Text>
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: palette.surfaceContainerLowest,
                borderRadius: radius.xl,
                ...elevation.card,
              },
            ]}
          >
            <Text variant="labelMd" color="onSurfaceVariant" style={styles.label}>
              {t("list.labelName")}
            </Text>
            <Text variant="bodyLg" color="onSurface">
              {currentStudent.name}
            </Text>

            <Text variant="labelMd" color="onSurfaceVariant" style={styles.label}>
              {t("list.labelAdmissionNo")}
            </Text>
            <Text variant="bodyLg" color="onSurface">
              {currentStudent.admission_number}
            </Text>

            <Text variant="labelMd" color="onSurfaceVariant" style={styles.label}>
              {t("list.labelClass")}
            </Text>
            <Text variant="bodyLg" color="onSurface">
              {currentStudent.class_name || t("list.notAssigned")}
            </Text>

            <Text variant="labelMd" color="onSurfaceVariant" style={styles.label}>
              {t("list.labelEmail")}
            </Text>
            <Text variant="bodyLg" color="onSurface">
              {currentStudent.email}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Text variant="bodyMd" color="error" style={styles.errorText}>
          {t("list.noPermission")}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.surface }]}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing.marginMobile,
            paddingVertical: spacing.md,
            borderBottomColor: palette.outlineVariant,
          },
        ]}
      >
        <Text variant="headlineLg" color="onSurface">
          {t("list.title")}
        </Text>
      </View>

      {renderContent()}

      <Protected permission={PERMS.STUDENT_CREATE}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add student"
          onPress={() => router.push("/(protected)/students/new" as any)}
          style={({ pressed }) => ({
            position: "absolute",
            bottom: spacing[40] * 2 + spacing.md,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolbar: {
    marginBottom: Spacing.md,
    gap: Spacing[12],
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing[12],
    paddingVertical: 10,
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
  errorText: {
    textAlign: "center",
  },
  profileContainer: {
    padding: Spacing.marginMobile,
  },
  profileTitle: {
    marginBottom: Spacing.md,
  },
  profileCard: {
    padding: Spacing.marginMobile,
  },
  label: {
    marginTop: Spacing[12],
    marginBottom: 2,
  },
});
