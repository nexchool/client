import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme, type Palette } from '@/common/theme';
import { Text } from '@/common/components/Text';

export type AttendanceStatus = 'present' | 'absent' | 'late' | null;

type Opt = {
  value: Exclude<AttendanceStatus, null>;
  label: 'P' | 'A' | 'L';
  activeBg: keyof Palette;
  activeFg: keyof Palette;
};

const OPTS: Opt[] = [
  { value: 'present', label: 'P', activeBg: 'tertiaryContainer', activeFg: 'onTertiaryContainer' },
  { value: 'absent', label: 'A', activeBg: 'errorContainer', activeFg: 'onErrorContainer' },
  { value: 'late', label: 'L', activeBg: 'secondaryContainer', activeFg: 'onSecondaryContainer' },
];

type Props = {
  value: AttendanceStatus;
  onChange: (next: AttendanceStatus) => void;
};

export function AttendanceStatusSegmented({ value, onChange }: Props) {
  const { palette, radius } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.surfaceContainerLow, borderRadius: radius.full, padding: 2 },
      ]}
    >
      {OPTS.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(active ? null : opt.value)}
            style={{
              backgroundColor: active ? palette[opt.activeBg] : 'transparent',
              borderRadius: radius.full,
              paddingVertical: 6,
              paddingHorizontal: 14,
            }}
            hitSlop={4}
          >
            <Text variant="labelMd" color={active ? opt.activeFg : 'onSurfaceVariant'}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
