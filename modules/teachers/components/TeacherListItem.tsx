import React from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { ProfileAvatar } from "@/common/components/ProfileAvatar";
import { useTheme } from "@/common/theme";
import { Teacher } from "../types";

interface Props {
  teacher: Teacher;
  onPress: (teacher: Teacher) => void;
}

export const TeacherListItem: React.FC<Props> = ({ teacher, onPress }) => {
  const { t } = useTranslation("teachers");
  const { palette, spacing, radius, elevation, avatarSize } = useTheme();

  const isInactive =
    (teacher.status || "").trim().toLowerCase() === "inactive";

  // Real fields only: department is the primary pill, designation the fallback.
  // The list endpoint does NOT ship subjects or photos.
  const pillLabel = teacher.department || teacher.designation;
  const accentColor = isInactive ? palette.outlineVariant : palette.primary;

  return (
    <PressScale
      onPress={() => onPress(teacher)}
      accessibilityRole="button"
      accessibilityLabel={teacher.name}
      style={[
        styles.card,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          opacity: isInactive ? 0.85 : 1,
          ...elevation.card,
        },
      ]}
    >
      {/* Cover band */}
      <View
        style={[
          styles.cover,
          {
            backgroundColor: palette.surfaceContainerHigh,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
          },
        ]}
      />

      {/* Avatar overlapping the band */}
      <View
        style={[
          styles.avatarRing,
          { backgroundColor: palette.surfaceContainerLowest },
        ]}
      >
        <ProfileAvatar
          uri={teacher.profile_picture}
          size={avatarSize.lg}
          name={teacher.name}
          iconColor={
            isInactive ? palette.outline : palette.onTertiaryContainer
          }
          placeholderBg={
            isInactive
              ? palette.surfaceContainerHighest
              : palette.tertiaryContainer
          }
        />
      </View>

      <View style={[styles.body, { paddingHorizontal: spacing.md }]}>
        <Text
          variant="titleSm"
          color="onSurface"
          numberOfLines={1}
          style={styles.name}
        >
          {teacher.name}
        </Text>

        <Text
          variant="bodySm"
          color="onSurfaceVariant"
          numberOfLines={1}
          style={styles.employeeId}
        >
          {`ID: ${teacher.employee_id}`}
        </Text>

        {pillLabel ? (
          <View
            style={[
              styles.pill,
              {
                backgroundColor: isInactive
                  ? palette.surfaceContainerHighest
                  : palette.tertiaryContainer,
                borderRadius: radius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                marginTop: spacing.sm,
              },
            ]}
          >
            <AppIcon
              name="briefcase-outline"
              size="sm"
              color={isInactive ? "onSurfaceVariant" : "onTertiaryContainer"}
            />
            <Text
              variant="labelSm"
              color={isInactive ? "onSurfaceVariant" : "onTertiaryContainer"}
              numberOfLines={1}
            >
              {pillLabel}
            </Text>
          </View>
        ) : null}

        {/* View Profile affordance — whole card is pressable */}
        <View
          style={[
            styles.viewProfile,
            {
              backgroundColor: palette.surfaceContainerLow,
              borderRadius: radius.md,
              marginTop: spacing.md,
            },
          ]}
        >
          <Text variant="labelMd" color={isInactive ? "onSurfaceVariant" : "primary"}>
            {t("list.viewProfile")}
          </Text>
          <AppIcon
            name="chevron-forward"
            size="sm"
            color={isInactive ? "onSurfaceVariant" : "primary"}
          />
        </View>
      </View>

      {/* Accent edge to echo status without a separate badge */}
      <View
        style={[
          styles.accent,
          {
            backgroundColor: accentColor,
            borderBottomLeftRadius: radius.xl,
            borderBottomRightRadius: radius.xl,
          },
        ]}
      />
    </PressScale>
  );
};

const COVER_HEIGHT = 56;
const AVATAR_OVERLAP = 28;

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: "hidden",
  },
  cover: {
    height: COVER_HEIGHT,
    width: "100%",
  },
  avatarRing: {
    alignSelf: "center",
    padding: 4,
    borderRadius: 9999,
    marginTop: -AVATAR_OVERLAP,
  },
  body: {
    alignItems: "center",
    paddingBottom: 16,
  },
  name: {
    marginTop: 8,
    textAlign: "center",
  },
  employeeId: {
    marginTop: 2,
    textAlign: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "100%",
  },
  viewProfile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    alignSelf: "stretch",
    paddingVertical: 10,
  },
  accent: {
    height: 3,
    width: "100%",
  },
});
