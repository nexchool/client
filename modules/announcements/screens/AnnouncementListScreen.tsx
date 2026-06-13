// client/modules/announcements/screens/AnnouncementListScreen.tsx
import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { EmptyState } from '@/common/components/EmptyState';
import { useAnnouncementsList } from '../hooks/useAnnouncements';
import { AnnouncementRow } from '../components/AnnouncementRow';
import type { Announcement } from '../types';

type Tab = 'published' | 'scheduled' | 'draft';

const TABS: { value: Tab; label: string }[] = [
  { value: 'published', label: 'Sent' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Drafts' },
];

export default function AnnouncementListScreen() {
  const { t } = useTranslation('announcements');
  const { palette, spacing, radius, elevation } = useTheme();
  const [tab, setTab] = useState<Tab>('published');
  const { data: announcements = [], isLoading, isRefetching, refetch } = useAnnouncementsList(tab);

  const handleRowPress = (a: Announcement) => {
    router.push({ pathname: '/(protected)/announcements/[id]', params: { id: a.id } } as never);
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
      <Text variant="display" color="onSurface">
        {t('list.title', { defaultValue: 'Announcements' })}
      </Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
        {TABS.map((tk) => {
          const active = tab === tk.value;
          return (
            <Pressable
              key={tk.value}
              onPress={() => setTab(tk.value)}
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
              <Text variant="labelMd" color={active ? 'onTertiaryContainer' : 'onSurface'}>
                {tk.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        style={{ marginTop: spacing.lg }}
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AnnouncementRow announcement={item} onPress={handleRowPress} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<AppIcon name="megaphone-outline" size="xl" color="onSurfaceVariant" />}
              title={t(`list.empty.${tab}.title`, { defaultValue: 'Nothing here yet' })}
              description={t(`list.empty.${tab}.body`, { defaultValue: 'Tap + to compose a new announcement.' })}
            />
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.scrollBottom }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('list.newA11y', { defaultValue: 'New announcement' })}
        onPress={() => router.push('/(protected)/announcements/new' as never)}
        style={({ pressed }) => ({
          position: 'absolute',
          bottom: spacing.lg,
          right: spacing.marginMobile,
          width: 56,
          height: 56,
          borderRadius: radius.full,
          backgroundColor: palette.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          ...elevation.card,
        })}
      >
        <AppIcon name="add" size="xl" color="onPrimary" />
      </Pressable>
    </View>
  );
}
