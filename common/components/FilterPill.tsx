import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';

/**
 * One applied filter, with the means to drop it.
 *
 * A list screen that quietly filters itself is a list screen people mistrust —
 * "where did that student go?" is answered by seeing the filter that removed
 * them, next to the cross that puts them back. Mirrors admin-web's FilterPill.
 */
export function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  const { palette, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingLeft: spacing.md,
        paddingRight: spacing.xs,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        backgroundColor: palette.primaryContainer,
      }}
    >
      <Text variant="labelMd" color="onPrimaryContainer">
        {label}
      </Text>
      <Pressable
        onPress={onRemove}
        // The pill is the size the text makes it; hitSlop is what keeps the
        // cross at a thumb's target rather than the 16pt glyph it looks like.
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={`Remove filter ${label}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <AppIcon name="close-circle" size="md" color="onPrimaryContainer" />
      </Pressable>
    </View>
  );
}
