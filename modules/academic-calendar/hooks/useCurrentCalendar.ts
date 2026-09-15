import { useQuery } from '@tanstack/react-query';
import { academicCalendarService } from '../services/academicCalendarService';

const KEYS = ['academicCalendar', 'current'] as const;

/**
 * The school's published calendar, as this caller may see it.
 *
 * Not parameterised by academic year: the server answers for the active one,
 * and a read-only phone screen has no year picker to disagree with it.
 *
 * No tenant in the key, matching every other hook in this app — a phone holds
 * one school's session at a time and `AuthProvider` clears the cache on sign
 * in and out. (admin-web, where one person moves between tenants, does key by
 * tenant; see `.claude/rules/query-conventions.md`.)
 */
export function useCurrentCalendar() {
  return useQuery({
    queryKey: KEYS,
    queryFn: () => academicCalendarService.getCurrent(),
    staleTime: 5 * 60 * 1000,
  });
}
