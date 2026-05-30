import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';

type Props = {
  present: number;
  absent: number;
  late: number;
  unmarked: number;
};

export function AttendanceStatsBanner({ present, absent, late, unmarked }: Props) {
  const { palette, spacing, radius } = useTheme();
  const { t } = useTranslation('attendance');
  const total = present + absent + late + unmarked;

  const items: { label: string; value: number; color: keyof typeof palette }[] = [
    { label: t('mark.total'), value: total, color: 'onSurface' },
    { label: t('mark.present'), value: present, color: 'primary' },
    { label: t('mark.absent'), value: absent, color: 'error' },
  ];

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: palette.outlineVariant,
        },
      ]}
    >
      {items.map((it, idx) => (
        <React.Fragment key={it.label}>
          {idx > 0 ? (
            <View style={[styles.divider, { backgroundColor: palette.outlineVariant }]} />
          ) : null}
          <View style={styles.cell}>
            <Text variant="labelSm" color="onSurfaceVariant" style={styles.label}>
              {it.label}
            </Text>
            <Text variant="headlineMd" color={it.color}>
              {it.value}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center' },
  cell: { flex: 1, alignItems: 'center' },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: 2 },
  label: { marginBottom: 2 },
});
