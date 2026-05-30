import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useClasses } from "../hooks/useClasses";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import { useAcademicYearContext } from "@/modules/academics/context/AcademicYearContext";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { CreateClassModal } from "../components/CreateClassModal";
import { ClassListItem } from "../components/ClassListItem";
import { useTheme, Spacing } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { ClassItem, CreateClassDTO } from "../types";

interface ClassSection {
  title: string;
  /** Sort key: real grade_level if present, else a high sentinel so "Other" sinks. */
  order: number;
  /** Fallback bucket for classes with no real grade_level — header is suppressed. */
  isOther: boolean;
  data: ClassItem[];
}

/**
 * Group classes under grade section headers using the REAL `grade_level` field.
 * Classes without a grade_level fall into an "Other" bucket rather than being
 * dropped or fabricated into a grade.
 */
function groupByGrade(
  classes: ClassItem[],
  otherLabel: string,
  gradeLabel: (grade: number) => string,
): ClassSection[] {
  const buckets = new Map<string, ClassSection>();

  for (const cls of classes) {
    const hasGrade = typeof cls.grade_level === "number";
    const key = hasGrade ? `g-${cls.grade_level}` : "other";
    let section = buckets.get(key);
    if (!section) {
      section = {
        title: hasGrade ? gradeLabel(cls.grade_level as number) : otherLabel,
        order: hasGrade ? (cls.grade_level as number) : Number.MAX_SAFE_INTEGER,
        isOther: !hasGrade,
        data: [],
      };
      buckets.set(key, section);
    }
    section.data.push(cls);
  }

  return Array.from(buckets.values()).sort((a, b) => a.order - b.order);
}

export default function ClassesScreen() {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const { classes, loading, fetchClasses, createClass } = useClasses();
  const { hasPermission } = usePermissions();
  const { selectedAcademicYearId } = useAcademicYearContext();
  const { palette, spacing, radius, elevation } = useTheme();

  const canCreate = hasPermission(PERMS.CLASS_CREATE);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchClasses({ academic_year_id: selectedAcademicYearId || undefined });
  }, [selectedAcademicYearId, fetchClasses]);

  const sections = useMemo(
    () =>
      groupByGrade(
        classes,
        t("list.otherGrade"),
        (grade) => t("list.gradeHeader", { grade }),
      ),
    [classes, t],
  );

  const handleClassPress = (cls: ClassItem) => {
    router.push(`/classes/${cls.id}` as any);
  };

  const handleViewTimetable = (cls: ClassItem) => {
    router.push(`/(protected)/timetable?classId=${cls.id}` as any);
  };

  const handleCreateClass = async (data: CreateClassDTO) => {
    await createClass(data);
    setModalVisible(false);
    Alert.alert(t("list.success"), t("list.created"));
    fetchClasses({ academic_year_id: selectedAcademicYearId || undefined });
  };

  const refresh = () =>
    fetchClasses({ academic_year_id: selectedAcademicYearId || undefined });

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
        <Text variant="bodyMd" color="onSurfaceVariant" style={styles.subtitle}>
          {t("list.subtitle")}
        </Text>
      </View>

      {loading && classes.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) =>
            section.isOther ? null : (
              <View
                style={[
                  styles.sectionHeader,
                  { borderBottomColor: palette.outlineVariant },
                ]}
              >
                <Text variant="headlineMd" color="onSurface">
                  {section.title}
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <ClassListItem
              item={item}
              onPress={handleClassPress}
              onViewTimetable={handleViewTimetable}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.marginMobile,
            paddingTop: spacing.md,
            paddingBottom: spacing[40] * 3,
          }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={palette.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <AppIcon name="school-outline" size="hero" color="outline" />
              <Text
                variant="bodyMd"
                color="onSurfaceVariant"
                style={styles.emptyText}
              >
                {t("list.empty")}
              </Text>
            </View>
          }
        />
      )}

      {canCreate && (
        <>
          <PressScale
            accessibilityRole="button"
            accessibilityLabel={t("modal.titleCreate")}
            onPress={() => setModalVisible(true)}
            style={[
              styles.fab,
              { backgroundColor: palette.primary, borderRadius: radius.full, ...elevation.card },
            ]}
          >
            <AppIcon name="add" size="xl" color="onPrimary" />
          </PressScale>

          <CreateClassModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onSubmit={handleCreateClass}
          />
        </>
      )}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subtitle: {
    marginTop: 2,
  },
  sectionHeader: {
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  fab: {
    position: "absolute",
    bottom: Spacing.lg,
    right: Spacing.marginMobile,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});
