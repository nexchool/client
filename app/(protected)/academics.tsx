import React from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type Palette } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { Protected } from "@/modules/permissions/components/Protected";
import { useUiRole } from "@/modules/permissions/hooks/useUiRole";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { useAcademicsOverview } from "@/modules/academics/hooks/useAcademicsOverview";

type IconName = keyof typeof Ionicons.glyphMap;

interface ActionCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  primary?: boolean;
  onPress?: () => void;
}

function ActionCard({ icon, title, subtitle, primary, onPress }: ActionCardProps) {
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
        <AppIcon
          name="chevron-forward"
          size="md"
          color={primary ? "onPrimary" : "onSurfaceVariant"}
        />
      </View>
    </PressScale>
  );
}

function StatCard({ icon, value, label, loading }: { icon: IconName; value: number; label: string; loading: boolean }) {
  const { palette, spacing, radius } = useTheme();
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderColor: palette.outlineVariant,
          borderRadius: radius.lg,
          padding: spacing.lg,
        },
      ]}
    >
      <AppIcon name={icon} size="xl" color="primary" />
      {loading ? (
        <ActivityIndicator size="small" color={palette.primary} style={{ marginTop: spacing.sm }} />
      ) : (
        <Text variant="headlineLg" color="onSurface" style={{ marginTop: spacing.sm }}>
          {value}
        </Text>
      )}
      <Text variant="bodySm" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
        {label}
      </Text>
    </View>
  );
}

