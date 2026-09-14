import React from 'react';
import { View } from 'react-native';
import { useTheme, type Palette } from '@/common/theme';
import { Text } from '@/common/components/Text';

export type StatTile = {
  label: string;
  value: string;
  /** Palette token for the number. Defaults to `onSurface`. */
  tone?: keyof Palette;
};

type Props = {
  tiles: StatTile[];
};

/**
 * A row of equal-width count tiles — "12 approved · 3 pending · 1 rejected".
 *
 * Extracted from the class detail screen, which built the same thing inline.
 * Two copies of a shape this simple is how a product ends up with tiles that
 * are almost the same size on two screens.
 */
export function StatTiles({ tiles }: Props) {
  const { palette, spacing, radius } = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      {tiles.map((tile) => (
        <View
          key={tile.label}
          style={{
            flex: 1,
            alignItems: 'center',
            backgroundColor: palette.surfaceContainerLow,
            padding: spacing.md,
            borderRadius: radius.md,
            gap: spacing.xs,
          }}
        >
          <Text variant="headlineMd" color={tile.tone ?? 'onSurface'}>
            {tile.value}
          </Text>
          <Text variant="labelSm" color="onSurfaceVariant">
            {tile.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
