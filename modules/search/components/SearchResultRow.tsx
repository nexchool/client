// client/modules/search/components/SearchResultRow.tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  primary: string;
  secondary?: string | null;
  onPress: () => void;
};

export function SearchResultRow({ icon, primary, secondary, onPress }: Props) {
  const { palette, spacing, radius, typography } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.full,
          backgroundColor: palette.surfaceContainerHigh ?? palette.surfaceContainer,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={palette.onSurfaceVariant} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyMd, { color: palette.onSurface }]} numberOfLines={1}>
          {primary}
        </Text>
        {secondary ? (
          <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]} numberOfLines={1}>
            {secondary}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.onSurfaceVariant} />
    </Pressable>
  );
}
