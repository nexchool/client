import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useTheme, Spacing, type Palette } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { Ionicons } from "@expo/vector-icons";
import { Protected } from "@/modules/permissions/components/Protected";
import { useUiRole } from "@/modules/permissions/hooks/useUiRole";
import * as PERMS from "@/modules/permissions/constants/permissions";

type IconName = keyof typeof Ionicons.glyphMap;

interface ActionCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  primary?: boolean;
  badge?: string;
  onPress?: () => void;
}

function ActionCard({ icon, title, subtitle, primary, badge, onPress }: ActionCardProps) {
  const { palette, spacing, radius } = useTheme();
  const iconChipBg: keyof Palette = primary ? "primaryContainer" : "surface";
  const iconChipFg: keyof Palette = primary ? "onPrimary" : "primary";

  return (
    <PressScale onPress={onPress ?? (() => {})}>
      <View
        style={[
          styles.actionCard,
          {
            backgroundColor: primary ? palette.primary : palette.surfaceContainerLowest,
            borderRadius: radius.lg,
            borderColor: palette.outlineVariant,
            padding: spacing.md,
            marginBottom: spacing.md,
            gap: spacing.md,
          },
        ]}
      >
        <View
          style={[
            styles.cardIcon,
            { backgroundColor: palette[iconChipBg], borderRadius: radius.md },
          ]}
        >
          <AppIcon name={icon} size="lg" color={iconChipFg} />
        </View>
        <View style={styles.cardText}>
          <Text variant="labelLg" color={primary ? "onPrimary" : "onSurface"}>
            {title}
          </Text>
          <Text variant="bodySm" color={primary ? "onPrimary" : "onSurfaceVariant"}>
            {subtitle}
          </Text>
        </View>
        {badge != null && (
          <View style={[styles.badge, { backgroundColor: palette.error }]}>
            <Text variant="labelSm" color="onError">{badge}</Text>
          </View>
        )}
        <AppIcon
          name="chevron-forward"
          size="md"
          color={primary ? "onPrimary" : "onSurfaceVariant"}
        />
      </View>
    </PressScale>
  );
}

export default function ActivitiesScreen() {
  const { isAdmin, isTeacher } = useUiRole();
  const { palette, spacing } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.surface }]}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingHorizontal: spacing.marginMobile, paddingTop: spacing.md, paddingBottom: spacing.md }]}>
        <Text variant="display" color="onSurface">Activities</Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
          {isAdmin && "Manage school activities and events"}
          {isTeacher && "Class activities and announcements"}
          {!isAdmin && !isTeacher && "Events and announcements"}
        </Text>
      </View>

      <View style={{ gap: spacing.lg }}>
        {/* Events & Calendar */}
        <View style={[styles.section, { paddingHorizontal: spacing.marginMobile }]}>
          <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.md }}>
            Events &amp; Calendar
          </Text>

          <ActionCard icon="calendar-outline" title="School Calendar" subtitle="View upcoming events" />

          <Protected anyPermissions={[PERMS.SYSTEM_MANAGE, PERMS.USER_MANAGE]}>
            <ActionCard icon="add-circle-outline" title="Create Event" subtitle="Add school-wide event" />
          </Protected>
        </View>

        {/* Announcements */}
        <View style={[styles.section, { paddingHorizontal: spacing.marginMobile }]}>
          <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.md }}>
            Announcements
          </Text>

          <Protected
            anyPermissions={[PERMS.ATTENDANCE_MARK, PERMS.GRADE_CREATE, PERMS.SYSTEM_MANAGE]}
          >
            <ActionCard
              icon="megaphone-outline"
              title="Post Announcement"
              subtitle={isAdmin ? "School-wide announcement" : "Class announcement"}
              primary
            />
          </Protected>

          <ActionCard
            icon="notifications-outline"
            title="View Announcements"
            subtitle="Recent updates and news"
          />
        </View>

        {/* Extracurricular */}
        <View style={[styles.section, { paddingHorizontal: spacing.marginMobile }]}>
          <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.md }}>
            Extracurricular
          </Text>

          <ActionCard icon="trophy-outline" title="Sports" subtitle="Sports events and teams" />
          <ActionCard icon="musical-notes-outline" title="Clubs & Societies" subtitle="Join and participate" />
        </View>

        {/* Notifications */}
        <View style={[styles.section, { paddingHorizontal: spacing.marginMobile }]}>
          <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.md }}>
            Notifications
          </Text>

          <ActionCard
            icon="notifications-outline"
            title="All Notifications"
            subtitle="View all updates"
            badge="5"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  section: {},
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
});
