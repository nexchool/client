import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { useUnreadNotificationsBadge } from '@/modules/notifications/hooks/useNotifications';
import { useAuth } from '@/modules/auth/hooks/useAuth';

type Tab = {
  key: 'home' | 'schedule' | 'notifications' | 'profile';
  route: string;
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
};

const TABS: readonly Tab[] = [
  {
    key: 'home',
    route: '/(protected)/home',
    label: 'Home',
    iconActive: 'home',
    iconInactive: 'home-outline',
  },
  {
    key: 'schedule',
    route: '/(protected)/schedule/today',
    label: 'Schedule',
    iconActive: 'calendar',
    iconInactive: 'calendar-outline',
  },
  {
    key: 'notifications',
    route: '/(protected)/notifications',
    label: 'Notifications',
    iconActive: 'notifications',
    iconInactive: 'notifications-outline',
  },
  {
    key: 'profile',
    route: '/(protected)/profile',
    label: 'Profile',
    iconActive: 'person-circle',
    iconInactive: 'person-circle-outline',
  },
];

function isTabActive(pathname: string, tabRoute: string): boolean {
  const tabSegment = tabRoute.split('/').filter(Boolean).pop()!;
  if (tabSegment === 'today') {
    return pathname.startsWith('/schedule');
  }
  return pathname === `/${tabSegment}` || pathname.startsWith(`/${tabSegment}/`);
}

export function BottomTabBar() {
  const { palette, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { isFeatureEnabled } = useAuth();
  const showNotifBadge = isFeatureEnabled('notifications');
  const unreadBadge = useUnreadNotificationsBadge(showNotifBadge);
  const unreadCount = unreadBadge.data?.length ?? 0;

  const handlePress = (tab: Tab) => {
    const active = isTabActive(pathname, tab.route);
    if (active) {
      router.replace(tab.route as never);
    } else {
      router.push(tab.route as never);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingHorizontal: spacing.sm,
          paddingTop: spacing.xs,
          paddingBottom: Math.max(insets.bottom, spacing.xs),
          ...Platform.select({
            ios: {
              shadowColor: '#0b1c30',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
            },
            android: { elevation: 8 },
          }),
        },
      ]}
    >
      {TABS.map((tab) => {
        const active = isTabActive(pathname, tab.route);
        const fg = active ? palette.onTertiaryContainer : palette.onSurfaceVariant;
        return (
          <Pressable
            key={tab.key}
            onPress={() => handlePress(tab)}
            style={({ pressed }) => [
              styles.item,
              {
                opacity: pressed ? 0.7 : 1,
                backgroundColor: active ? palette.tertiaryContainer : 'transparent',
                borderRadius: active ? radius.full : 0,
                paddingHorizontal: active ? 16 : 8,
                paddingVertical: 4,
              },
            ]}
            hitSlop={8}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <View>
              <Ionicons
                name={active ? tab.iconActive : tab.iconInactive}
                size={22}
                color={fg}
              />
              {tab.key === 'notifications' && unreadCount > 0 ? (
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: palette.error,
                      borderColor: palette.surfaceContainerLowest,
                    },
                  ]}
                />
              ) : null}
            </View>
            <Text
              style={[
                typography.labelSm,
                {
                  color: fg,
                  marginTop: 2,
                  includeFontPadding: false,
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  item: { alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
