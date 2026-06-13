// client/modules/announcements/screens/AnnouncementInboxScreen.tsx
import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { EmptyState } from '@/common/components/EmptyState';
import { FilterChips } from '@/common/components/FilterChips';
import { useInbox } from '../hooks/useAnnouncements';
import { AnnouncementRow } from '../components/AnnouncementRow';
import type { Announcement } from '../types';

type Filter = 'all' | 'unread' | 'recalled';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'recalled', label: 'Recalled' },
];

export default function AnnouncementInboxScreen() {
  const { t } = useTranslation('announcements');
  const { spacing } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const { data: announcements = [], isLoading, isRefetching, refetch } = useInbox();

  const filtered = useMemo(() => {
    if (filter === 'recalled') return announcements.filter((a) => a.status === 'recalled');
    if (filter === 'unread') return announcements; // server doesn't expose per-user read state on the inbox payload yet
    return announcements;
  }, [announcements, filter]);

  const handleRowPress = (a: Announcement) => {
    router.push({ pathname: '/(protected)/announcements/[id]', params: { id: a.id } } as never);
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
      <Text variant="display" color="onSurface">
        {t('inbox.title', { defaultValue: 'Announcements' })}
      </Text>

      <View style={{ marginTop: spacing.md }}>
        <FilterChips
          options={FILTERS.map((f) => ({
            value: f.value,
            label: t(`inbox.filter.${f.value}`, { defaultValue: f.label }),
          }))}
          value={filter}
          onChange={setFilter}
        />
      </View>

      <FlatList
        style={{ marginTop: spacing.lg }}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AnnouncementRow announcement={item} onPress={handleRowPress} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<AppIcon name="megaphone-outline" size="xl" color="onSurfaceVariant" />}
              title={t('inbox.empty.title', { defaultValue: 'No announcements yet' })}
              description={t('inbox.empty.body', { defaultValue: "When admins send announcements, they'll show up here." })}
            />
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
      />
    </View>
  );
}
