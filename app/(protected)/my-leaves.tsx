import React from 'react';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import StudentLeavesScreen from '@/modules/student-leaves/screens/StudentLeavesScreen';
import MyTeacherLeavesScreen from '@/modules/teacher-leaves/screens/MyTeacherLeavesScreen';
import { EmptyState } from '@/common/components/EmptyState';
import { AppIcon } from '@/common/components/AppIcon';
import { ScreenContainer } from '@/common/components/ScreenContainer';

export default function MyLeavesPage() {
  const { isStudent, isTeacher } = useUiRole();
  if (isStudent) return <StudentLeavesScreen />;
  if (isTeacher) return <MyTeacherLeavesScreen />;
  return (
    <ScreenContainer>
      <EmptyState
        icon={<AppIcon name="calendar-outline" size="lg" color="onSurfaceVariant" />}
        title="No leaves to show"
        description="Leaves are only available for students and teachers."
      />
    </ScreenContainer>
  );
}
