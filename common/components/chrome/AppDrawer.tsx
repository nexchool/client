import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/common/theme';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { ProfileAvatar } from '@/common/components/ProfileAvatar';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';

type Role = 'admin' | 'teacher' | 'student' | 'parent' | 'unknown';

/** Drawer sections, in display order. Dashboard sits above all sections. */
type SectionKey = 'people' | 'academics' | 'operations' | 'communication' | 'admin';

const SECTIONS: { key: SectionKey; labelKey: string; fallback: string }[] = [
  { key: 'people', labelKey: 'section.people', fallback: 'People' },
  { key: 'academics', labelKey: 'section.academics', fallback: 'Academics' },
  { key: 'operations', labelKey: 'section.operations', fallback: 'Operations' },
  { key: 'communication', labelKey: 'section.communication', fallback: 'Communication' },
  { key: 'admin', labelKey: 'section.admin', fallback: 'Admin' },
];

type DrawerItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  route: string;
  roles: Role[];
  /** Section grouping; omitted = top-level anchor (Dashboard). */
  section?: SectionKey;
  flag?: 'fees_management' | 'hostel' | 'transport' | 'notifications' | 'attendance' | 'timetable' | 'schedule_management' | 'holiday_management' | 'search' | 'academics_advanced' | 'student_management' | 'teacher_management' | 'class_management';
};

const ITEMS: readonly DrawerItem[] = [
  // Top anchor — Home/Schedule also live in the bottom tab bar; Dashboard stays
  // here as the drawer's landing row.
  { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: '/(protected)/home', roles: ['admin', 'teacher', 'student', 'parent'] },

  // People
  { key: 'students', label: 'Students', icon: 'people-outline', iconActive: 'people', route: '/(protected)/students', roles: ['admin', 'teacher'], section: 'people' },
  { key: 'teachers', label: 'Teachers', icon: 'person-outline', iconActive: 'person', route: '/(protected)/teachers', roles: ['admin'], section: 'people' },
  { key: 'classes', label: 'Classes', icon: 'school-outline', iconActive: 'school', route: '/(protected)/classes', roles: ['admin', 'teacher'], section: 'people' },
  { key: 'subjects', label: 'Subjects', icon: 'book-outline', iconActive: 'book', route: '/(protected)/subjects', roles: ['admin', 'teacher', 'student'], flag: 'class_management', section: 'people' },

  // Academics
  { key: 'academics', label: 'Academics', icon: 'library-outline', iconActive: 'library', route: '/(protected)/academics', roles: ['admin'], section: 'academics' },
  { key: 'attendance', label: 'Attendance', icon: 'checkmark-done-outline', iconActive: 'checkmark-done', route: '/(protected)/attendance/overview', roles: ['admin', 'teacher'], section: 'academics' },
  { key: 'timetable', label: 'Timetable', icon: 'calendar-number-outline', iconActive: 'calendar-number', route: '/(protected)/timetable', roles: ['admin', 'teacher'], flag: 'timetable', section: 'academics' },
  { key: 'holidays', label: 'Holidays', icon: 'flag-outline', iconActive: 'flag', route: '/(protected)/holidays', roles: ['admin', 'teacher', 'student', 'parent'], section: 'academics' },

  // Operations
  { key: 'finance', label: 'Finance', icon: 'wallet-outline', iconActive: 'wallet', route: '/(protected)/finance', roles: ['admin', 'student'], flag: 'fees_management', section: 'operations' },
  { key: 'transport', label: 'Transport', icon: 'bus-outline', iconActive: 'bus', route: '/(protected)/transport', roles: ['admin'], flag: 'transport', section: 'operations' },
  { key: 'my-transport', label: 'My transport', icon: 'bus-outline', iconActive: 'bus', route: '/(protected)/my-transport', roles: ['student'], flag: 'transport', section: 'operations' },
  { key: 'hostel', label: 'Hostel', icon: 'bed-outline', iconActive: 'bed', route: '/(protected)/hostel', roles: ['admin'], flag: 'hostel', section: 'operations' },
  { key: 'leaves', label: 'My leaves', icon: 'briefcase-outline', iconActive: 'briefcase', route: '/(protected)/my-leaves', roles: ['admin', 'teacher', 'student'], section: 'operations' },
  { key: 'leave-approvals', label: 'Leave approvals', icon: 'clipboard-outline', iconActive: 'clipboard', route: '/(protected)/leave-approvals', roles: ['admin', 'teacher'], section: 'operations' },

  // Communication
  { key: 'announcements', label: 'Announcements', icon: 'megaphone-outline', iconActive: 'megaphone', route: '/(protected)/announcements', roles: ['admin', 'teacher', 'student', 'parent'], section: 'communication' },

  // Admin
  { key: 'audit-log', label: 'Audit log', icon: 'shield-checkmark-outline', iconActive: 'shield-checkmark', route: '/(protected)/audit-log', roles: ['admin'], section: 'admin' },
];

