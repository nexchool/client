import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleOverrideService } from '../services/scheduleOverrideService';

export function useCreateScheduleOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: scheduleOverrideService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule'] });
      qc.invalidateQueries({ queryKey: ['academics', 'class-session'] });
      qc.invalidateQueries({ queryKey: ['teacher', 'today-schedule'] });
    },
  });
}
