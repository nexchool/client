import { Redirect } from 'expo-router';

/**
 * Holidays folded into the Academic Calendar, which is the one read-only
 * surface for closures on mobile — editing them is admin-web's job.
 *
 * Kept as a redirect rather than deleted: shortcuts, notification deep links
 * and anyone's muscle memory still point here.
 */
export default function Page() {
  return <Redirect href="/(protected)/academic-calendar" />;
}
