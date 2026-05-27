import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useTheme } from '@/common/theme';
import { EmptyState } from '@/common/components/EmptyState';
import { AdminHome } from '@/modules/home/components/AdminHome';
import { TeacherHome } from '@/modules/home/components/TeacherHome';
import { StudentHome } from '@/modules/home/components/StudentHome';

export default function HomeScreen() {
  const { isAdmin, isTeacher, isStudent } = useUiRole();
  if (isAdmin) return <AdminHome />;
  if (isTeacher) return <TeacherHome />;
  if (isStudent) return <StudentHome />;
  return <UnsupportedRoleHome />;
}

function UnsupportedRoleHome() {
  const { t } = useTranslation('home');
  const { palette, spacing } = useTheme();
  return (
    <View style={{ flex: 1, padding: spacing.marginMobile, justifyContent: 'center' }}>
      <EmptyState
        icon={<Ionicons name="construct-outline" size={36} color={palette.onSurfaceVariant} />}
        title={t('unsupportedRole.title', { defaultValue: 'Mobile app coming soon for your role' })}
        description={t('unsupportedRole.body', {
          defaultValue:
            'Your account type is not yet supported on the nexchool mobile app. Please use the web dashboard or contact your school administrator.',
        })}
      />
    </View>
  );
}
