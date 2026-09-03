import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ContentMaxWidth, useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useUnreadNotificationsBadge } from '@/modules/notifications/hooks/useNotifications';

type Props = {
  onMenuPress: () => void;
};

export function AppHeader({ onMenuPress }: Props) {
  const { palette, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isFeatureEnabled, tenantName } = useAuth();
  const { isAdmin, isTeacher } = useUiRole();
  const showNotifBadge = isFeatureEnabled('notifications');
  const unreadBadge = useUnreadNotificationsBadge(showNotifBadge);
  const unreadCount = unreadBadge.data?.length ?? 0;

  const schoolName =
    (user as any)?.school?.name ??
    (user as any)?.tenant?.name ??
    tenantName ??
    'Nexchool';

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
    </>
  );
}

const styles = StyleSheet.create({
  // The bar's surface spans the device; its controls line up with the content
  // column. Left unbounded, space-between puts the menu button and the avatar
  // at opposite ends of a 1366pt iPad with a field of empty bar between them.
  container: { alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: ContentMaxWidth,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8 },
  brand: { flexShrink: 1 },
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