/**
 * `usePathname()` resolves Expo Router paths WITHOUT route-group segments,
 * e.g. `/(protected)/attendance/overview` is reported as `/attendance/overview`.
 * Strip group segments like `(protected)` so item routes can be matched against it.
 */
function stripRouteGroups(route: string): string {
  const cleaned = route
    .split('/')
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')))
    .join('/');
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

function isItemActive(itemRoute: string, pathname: string): boolean {
  const base = stripRouteGroups(itemRoute);
  if (pathname === base) return true;
  return pathname.startsWith(`${base}/`);
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

const DRAWER_WIDTH_RATIO = 0.84;
const SCREEN_W = Dimensions.get('window').width;
const DRAWER_W = Math.round(SCREEN_W * DRAWER_WIDTH_RATIO);

export function AppDrawer({ visible, onClose }: Props) {
  const { t } = useTranslation('common');
  const { palette, spacing, radius } = useTheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user, isFeatureEnabled, logout, tenantName } = useAuth();
  const { isAdmin, isTeacher, isStudent, isParent } = useUiRole();
  const currentRole: Role =
    isAdmin ? 'admin' :
    isTeacher ? 'teacher' :
    isStudent ? 'student' :
    isParent ? 'parent' :
    'unknown';

  // Keep the Modal mounted through the close animation so the slide-out is seen.
  const [mounted, setMounted] = useState(visible);
  const translateX = useSharedValue(-DRAWER_W);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateX.value = withTiming(0, { duration: 240 });
      backdropOpacity.value = withTiming(1, { duration: 240 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 220 });
      translateX.value = withTiming(-DRAWER_W, { duration: 220 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, translateX, backdropOpacity]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const userName =
    ((user as any)?.first_name && (user as any)?.last_name && `${(user as any).first_name} ${(user as any).last_name}`) ||
    user?.name ||
    user?.email ||
    'User';
  const userRoleLabel =
    isAdmin ? 'Admin' :
    isTeacher ? 'Teacher' :
    isStudent ? 'Student' :
    isParent ? 'Parent' :
    '';
  const schoolName = (user as any)?.school?.name ?? (user as any)?.tenant?.name ?? tenantName ?? '';
  const roleLine = schoolName ? `${userRoleLabel} · ${schoolName}` : userRoleLabel;

  const visibleItems = ITEMS.filter((item) => {
    if (!item.roles.includes(currentRole)) return false;
    if (item.flag && !isFeatureEnabled(item.flag)) return false;
    return true;
  });

  const handleNav = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as never), 200);
  };

  const handleLogout = () => {
    Alert.alert(
      t('signOutConfirmTitle', { defaultValue: 'Sign out?' }),
      t('signOutConfirmMessage', { defaultValue: 'You will need to sign in again to access your account.' }),
      [
        { text: t('cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('signOut', { defaultValue: 'Sign out' }),
          style: 'destructive',
          onPress: async () => {
            onClose();
            await logout();
          },
        },
      ]
    );
  };

  const renderRow = (item: DrawerItem) => {
    const active = isItemActive(item.route, pathname);
    return (
      <Pressable
        key={item.key}
        onPress={() => handleNav(item.route)}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: active
              ? palette.primaryContainer
              : pressed
                ? palette.surfaceContainerHigh
                : 'transparent',
            borderRadius: radius.lg,
            marginHorizontal: spacing.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + spacing.xs,
            gap: spacing.md,
          },
        ]}
      >
        {active ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: spacing.sm,
              bottom: spacing.sm,
              width: 3,
              borderRadius: 2,
              backgroundColor: palette.primary,
            }}
          />
        ) : null}
        <AppIcon
          name={active ? item.iconActive : item.icon}
          size="lg"
          color={active ? 'onPrimaryContainer' : 'onSurfaceVariant'}
        />
        <Text
          variant={active ? 'labelLg' : 'labelMd'}
          color={active ? 'onPrimaryContainer' : 'onSurfaceVariant'}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View
        style={[
          styles.backdrop,
          { backgroundColor: 'rgba(11, 28, 48, 0.40)' },
          backdropStyle,
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_W,
            backgroundColor: palette.surface,
            borderTopRightRadius: radius.xl,
            borderBottomRightRadius: radius.xl,
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          },
          drawerStyle,
        ]}
      >
        <View
          style={[
            styles.profile,
            {
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.md,
              marginBottom: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: palette.surfaceContainerHigh,
              gap: spacing.md,
            },
          ]}
        >
          <ProfileAvatar size={48} name={userName} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="titleSm" color="primary" numberOfLines={1}>
              {userName}
            </Text>
            <Text variant="bodySm" color="onSurfaceVariant" numberOfLines={1}>
              {roleLine}
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
        >
          {visibleItems.length === 0 ? (
            <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }}>
              <Text variant="bodyMd" color="onSurfaceVariant">
                {t('noModulesAvailable', {
                  defaultValue: "Your account doesn't have any modules available yet.",
                })}
              </Text>
            </View>
          ) : (
            <>
              {/* Dashboard anchor (no section header) */}
              {visibleItems.filter((i) => !i.section).map(renderRow)}
              {/* Grouped sections — empty sections (after role/flag filter) are hidden */}
              {SECTIONS.map((sec) => {
                const items = visibleItems.filter((i) => i.section === sec.key);
                if (items.length === 0) return null;
                return (
                  <View key={sec.key} style={{ marginTop: spacing.md }}>
                    <Text
                      variant="labelSm"
                      color="onSurfaceVariant"
                      style={{
                        paddingHorizontal: spacing.lg,
                        marginBottom: spacing.xs,
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                        opacity: 0.7,
                      }}
                    >
                      {t(sec.labelKey, { defaultValue: sec.fallback })}
                    </Text>
                    {items.map(renderRow)}
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            gap: spacing.xs,
            borderTopWidth: 1,
            borderTopColor: palette.surfaceContainerHigh,
          }}
        >
          {(() => {
            const settingsActive = isItemActive('/(protected)/settings', pathname);
            return (
              <Pressable
                onPress={() => handleNav('/(protected)/settings')}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: settingsActive
                      ? palette.primaryContainer
                      : pressed
                        ? palette.surfaceContainerHigh
                        : 'transparent',
                    borderRadius: radius.lg,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm + spacing.xs,
                    gap: spacing.md,
                  },
                ]}
              >
                <AppIcon
                  name={settingsActive ? 'settings' : 'settings-outline'}
                  size="lg"
                  color={settingsActive ? 'onPrimaryContainer' : 'onSurfaceVariant'}
                />
                <Text
                  variant={settingsActive ? 'labelLg' : 'labelMd'}
                  color={settingsActive ? 'onPrimaryContainer' : 'onSurfaceVariant'}
                >
                  {t('settings', { defaultValue: 'Settings' })}
                </Text>
              </Pressable>
            );
          })()}
          <Pressable
            onPress={() => handleNav('/(protected)/help-support')}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: pressed ? palette.surfaceContainerHigh : 'transparent',
                borderRadius: radius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + spacing.xs,
                gap: spacing.md,
              },
            ]}
          >
            <AppIcon name="help-circle-outline" size="lg" color="onSurfaceVariant" />
            <Text variant="labelMd" color="onSurfaceVariant">
              {t('helpSupport', { defaultValue: 'Help & Support' })}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.signOut,
              {
                backgroundColor: pressed ? palette.errorContainer : 'transparent',
                borderRadius: radius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + spacing.xs,
                gap: spacing.sm,
                marginTop: spacing.xs,
              },
            ]}
          >
            <AppIcon name="log-out-outline" size="lg" color="error" />
            <Text variant="labelLg" color="error">
              {t('signOut', { defaultValue: 'Sign out' })}
            </Text>
          </Pressable>

          <Text
            variant="labelSm"
            color="onSurfaceVariant"
            style={{
              opacity: 0.6,
              textAlign: 'center',
              marginTop: spacing.sm,
            }}
          >
            v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    shadowColor: '#0b1c30',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  profile: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
