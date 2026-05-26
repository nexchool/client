import type { TFunction } from 'i18next';

/**
 * Returns a localized time-of-day greeting based on the local hour.
 * Hours 5-11 → morning, 12-16 → afternoon, 17-21 → evening, else → night.
 */
export function getTimeOfDayGreeting(t: TFunction, now: Date = new Date()): string {
  const hour = now.getHours();
  let key: 'morning' | 'afternoon' | 'evening' | 'night';
  if (hour >= 5 && hour < 12) key = 'morning';
  else if (hour >= 12 && hour < 17) key = 'afternoon';
  else if (hour >= 17 && hour < 22) key = 'evening';
  else key = 'night';

  const defaults: Record<typeof key, string> = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Hello',
  };
  return t(`greeting.${key}`, { defaultValue: defaults[key] });
}
