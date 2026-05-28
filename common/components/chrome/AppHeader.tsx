import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useAcademicYearContext } from '@/modules/academics/context/AcademicYearContext';
import { useUnreadNotificationsBadge } from '@/modules/notifications/hooks/useNotifications';
import { AcademicYearSheet } from './AcademicYearSheet';

type Props = {
  onMenuPress: () => void;
};

export function AppHeader({ onMenuPress }: Props) {
  const { palette, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isFeatureEnabled, tenantName } = useAuth();
  const { isStudent, isAdmin, isTeacher } = useUiRole();
  const { academicYears, selectedAcademicYearId } = useAcademicYearContext();
  const showNotifBadge = isFeatureEnabled('notifications');
  const unreadBadge = useUnreadNotificationsBadge(showNotifBadge);
  const unreadCount = unreadBadge.data?.length ?? 0;
  const [ayOpen, setAyOpen] = useState(false);

  const schoolName =
    (user as any)?.school?.name ??
    (user as any)?.tenant?.name ??
    tenantName ??
    'Nexchool';

  const activeAy = academicYears.find((ay) => ay.id === selectedAcademicYearId);
  const ayLabel = activeAy?.name ?? '—';

  const showSearch = (isAdmin || isTeacher) && isFeatureEnabled('search');

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: palette.surface,
            paddingTop: insets.top,
            paddingHorizontal: spacing.marginMobile,
            paddingBottom: spacing.md,
            ...Platform.select({
              ios: {
                shadowColor: '#0b1c30',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 4,
              },
              android: { elevation: 1 },
            }),
          },
        ]}
      >
        <View style={[styles.row, { paddingTop: spacing.md }]}>
          <View style={[styles.left, { gap: 12 }]}>
            <Pressable
              onPress={onMenuPress}
              hitSlop={8}
              style={({ pressed }) => [
                styles.iconBtn,
                {
                  backgroundColor: pressed ? palette.surfaceContainer : 'transparent',
                  borderRadius: radius.full,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
            >
              <AppIcon name="menu" size="lg" color="onSurfaceVariant" />
            </Pressable>
            <Text
              variant="headlineMd"
              color="primary"
              style={styles.brand}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {schoolName}
            </Text>
          </View>

          <View style={[styles.right, { gap: spacing.sm }]}>
            {!isStudent && academicYears.length > 0 ? (
              <Pressable
                onPress={() => setAyOpen(true)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.ayChip,
                  {
                    backgroundColor: palette.surfaceContainer,
                    borderRadius: radius.full,
                    opacity: pressed ? 0.8 : 1,
                    gap: 4,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Academic year ${ayLabel}`}
              >
                <AppIcon name="calendar-outline" size="sm" color="onSurfaceVariant" />
                <Text
                  variant="labelSm"
                  color="onSurfaceVariant"
                  style={{ includeFontPadding: false }}
                  numberOfLines={1}
                >
                  {ayLabel}
                </Text>
              </Pressable>
            ) : null}
            {showSearch ? (
              <Pressable
                onPress={() => router.push('/(protected)/search')}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.iconBtn,
                  {
                    backgroundColor: pressed ? palette.surfaceContainer : 'transparent',
                    borderRadius: radius.full,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <AppIcon name="search-outline" size="lg" color="onSurfaceVariant" />
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => router.push('/(protected)/notifications')}
              hitSlop={8}
              style={({ pressed }) => [
                styles.iconBtn,
                {
                  backgroundColor: pressed ? palette.surfaceContainer : 'transparent',
                  borderRadius: radius.full,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <AppIcon name="notifications-outline" size="lg" color="onSurfaceVariant" />
              {unreadCount > 0 ? (
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: palette.error,
                      borderColor: palette.surface,
                    },
                  ]}
                />
              ) : null}
            </Pressable>
          </View>
        </View>
      </View>
      <AcademicYearSheet visible={ayOpen} onClose={() => setAyOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {},
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8 },
  brand: { flexShrink: 1 },
  ayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
