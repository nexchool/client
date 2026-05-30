import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { ProfileAvatar } from '@/common/components/ProfileAvatar';

type Props = {
  name: string;
  rollNumber?: number | string;
  rightSlot?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function StudentRosterRow({ name, rollNumber, rightSlot, onPress, onLongPress }: Props) {
  const { palette, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? palette.surfaceContainerLow : 'transparent',
          padding: spacing.md,
          gap: spacing.md,
        },
      ]}
    >
      <ProfileAvatar size={40} name={name} />
      <View style={{ flex: 1 }}>
        <Text variant="labelMd" color="onSurface" numberOfLines={1}>
          {name}
        </Text>
        {rollNumber != null ? (
          <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: 2 }}>
            #{rollNumber}
          </Text>
        ) : null}
      </View>
      {rightSlot}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
