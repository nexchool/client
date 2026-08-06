import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import StudentTransportScreen from '@/modules/transport/screens/StudentTransportScreen';

export default function Page() {
  const router = useRouter();
  const { isFeatureEnabled } = useAuth();

  // A student's own bus details. The admin-facing transport routes sit behind
  // transport/_layout, but this one lives outside that folder and was left
  // open — reachable by deep link at a school that runs no buses.
  useEffect(() => {
    if (!isFeatureEnabled('transport')) {
      router.replace('/(protected)/home');
    }
  }, [isFeatureEnabled, router]);

  if (!isFeatureEnabled('transport')) {
    return null;
  }

  return <StudentTransportScreen />;
}
