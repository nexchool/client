import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { PressScale } from '@/common/components/PressScale';

export interface TabItem {
  key: string;
  label: string;
}

interface Props {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

/** Underlined segmented tab bar shared by detail screens. */
export function DetailTabs({ tabs, active, onChange }: Props) {
  const { palette, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: palette.surfaceContainerHighest,
        marginBottom: spacing.lg,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <PressScale
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: isActive ? palette.primary : 'transparent',
            }}
          >
            <Text variant="labelMd" color={isActive ? 'primary' : 'onSurfaceVariant'}>
              {tab.label}
            </Text>
          </PressScale>
        );
      })}
    </View>
  );
}
