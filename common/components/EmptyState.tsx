import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Button } from '@/common/components/Button';

type Props = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ icon, title, description, action }: Props) {
  const { palette, spacing, typography } = useTheme();
  return (
    <View style={[styles.root, { padding: spacing.xl, gap: spacing.md }]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: palette.surfaceContainer },
        ]}
      >
        {icon}
      </View>
      <Text style={[typography.headlineMd, styles.center, { color: palette.onSurface }]}>
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            typography.bodyMd,
            styles.center,
            { color: palette.onSurfaceVariant },
          ]}
          numberOfLines={2}
        >
          {description}
        </Text>
      ) : null}
      {action ? (
        <View style={{ marginTop: spacing.sm }}>
          <Button variant="secondary" size="md" onPress={action.onPress}>
            {action.label}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
});
