import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import HolidaysScreen from '@/modules/holidays/screens/HolidaysScreen';

export default function Page() {
  const router = useRouter();
  const { isFeatureEnabled } = useAuth();

  // Holidays live in the academic calendar, and the API gates them behind it.
  // A school that keeps its calendar elsewhere had this screen open to anyone
  // who deep-linked or kept the shortcut — showing an empty list built from
  // 403s rather than saying the module is off.
  useEffect(() => {
    if (!isFeatureEnabled('academic_calendar')) {
      router.replace('/(protected)/home');
    }
  }, [isFeatureEnabled, router]);

  if (!isFeatureEnabled('academic_calendar')) {
    return null;
  }

  return <HolidaysScreen />;
}
