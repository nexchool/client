// client/modules/notifications/components/NotificationFilterChips.tsx
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import type { NotificationCategory } from '../utils/notificationGrouping';

export type StatusFilter = 'all' | 'unread';

type Props = {
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  category: NotificationCategory;
  onCategoryChange: (c: NotificationCategory) => void;
};

const STATUSES: StatusFilter[] = ['all', 'unread'];
const CATEGORIES: NotificationCategory[] = ['all', 'announcements', 'fees', 'leaves', 'system'];

export function NotificationFilterChips({ status, onStatusChange, category, onCategoryChange }: Props) {
  const { t } = useTranslation('notifications');
  const { palette, spacing, radius } = useTheme();

  const chip = (active: boolean, label: string, onPress: () => void, key: string) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        backgroundColor: active ? palette.primaryContainer : palette.surfaceContainer,
        opacity: pressed ? 0.85 : 1,
        minHeight: 40,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text variant="labelMd" color={active ? 'onPrimaryContainer' : 'onSurfaceVariant'}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {STATUSES.map((s) =>
          chip(
            status === s,
            t(`status.${s}`, { defaultValue: s === 'all' ? 'All' : 'Unread' }),
            () => onStatusChange(s),
            `status-${s}`,
          ),
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {CATEGORIES.map((c) =>
          chip(
            category === c,
            t(`category.${c}`, {
              defaultValue:
                c === 'all' ? 'All'
                : c === 'announcements' ? 'Announcements'
                : c === 'fees' ? 'Fees'
                : c === 'leaves' ? 'Leaves'
                : 'System',
            }),
            () => onCategoryChange(c),
            `cat-${c}`,
          ),
        )}
      </ScrollView>
    </View>
  );
}
