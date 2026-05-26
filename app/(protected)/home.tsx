import React from 'react';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { AdminHome } from '@/modules/home/components/AdminHome';
import { TeacherHome } from '@/modules/home/components/TeacherHome';
import { StudentHome } from '@/modules/home/components/StudentHome';

export default function HomeScreen() {
  const role = useUiRole() as any;
  if (role.isAdmin) return <AdminHome />;
  if (role.isTeacher) return <TeacherHome />;
  return <StudentHome />;
}
