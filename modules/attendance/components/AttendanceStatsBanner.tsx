import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/common/theme';

type Props = {
  present: number;
  absent: number;
  late: number;
  unmarked: number;
};

export function AttendanceStatsBanner({ present, absent, late, unmarked }: Props) {
  const { palette, spacing, radius, typography } = useTheme();
  const items = [
    { label: 'P', value: present, color: palette.success },
    { label: 'A', value: absent, color: palette.error },
    { label: 'L', value: late, color: palette.warning },
    { label: '–', value: unmarked, color: palette.outline },
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: palette.surfaceContainerHigh,
        borderRadius: radius.lg,
        padding: spacing.md,
        gap: spacing.md,
        justifyContent: 'space-around',
      }}
    >
      {items.map((it) => (
        <View key={it.label} style={{ alignItems: 'center' }}>
          <Text style={[typography.labelSm, { color: it.color, fontFamily: 'Inter_600SemiBold' }]}>
            {it.label}
          </Text>
          <Text style={[typography.headlineMd, { color: palette.onSurface, marginTop: 2 }]}>
            {it.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({});
