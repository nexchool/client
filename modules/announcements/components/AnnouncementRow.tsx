import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/common/theme';
import type { Announcement } from '../types';
import { STATUS_LABEL } from '../constants';

type Props = {
  announcement: Announcement;
  onPress: (a: Announcement) => void;
};

export function AnnouncementRow({ announcement: a, onPress }: Props) {
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const statusBg =
    a.status === 'published' ? `${palette.primary}22`
    : a.status === 'scheduled' ? `${palette.warning}22`
    : a.status === 'recalled' ? `${palette.error}22`
    : `${palette.outlineVariant}66`;
  const statusFg =
    a.status === 'published' ? palette.primary
    : a.status === 'scheduled' ? palette.warning
    : a.status === 'recalled' ? palette.error
    : palette.onSurfaceVariant;

  const firstLine = (a.body_markdown || '').split('\n').find((l) => l.trim()) || '';

  return (
    <Pressable
      onPress={() => onPress(a)}
      style={({ pressed }) => ({
        backgroundColor: palette.surfaceContainerLowest,
        borderRadius: radius.xl,
        padding: spacing.lg,
        gap: spacing.sm,
        opacity: pressed ? 0.9 : 1,
        ...elevation.card,
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[typography.headlineMd, { color: palette.onSurface, flex: 1 }]} numberOfLines={1}>
          {a.title}
        </Text>
        <View
          style={{
            backgroundColor: statusBg,
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: radius.full,
            marginLeft: spacing.sm,
          }}
        >
          <Text style={[typography.labelSm, { color: statusFg }]}>
            {STATUS_LABEL[a.status] ?? a.status}
          </Text>
        </View>
      </View>
      <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]} numberOfLines={2}>
        {firstLine}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
          {a.author_name ?? 'Admin'}
          {a.revision_count > 1 ? ' · Edited' : ''}
        </Text>
        <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
          {a.published_at ? new Date(a.published_at).toLocaleDateString() : a.created_at?.slice(0, 10)}
        </Text>
      </View>
    </Pressable>
  );
}
