import React from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { ProfileAvatar } from "@/common/components/ProfileAvatar";
import { useTheme } from "@/common/theme";
import { Student } from "../types";

interface StudentListItemProps {
  student: Student;
  onPress: (student: Student) => void;
}

/** "Grade 10-B" -> { grade: "Grade 10", section: "B" }. Falls back gracefully. */
function splitClassName(className?: string): { grade?: string; section?: string } {
  if (!className) return {};
  const idx = className.lastIndexOf("-");
  if (idx === -1) return { grade: className };
  return {
    grade: className.slice(0, idx).trim() || undefined,
    section: className.slice(idx + 1).trim() || undefined,
  };
}

export const StudentListItem: React.FC<StudentListItemProps> = ({
  student,
  onPress,
}) => {
  const { t } = useTranslation("students");
  const { palette, spacing, radius, elevation, avatarSize } = useTheme();

  const isInactive =
    (student.student_status || "").trim().toLowerCase() === "inactive";
  const { grade, section } = splitClassName(student.class_name);
  const accentColor = isInactive ? palette.outlineVariant : palette.primary;

  return (
    <PressScale
      onPress={() => onPress(student)}
      accessibilityRole="button"
      accessibilityLabel={student.name || t("listItem.unknownName")}
      style={[
        styles.card,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          borderLeftColor: accentColor,
          opacity: isInactive ? 0.85 : 1,
          ...elevation.card,
        },
      ]}
    >
      <View style={styles.body}>
        <View style={[styles.topRow, { marginBottom: spacing.md }]}>
          <ProfileAvatar
            uri={student.profile_picture}
            size={avatarSize.md}
            name={student.name}
            iconColor={
              isInactive ? palette.outline : palette.onTertiaryContainer
            }
            placeholderBg={
              isInactive ? palette.surfaceContainerHighest : palette.tertiaryContainer
            }
          />
          <View style={styles.headerText}>
            <Text variant="titleSm" color="onSurface" numberOfLines={1}>
              {student.name || t("listItem.unknownName")}
            </Text>
            <Text variant="bodySm" color="onSurfaceVariant" numberOfLines={1}>
              {`ID: ${student.admission_number}`}
            </Text>
          </View>
          {isInactive ? (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: palette.surfaceContainerHighest,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.sm,
                },
              ]}
            >
              <Text variant="labelSm" color="onSurfaceVariant">
                {t("list.badgeInactive")}
              </Text>
            </View>
          ) : (
            <AppIcon name="chevron-forward" size="md" color="outlineVariant" />
          )}
        </View>

        <View
          style={[
            styles.footer,
            {
              borderTopColor: palette.outlineVariant,
              paddingTop: spacing.sm,
            },
          ]}
        >
          <View style={styles.gradeRow}>
            <AppIcon name="school-outline" size="sm" color={isInactive ? "outline" : "primary"} />
            <Text variant="labelMd" color="onSurface">
              {grade || t("listItem.noClass")}
            </Text>
          </View>
          {section ? (
            <View
              style={[
                styles.sectionBadge,
                {
                  backgroundColor: palette.surfaceContainer,
                  borderRadius: radius.full,
                  paddingHorizontal: spacing.md,
                },
              ]}
            >
              <Text variant="labelSm" color="onSurface">
                {`Sec ${section}`}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressScale>
  );
};

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  body: {
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  statusBadge: {
    paddingVertical: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  gradeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sectionBadge: {
    paddingVertical: 4,
  },
});
