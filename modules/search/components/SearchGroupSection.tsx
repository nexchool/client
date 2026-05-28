// client/modules/search/components/SearchGroupSection.tsx
import React, { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/common/theme';

type Props = {
  title: string;
  count: number;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  children: ReactNode;
};

export function SearchGroupSection({ title, count, showSeeAll, onSeeAll, children }: Props) {
  const { palette, spacing, typography } = useTheme();
  if (count === 0) return null;
  return (
    <View style={{ marginTop: spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
        <Text style={[typography.labelMd, { color: palette.onSurfaceVariant }]}>
          {title} ({count})
        </Text>
        {showSeeAll && onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={[typography.labelSm, { color: palette.primary }]}>See all</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
