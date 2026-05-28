import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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

type Role = 'admin' | 'teacher' | 'student' | 'parent' | 'unknown';

type DrawerItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  route: string;
  roles: Role[];
  flag?: 'fees_management' | 'hostel' | 'transport' | 'notifications' | 'attendance' | 'timetable' | 'schedule_management' | 'holiday_management' | 'library' | 'inventory' | 'examinations' | 'reports' | 'search' | 'academics_advanced' | 'student_management' | 'teacher_management' | 'class_management';
};

const ITEMS: readonly DrawerItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: '/(protected)/home', roles: ['admin', 'teacher', 'student', 'parent'] },
  { key: 'students', label: 'Students', icon: 'people-outline', iconActive: 'people', route: '/(protected)/students', roles: ['admin', 'teacher'] },
  { key: 'teachers', label: 'Teachers', icon: 'person-outline', iconActive: 'person', route: '/(protected)/teachers', roles: ['admin'] },
  { key: 'classes', label: 'Classes', icon: 'school-outline', iconActive: 'school', route: '/(protected)/classes', roles: ['admin', 'teacher'] },
  { key: 'subjects', label: 'Subjects', icon: 'book-outline', iconActive: 'book', route: '/(protected)/subjects', roles: ['admin', 'teacher', 'student'] },
  { key: 'academics', label: 'Academics', icon: 'library-outline', iconActive: 'library', route: '/(protected)/academics', roles: ['admin'] },
  { key: 'attendance', label: 'Attendance', icon: 'checkmark-done-outline', iconActive: 'checkmark-done', route: '/(protected)/attendance/overview', roles: ['admin', 'teacher'] },
  { key: 'schedule', label: 'Schedule', icon: 'time-outline', iconActive: 'time', route: '/(protected)/schedule/today', roles: ['admin', 'teacher', 'student', 'parent'] },
  { key: 'holidays', label: 'Holidays', icon: 'flag-outline', iconActive: 'flag', route: '/(protected)/holidays', roles: ['admin', 'teacher', 'student', 'parent'] },
  { key: 'announcements', label: 'Announcements', icon: 'megaphone-outline', iconActive: 'megaphone', route: '/(protected)/announcements', roles: ['admin', 'teacher', 'student', 'parent'] },
  { key: 'leaves', label: 'My leaves', icon: 'briefcase-outline', iconActive: 'briefcase', route: '/(protected)/my-leaves', roles: ['admin', 'teacher', 'student'] },
  { key: 'student-leaves', label: 'Student leaves', icon: 'calendar-outline', iconActive: 'calendar', route: '/(protected)/approve-student-leaves', roles: ['admin', 'teacher'] },
  { key: 'finance', label: 'Finance', icon: 'wallet-outline', iconActive: 'wallet', route: '/(protected)/finance', roles: ['admin', 'student'], flag: 'fees_management' },
  // 'activities' is not a server-side plan feature key (see server/core/feature_flags.py).
  // Leaving unflagged so the item shows whenever the tenant exists.
  { key: 'activities', label: 'Activities', icon: 'sparkles-outline', iconActive: 'sparkles', route: '/(protected)/activities', roles: ['admin', 'teacher', 'student'] },
  { key: 'my-transport', label: 'My Transport', icon: 'bus-outline', iconActive: 'bus', route: '/(protected)/my-transport', roles: ['student'], flag: 'transport' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

const DRAWER_WIDTH_RATIO = 0.84;
const SCREEN_W = Dimensions.get('window').width;
const DRAWER_W = Math.round(SCREEN_W * DRAWER_WIDTH_RATIO);

export function AppDrawer({ visible, onClose }: Props) {
  const { t } = useTranslation('common');
  const { palette, spacing, radius, typography } = useTheme();
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
          <View style={{ flex: 1 }}>
            <Text
              style={[typography.headlineMd, { color: palette.primary }]}
              numberOfLines={1}
            >
              {userName}
            </Text>
            <Text
              style={[typography.bodyMd, { color: palette.onSurfaceVariant }]}
              numberOfLines={1}
            >
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
              <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]}>
                {t('noModulesAvailable', {
                  defaultValue: "Your account doesn't have any modules available yet.",
                })}
              </Text>
            </View>
          ) : (
            visibleItems.map((item, idx) => (
              <Pressable
                key={item.key}
                onPress={() => handleNav(item.route)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: pressed ? palette.surfaceContainerHigh : 'transparent',
                    borderRadius: radius.lg,
                    marginHorizontal: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    gap: spacing.md,
                    marginTop: idx > 0 && idx % 5 === 0 ? spacing.sm : 4,
                  },
                ]}
              >
                <Ionicons name={item.icon} size={22} color={palette.onSurfaceVariant} />
                <Text
                  style={[
                    typography.labelMd,
                    { color: palette.onSurfaceVariant, fontFamily: 'Inter_500Medium' },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderTopColor: palette.surfaceContainerHigh,
          }}
        >
          <Pressable
            onPress={() => handleNav('/(protected)/settings')}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: pressed ? palette.surfaceContainerHigh : 'transparent',
                borderRadius: radius.lg,
                paddingHorizontal: 16,
                paddingVertical: 12,
                gap: spacing.md,
              },
            ]}
          >
            <Ionicons name="settings-outline" size={22} color={palette.onSurfaceVariant} />
            <Text style={[typography.labelMd, { color: palette.onSurfaceVariant }]}>
              {t('settings', { defaultValue: 'Settings' })}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleNav('/(protected)/help-support')}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: pressed ? palette.surfaceContainerHigh : 'transparent',
                borderRadius: radius.lg,
                paddingHorizontal: 16,
                paddingVertical: 12,
                gap: spacing.md,
              },
            ]}
          >
            <Ionicons name="help-circle-outline" size={22} color={palette.onSurfaceVariant} />
            <Text style={[typography.labelMd, { color: palette.onSurfaceVariant }]}>
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
                paddingHorizontal: 16,
                paddingVertical: 12,
                gap: spacing.sm,
                marginTop: spacing.sm,
              },
            ]}
          >
            <Ionicons name="log-out-outline" size={22} color={palette.error} />
            <Text
              style={[
                typography.labelMd,
                { color: palette.error, fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              {t('signOut', { defaultValue: 'Sign out' })}
            </Text>
          </Pressable>

          <Text
            style={[
              typography.labelSm,
              {
                color: palette.onSurfaceVariant,
                opacity: 0.6,
                textAlign: 'center',
                marginTop: spacing.sm,
              },
            ]}
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
