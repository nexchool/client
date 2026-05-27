import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useTheme } from '@/common/theme';
import StudentLeavesScreen from '@/modules/student-leaves/screens/StudentLeavesScreen';
import MyTeacherLeavesScreen from '@/modules/teacher-leaves/screens/MyTeacherLeavesScreen';
import { EmptyState } from '@/common/components/EmptyState';
import { ScreenContainer } from '@/common/components/ScreenContainer';

export default function MyLeavesPage() {
  const { isStudent, isTeacher } = useUiRole();
  const { palette } = useTheme();
  if (isStudent) return <StudentLeavesScreen />;
  if (isTeacher) return <MyTeacherLeavesScreen />;
  return (
    <ScreenContainer>
      <EmptyState
        icon={<Ionicons name="calendar-outline" size={28} color={palette.onSurfaceVariant} />}
        title="No leaves to show"
        description="Leaves are only available for students and teachers."
      />
    </ScreenContainer>
  );
}
