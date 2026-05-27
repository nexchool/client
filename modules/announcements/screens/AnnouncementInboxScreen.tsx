// client/modules/announcements/screens/AnnouncementInboxScreen.tsx
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { EmptyState } from '@/common/components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
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
  const { palette, spacing, radius, typography } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const { data: announcements = [], isLoading, isRefetching, refetch } = useInbox();

  const filtered = useMemo(() => {
    if (filter === 'recalled') return announcements.filter((a) => a.status === 'recalled');
    if (filter === 'unread') return announcements; // server doesn't expose per-user read state on the inbox payload yet
    return announcements;
  }, [announcements, filter]);

  const handleRowPress = (a: Announcement) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: '/(protected)/announcements/[id]', params: { id: a.id } } as any);
  };

  return (
    <ScreenContainer>
      <Text style={[typography.display, { color: palette.onSurface }]}>
        {t('inbox.title', { defaultValue: 'Announcements' })}
      </Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                backgroundColor: active ? palette.tertiaryContainer : palette.surfaceContainerLowest,
                borderWidth: active ? 0 : 1,
                borderColor: palette.outlineVariant,
                opacity: pressed ? 0.85 : 1,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text
                style={[typography.labelMd, { color: active ? palette.onTertiaryContainer : palette.onSurface }]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
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
              icon={<Ionicons name="megaphone-outline" size={28} color={palette.onSurfaceVariant} />}
              title={t('inbox.empty.title', { defaultValue: 'No announcements yet' })}
              description={t('inbox.empty.body', { defaultValue: "When admins send announcements, they'll show up here." })}
            />
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </ScreenContainer>
  );
}
