// client/modules/search/components/SearchGroupSection.tsx
import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { PressScale } from '@/common/components/PressScale';

type Props = {
  title: string;
  count: number;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  children: ReactNode;
};

export function SearchGroupSection({ title, count, showSeeAll, onSeeAll, children }: Props) {
  const { spacing } = useTheme();
  if (count === 0) return null;
  return (
    <View style={{ marginTop: spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
        <Text variant="overline" color="onSurfaceVariant">
          {title} ({count})
        </Text>
        {showSeeAll && onSeeAll ? (
          <PressScale onPress={onSeeAll} hitSlop={8}>
            <Text variant="labelSm" color="primary">
              See all
            </Text>
          </PressScale>
        ) : null}
      </View>
      {children}
    </View>
  );
}
