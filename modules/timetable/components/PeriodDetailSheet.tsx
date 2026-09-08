import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Button } from '@/common/components/Button';
import { BottomSheet } from '@/common/components/sheet';
import type { AppIconProps } from '@/common/components/AppIcon';
import type { WeeklyPeriod } from '../types';

type Props = {
  period: WeeklyPeriod | null;
  visible: boolean;
  onClose: () => void;
};

function initialOf(name?: string | null): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export function PeriodDetailSheet({ period, visible, onClose }: Props) {
  const { t } = useTranslation('timetable');
  const { palette, spacing, radius } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
        <View style={[styles.titleRow, { gap: spacing.sm }]}>
          <View style={[styles.accent, { backgroundColor: palette.primary }]} />
          <Text variant="headlineMd" color="onSurface" style={{ flex: 1 }} numberOfLines={2}>
            {period?.subject?.name ?? '—'}
          </Text>
          {period?.room ? (
            <View
              style={[
                styles.pill,
                { backgroundColor: palette.secondaryContainer, borderRadius: radius.sm },
              ]}
            >
              <Text variant="labelSm" color="onSecondaryContainer">
                {period.room}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ gap: spacing.sm }}>
          <Row icon="time-outline" label={`${period?.start_time} - ${period?.end_time}`} />
          {period?.class?.name ? (
            <Row icon="school-outline" label={period.class.name} />
          ) : null}
          {period?.teacher?.name ? (
            <View style={styles.teacherRow}>
              <View style={[styles.avatar, { backgroundColor: palette.tertiaryContainer }]}>
                <Text variant="labelSm" color="onTertiaryContainer">
                  {initialOf(period.teacher.name)}
                </Text>
              </View>
              <Text variant="bodyMd" color="onSurfaceVariant" style={{ flex: 1 }} numberOfLines={1}>
                {period.teacher.name}
              </Text>
            </View>
          ) : null}
        </View>

        <Button variant="ghost" fullWidth onPress={onClose}>
          {t('close', { defaultValue: 'Close' })}
        </Button>
    </BottomSheet>
  );
}

function Row({ icon, label }: { icon: AppIconProps['name']; label: string }) {
  return (
    <View style={styles.metaRow}>
      <AppIcon name={icon} size="sm" color="onSurfaceVariant" />
      <Text variant="bodyMd" color="onSurfaceVariant" style={{ flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  accent: { width: 4, height: 28, borderRadius: 2 },
  pill: { paddingHorizontal: 8, paddingVertical: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