export default function AcademicsScreen() {
  const { isAdmin, isTeacher, isStudent, isParent } = useUiRole();
  const { isFeatureEnabled } = useAuth();
  const router = useRouter();
  const { palette, spacing } = useTheme();
  const { data: overview, isLoading: overviewLoading } = useAcademicsOverview(isAdmin);

  const sectionTitleStyle = { marginBottom: spacing.md };

  const roleSubtitle = (admin: string, teacher: string, learner: string) => {
    if (isAdmin) return admin;
    if (isTeacher) return teacher;
    return learner;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.surface }]}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingHorizontal: spacing.marginMobile, paddingTop: spacing.md, paddingBottom: spacing.md }]}>
        <Text variant="display" color="onSurface">Academics</Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
          {isAdmin && "Manage academic operations"}
          {isTeacher && "My teaching & classes"}
          {isStudent && "My learning & progress"}
          {isParent && "Child's academic progress"}
        </Text>
      </View>

      <View style={{ gap: spacing.lg }}>
        <Protected anyPermissions={[PERMS.SYSTEM_MANAGE, PERMS.USER_MANAGE]}>
          <View style={[styles.section, { paddingHorizontal: spacing.marginMobile }]}>
            <Text variant="headlineMd" color="onSurface" style={sectionTitleStyle}>Overview</Text>
            <View style={[styles.statsGrid, { gap: spacing.md }]}>
              <StatCard
                icon="school-outline"
                value={overview?.total_classes ?? 0}
                label="Classes"
                loading={overviewLoading}
              />
              <StatCard
                icon="book-outline"
                value={overview?.total_subjects ?? 0}
                label="Subjects"
                loading={overviewLoading}
              />
            </View>
          </View>
        </Protected>

        {/* Classes Section - Visible to All */}
        <View style={[styles.section, { paddingHorizontal: spacing.marginMobile }]}>
          <Text variant="headlineMd" color="onSurface" style={sectionTitleStyle}>
            {isAdmin && "All Classes"}
            {isTeacher && "My Classes"}
            {(isStudent || isParent) && "Classes"}
          </Text>

          <ActionCard
            icon="people-outline"
            title="View Classes"
            subtitle="See all class schedules"
            onPress={() => router.push("/(protected)/classes" as any)}
          />
        </View>

        {/* Attendance Section - only when plan has attendance feature enabled */}
        {isFeatureEnabled("attendance") && (
          <Protected
            anyPermissions={[
              PERMS.ATTENDANCE_MARK,
              PERMS.ATTENDANCE_READ_SELF,
              PERMS.ATTENDANCE_READ_CLASS,
              PERMS.ATTENDANCE_READ_ALL,
            ]}
          >
            <View style={[styles.section, { paddingHorizontal: spacing.marginMobile }]}>
              <Text variant="headlineMd" color="onSurface" style={sectionTitleStyle}>Attendance</Text>

              {/* Teacher: Mark Attendance (not admin) */}
              <Protected permission={PERMS.ATTENDANCE_MARK}>
                {!isAdmin && (
                  <ActionCard
                    icon="checkbox-outline"
                    title="Mark Attendance"
                    subtitle="Take attendance for your classes"
                    primary
                    onPress={() => router.push("/(protected)/attendance/my-classes" as any)}
                  />
                )}
              </Protected>

              {/* View Attendance (Student/Parent, not admin) */}
              <Protected anyPermissions={[PERMS.ATTENDANCE_READ_SELF]}>
                {!isAdmin && (
                  <ActionCard
                    icon="calendar-outline"
                    title="My Attendance"
                    subtitle="View attendance history and percentage"
                    onPress={() => router.push("/(protected)/attendance/my-attendance" as any)}
                  />
                )}
              </Protected>

              {/* View Attendance (Admin) */}
              <Protected permission={PERMS.ATTENDANCE_READ_ALL}>
                <ActionCard
                  icon="stats-chart-outline"
                  title="Attendance Overview"
                  subtitle="View all attendance records by class and date"
                  onPress={() => router.push("/(protected)/attendance/overview" as any)}
                />
              </Protected>
            </View>
          </Protected>
        )}

        {/* Grades Section */}
        <Protected
          anyPermissions={[
            PERMS.GRADE_CREATE,
            PERMS.GRADE_READ_SELF,
            PERMS.GRADE_READ_CLASS,
            PERMS.GRADE_MANAGE,
          ]}
        >
          <View style={[styles.section, { paddingHorizontal: spacing.marginMobile }]}>
            <Text variant="headlineMd" color="onSurface" style={sectionTitleStyle}>Grades & Marks</Text>

            {/* Teacher: Enter Grades */}
            <Protected anyPermissions={[PERMS.GRADE_CREATE, PERMS.GRADE_UPDATE]}>
              <ActionCard
                icon="create-outline"
                title="Enter Grades"
                subtitle="Add or update student grades"
              />
            </Protected>

            {/* View Grades */}
            <ActionCard
              icon="ribbon-outline"
              title="View Grades"
              subtitle={roleSubtitle("All grades and reports", "My class grades", "Grades and report card")}
            />
          </View>
        </Protected>

        {/* Assignments Section */}
        <Protected
          anyPermissions={[
            PERMS.ASSIGNMENT_CREATE,
            PERMS.ASSIGNMENT_READ_SELF,
            PERMS.ASSIGNMENT_SUBMIT,
            PERMS.ASSIGNMENT_MANAGE,
          ]}
        >
          <View style={[styles.section, { paddingHorizontal: spacing.marginMobile }]}>
            <Text variant="headlineMd" color="onSurface" style={sectionTitleStyle}>Assignments</Text>

            {/* Teacher: Create Assignment */}
            <Protected anyPermissions={[PERMS.ASSIGNMENT_CREATE, PERMS.ASSIGNMENT_MANAGE]}>
              <ActionCard
                icon="add-circle-outline"
                title="Create Assignment"
                subtitle="Add new assignment for class"
              />
            </Protected>

            {/* View/Submit Assignments */}
            <ActionCard
              icon="document-text-outline"
              title={isStudent || isParent ? "View & Submit" : "View Assignments"}
              subtitle={roleSubtitle("All assignments", "My class assignments", "Pending and completed")}
            />
          </View>
        </Protected>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  section: {},
  statsGrid: {
    flexDirection: "row",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
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
});
