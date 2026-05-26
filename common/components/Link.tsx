import React, { type ReactNode } from 'react';
import { Pressable, Text, type TextStyle } from 'react-native';
import { useTheme } from '@/common/theme';

type Props = {
  children: ReactNode;
  onPress: () => void;
  style?: TextStyle;
};

export function Link({ children, onPress, style }: Props) {
  const { palette, typography } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      {({ pressed }) => (
        <Text
          style={[
            typography.labelMd,
            {
              color: palette.primary,
              textDecorationLine: pressed ? 'underline' : 'none',
              includeFontPadding: false,
            },
            style,
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
