import React from 'react';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import AnnouncementInboxScreen from '@/modules/announcements/screens/AnnouncementInboxScreen';
import AnnouncementListScreen from '@/modules/announcements/screens/AnnouncementListScreen';

export default function AnnouncementsPage() {
  const { isAdmin } = useUiRole();
  if (isAdmin) return <AnnouncementListScreen />;
  return <AnnouncementInboxScreen />;
}
