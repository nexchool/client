import React from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { useTheme } from "@/common/theme";
import { ClassItem } from "../types";

interface Props {
  item: ClassItem;
  /** Whole card press → class detail. */
  onPress: (item: ClassItem) => void;
  /** "View Timetable" action → real timetable route scoped by class id. */
  onViewTimetable: (item: ClassItem) => void;
}

/**
 * Bold filled primary-colored class card (Stitch "Academic Fluidity" ref).
 *
 * Data-wiring discipline — only REAL list-endpoint fields render:
 *  - title: name + section
 *  - stream pill: `stream` (omitted for grades 1–10 where it is null)
 *  - count badge: `student_count` (omitted when undefined)
 *  - CLASS TEACHER row: `teacher_name` (omitted when null)
 * The reference's ROOM row and "Active" status dot have no backing field, so
 * they are intentionally omitted rather than fabricated.
 */
export const ClassListItem: React.FC<Props> = ({
  item,
  onPress,
  onViewTimetable,
}) => {
  const { t } = useTranslation("classes");
  const { palette, spacing, radius, elevation } = useTheme();

  const title = item.section ? `${item.name} - ${item.section}` : item.name;
  const hasCount = typeof item.student_count === "number";
  const teacherName = item.teacher_name?.trim();

  return (
    <PressScale
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        styles.card,
        {
          backgroundColor: palette.primary,
          borderRadius: radius.xl,
          padding: spacing.lg,
          ...elevation.card,
        },
      ]}
    >
      {/* Header: title + stream pill on the left, student-count badge on the right */}
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text variant="display" color="onPrimary" numberOfLines={1}>
            {title}
          </Text>
          {item.stream ? (
            <View
              style={[
                styles.streamPill,
                {
                  backgroundColor: palette.primaryContainer,
                  borderRadius: radius.full,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  marginTop: spacing.sm,
                },
              ]}
            >
              <Text variant="labelSm" color="onPrimaryContainer" numberOfLines={1}>
                {item.stream}
              </Text>
            </View>
          ) : null}
        </View>

        {hasCount ? (
          <View
            style={[
              styles.countBadge,
              { backgroundColor: palette.onPrimary, borderRadius: radius.full },
            ]}
            accessibilityLabel={t("list.studentsCount", {
              count: item.student_count ?? 0,
            })}
          >
            <Text variant="headlineMd" color="primary">
              {item.student_count}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Meta rows — only the class-teacher row, since room is not a real field. */}
      {teacherName ? (
        <View style={[styles.metaSection, { marginTop: spacing.lg }]}>
          <View style={styles.metaRow}>
            <AppIcon name="person-outline" size="md" color="onPrimary" />
            <View style={styles.metaText}>
              <Text variant="labelSm" color="onPrimary" style={styles.metaLabel}>
                {t("list.classTeacherLabel")}
              </Text>
              <Text variant="bodyMd" color="onPrimary" numberOfLines={1}>
                {teacherName}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Footer: View Timetable action */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: palette.primaryContainer,
            marginTop: spacing.lg,
            paddingTop: spacing.md,
          },
        ]}
      >
        <PressScale
          onPress={() => onViewTimetable(item)}
          accessibilityRole="button"
          accessibilityLabel={t("list.viewTimetable")}
          style={[
            styles.timetableButton,
            {
              backgroundColor: palette.onPrimary,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          <Text variant="labelMd" color="primary">
            {t("list.viewTimetable")}
          </Text>
          <AppIcon name="arrow-forward" size="sm" color="primary" />
        </PressScale>
      </View>
    </PressScale>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerText: {
    flex: 1,
    alignItems: "flex-start",
  },
  streamPill: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
  },
  countBadge: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  metaSection: {
    gap: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaText: {
    flex: 1,
  },
  metaLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  timetableButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
