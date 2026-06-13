// client/modules/notifications/components/NotificationFilterChips.tsx
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { FilterChips } from '@/common/components/FilterChips';
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
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.xs }}>
      <FilterChips
        options={STATUSES.map((s) => ({
          value: s,
          label: t(`status.${s}`, { defaultValue: s === 'all' ? 'All' : 'Unread' }),
        }))}
        value={status}
        onChange={onStatusChange}
      />
      <FilterChips
        options={CATEGORIES.map((c) => ({
          value: c,
          label: t(`category.${c}`, {
            defaultValue:
              c === 'all' ? 'All'
              : c === 'announcements' ? 'Announcements'
              : c === 'fees' ? 'Fees'
              : c === 'leaves' ? 'Leaves'
              : 'System',
          }),
        }))}
        value={category}
        onChange={onCategoryChange}
      />
    </View>
  );
}
