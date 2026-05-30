import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Button } from '@/common/components/Button';
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.lg,
            paddingBottom: spacing.xl,
          },
        ]}
      >
        <View
          style={[styles.grabber, { backgroundColor: palette.outlineVariant }]}
        />

        <View
          style={[
            styles.titleRow,
            { marginTop: spacing.md, gap: spacing.sm },
          ]}
        >
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

        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
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

        <View style={{ marginTop: spacing.lg }}>
          <Button variant="ghost" fullWidth onPress={onClose}>
            {t('close', { defaultValue: 'Close' })}
          </Button>
        </View>
      </View>
    </Modal>
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11, 28, 48, 0.40)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
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
