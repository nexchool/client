import { useState, useCallback } from 'react';
import i18n from '@/i18n/i18nextInstance';
import { Holiday } from '../types';
import { holidayService } from '../services/holidayService';

export function useHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [recurringHolidays, setRecurringHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHolidays = useCallback(async (params: Parameters<typeof holidayService.getHolidays>[0] = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await holidayService.getHolidays({ ...params, include_recurring: false });
      setHolidays(data);
    } catch (err: any) {
      setError(err.message || i18n.t('errors.loadFailed', { ns: 'holidays' }));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecurring = useCallback(async () => {
    try {
      const data = await holidayService.getRecurring();
      setRecurringHolidays(data);
    } catch {
      // Non-critical; silently fail
    }
  }, []);

  const deleteHoliday = useCallback(async (id: string, isRecurring: boolean) => {
    await holidayService.deleteHoliday(id);
    if (isRecurring) {
      setRecurringHolidays((prev) => prev.filter((h) => h.id !== id));
    } else {
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    }
  }, []);

  return {
    holidays,
    recurringHolidays,
    loading,
    error,
    fetchHolidays,
    fetchRecurring,
    deleteHoliday,
  };
}
