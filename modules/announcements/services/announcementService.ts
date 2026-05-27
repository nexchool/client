import { apiDelete, apiGet, apiPatch, apiPost, apiPostForm } from '@/common/services/api';
import type {
  Announcement,
  AnnouncementAttachment,
  AnnouncementRevision,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
  RecipientReadStatus,
  SystemTemplate,
} from '../types';

export const announcementService = {
  list: (status?: string, search?: string) => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (search) q.set('search', search);
    const qs = q.toString();
    return apiGet<Announcement[]>(`/api/announcements${qs ? '?' + qs : ''}`);
  },
  get: (id: string) => apiGet<Announcement>(`/api/announcements/${id}`),
  inbox: () => apiGet<Announcement[]>('/api/announcements/inbox'),
  revisions: (id: string) =>
    apiGet<AnnouncementRevision[]>(`/api/announcements/${id}/revisions`),
  recipients: (id: string) =>
    apiGet<RecipientReadStatus[]>(`/api/announcements/${id}/recipients`),
  templates: () => apiGet<SystemTemplate[]>('/api/announcements/templates'),

  create: (payload: CreateAnnouncementPayload) =>
    apiPost<Announcement>('/api/announcements', payload),
  update: (id: string, payload: UpdateAnnouncementPayload) =>
    apiPatch<Announcement>(`/api/announcements/${id}`, payload),
  publish: (id: string) => apiPost<Announcement>(`/api/announcements/${id}/publish`, {}),
  schedule: (id: string, scheduled_at: string) =>
    apiPost<Announcement>(`/api/announcements/${id}/schedule`, { scheduled_at }),
  unschedule: (id: string) =>
    apiPost<Announcement>(`/api/announcements/${id}/unschedule`, {}),
  recall: (id: string, reason: string) =>
    apiPost<Announcement>(`/api/announcements/${id}/recall`, { reason }),

  uploadAttachment: (
    file: { uri: string; name: string; type: string },
    announcement_id?: string,
  ): Promise<AnnouncementAttachment> => {
    const form = new FormData();
    // React Native FormData accepts the file descriptor object directly.
    form.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
    if (announcement_id) form.append('announcement_id', announcement_id);
    return apiPostForm<AnnouncementAttachment>('/api/announcements/attachments', form);
  },
  deleteAttachment: (id: string) =>
    apiDelete<unknown>(`/api/announcements/attachments/${id}`),
  downloadAttachment: (id: string) =>
    apiGet<{ url: string }>(`/api/announcements/attachments/${id}/download`),
};
