import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { PressScale } from '@/common/components/PressScale';
import type { Announcement } from '../types';
import { STATUS_LABEL, statusAccent } from '../constants';

type Props = {
  announcement: Announcement;
  onPress: (a: Announcement) => void;
};

export function AnnouncementRow({ announcement: a, onPress }: Props) {
  const { palette, spacing, radius, elevation } = useTheme();
  const accent = statusAccent(a.status);
  const firstLine = (a.body_markdown || '').split('\n').find((l) => l.trim()) || '';

  return (
    <PressScale
      onPress={() => onPress(a)}
      style={[
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        elevation.card,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="headlineMd" color="onSurface" style={{ flex: 1 }} numberOfLines={1}>
          {a.title}
        </Text>
        <View
          style={{
            backgroundColor: palette.surfaceContainer,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: radius.full,
            marginLeft: spacing.sm,
          }}
        >
          <Text variant="labelSm" color={accent}>
            {STATUS_LABEL[a.status] ?? a.status}
          </Text>
        </View>
      </View>
      <Text variant="bodyMd" color="onSurfaceVariant" numberOfLines={2}>
        {firstLine}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="labelSm" color="onSurfaceVariant">
          {a.author_name ?? 'Admin'}
          {a.revision_count > 1 ? ' · Edited' : ''}
        </Text>
        <Text variant="labelSm" color="onSurfaceVariant">
          {a.published_at ? new Date(a.published_at).toLocaleDateString() : a.created_at?.slice(0, 10)}
        </Text>
      </View>
    </PressScale>
  );
}
