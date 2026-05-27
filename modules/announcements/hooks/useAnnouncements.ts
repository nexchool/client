import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { announcementService } from '../services/announcementService';
import type {
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '../types';

export const announcementKeys = {
  all: ['announcements'] as const,
  list: (status?: string, search?: string) =>
    ['announcements', 'list', status ?? '', search ?? ''] as const,
  detail: (id: string) => ['announcements', 'detail', id] as const,
  inbox: () => ['announcements', 'inbox'] as const,
  revisions: (id: string) => ['announcements', 'revisions', id] as const,
  recipients: (id: string) => ['announcements', 'recipients', id] as const,
  templates: () => ['announcements', 'templates'] as const,
};

export function useAnnouncementsList(status?: string, search?: string) {
  return useQuery({
    queryKey: announcementKeys.list(status, search),
    queryFn: () => announcementService.list(status, search),
  });
}

export function useAnnouncement(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: announcementKeys.detail(id ?? ''),
    queryFn: () => announcementService.get(id!),
    enabled: enabled && !!id,
  });
}

export function useInbox() {
  return useQuery({
    queryKey: announcementKeys.inbox(),
    queryFn: () => announcementService.inbox(),
  });
}

export function useAnnouncementRevisions(id: string | undefined) {
  return useQuery({
    queryKey: announcementKeys.revisions(id ?? ''),
    queryFn: () => announcementService.revisions(id!),
    enabled: !!id,
  });
}

export function useAnnouncementRecipients(id: string | undefined) {
  return useQuery({
    queryKey: announcementKeys.recipients(id ?? ''),
    queryFn: () => announcementService.recipients(id!),
    enabled: !!id,
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: announcementKeys.templates(),
    queryFn: () => announcementService.templates(),
    staleTime: 5 * 60 * 1000,
  });
}

function useInvalidatingMutation<TVar>(fn: (v: TVar) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: announcementKeys.all }),
  });
}

export function useCreateAnnouncement() {
  return useInvalidatingMutation<CreateAnnouncementPayload>((p) =>
    announcementService.create(p),
  );
}

export function useUpdateAnnouncement(id: string) {
  return useInvalidatingMutation<UpdateAnnouncementPayload>((p) =>
    announcementService.update(id, p),
  );
}

export function usePublishAnnouncement() {
  return useInvalidatingMutation<string>((id) => announcementService.publish(id));
}

export function useScheduleAnnouncement() {
  return useInvalidatingMutation<{ id: string; scheduled_at: string }>(
    ({ id, scheduled_at }) => announcementService.schedule(id, scheduled_at),
  );
}

export function useUnscheduleAnnouncement() {
  return useInvalidatingMutation<string>((id) => announcementService.unschedule(id));
}

export function useRecallAnnouncement() {
  return useInvalidatingMutation<{ id: string; reason: string }>(({ id, reason }) =>
    announcementService.recall(id, reason),
  );
}

export function useUploadAnnouncementAttachment() {
  return useInvalidatingMutation<{
    file: { uri: string; name: string; type: string };
    announcement_id?: string;
  }>(({ file, announcement_id }) =>
    announcementService.uploadAttachment(file, announcement_id),
  );
}

export function useDeleteAnnouncementAttachment() {
  return useInvalidatingMutation<string>((id) =>
    announcementService.deleteAttachment(id),
  );
}
