import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useTheme } from '@/common/theme';
import { EmptyState } from '@/common/components/EmptyState';
import MyProfileScreen from '@/modules/profile/screens/MyProfileScreen';
import StaffProfileScreen from '@/modules/profile/screens/StaffProfileScreen';

export default function ProfileScreen() {
  const { isStudent, isTeacher, isAdmin } = useUiRole();
  if (isStudent) return <MyProfileScreen />;
  if (isTeacher || isAdmin) return <StaffProfileScreen />;
  return <UnsupportedRoleProfile />;
}

function UnsupportedRoleProfile() {
  const { t } = useTranslation('profile');
  const { palette, spacing } = useTheme();
  return (
    <View style={{ flex: 1, padding: spacing.marginMobile, justifyContent: 'center' }}>
      <EmptyState
        icon={<Ionicons name="construct-outline" size={36} color={palette.onSurfaceVariant} />}
        title={t('unsupportedRole.title', { defaultValue: 'Profile not available for your role' })}
      />
    </View>
  );
}
