// client/modules/announcements/screens/AnnouncementListScreen.tsx
import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { EmptyState } from '@/common/components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
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
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const [tab, setTab] = useState<Tab>('published');
  const { data: announcements = [], isLoading, isRefetching, refetch } = useAnnouncementsList(tab);

  const handleRowPress = (a: Announcement) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: '/(protected)/announcements/[id]', params: { id: a.id } } as any);
  };

  return (
    <ScreenContainer>
      <Text style={[typography.display, { color: palette.onSurface }]}>
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
              <Text
                style={[typography.labelMd, { color: active ? palette.onTertiaryContainer : palette.onSurface }]}
              >
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
              icon={<Ionicons name="megaphone-outline" size={28} color={palette.onSurfaceVariant} />}
              title={t(`list.empty.${tab}.title`, { defaultValue: 'Nothing here yet' })}
              description={t(`list.empty.${tab}.body`, { defaultValue: 'Tap + to compose a new announcement.' })}
            />
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New announcement"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onPress={() => router.push('/(protected)/announcements/new' as any)}
        style={({ pressed }) => ({
          position: 'absolute',
          bottom: 96,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: palette.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          ...elevation.card,
        })}
      >
        <Ionicons name="add" size={28} color={palette.onPrimary} />
      </Pressable>
    </ScreenContainer>
  );
}
