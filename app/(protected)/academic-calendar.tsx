import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import AcademicCalendarScreen from '@/modules/academic-calendar/screens/AcademicCalendarScreen';

export default function Page() {
  const router = useRouter();
  const { isFeatureEnabled } = useAuth();

  // The API gates the calendar behind a module a school may not have bought.
  // Without this guard the screen renders an empty state built from 403s
  // rather than saying the module is off.
  useEffect(() => {
    if (!isFeatureEnabled('academic_calendar')) {
      router.replace('/(protected)/home');
    }
  }, [isFeatureEnabled, router]);

  if (!isFeatureEnabled('academic_calendar')) {
    return null;
  }

  return <AcademicCalendarScreen />;
}
