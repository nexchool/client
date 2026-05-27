import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Button } from '@/common/components/Button';
import type { WeeklyPeriod } from '../types';

type Props = {
  period: WeeklyPeriod | null;
  visible: boolean;
  onClose: () => void;
};

export function PeriodDetailSheet({ period, visible, onClose }: Props) {
  const { t } = useTranslation('timetable');
  const { palette, spacing, radius, typography } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: 'rgba(11, 28, 48, 0.40)' }]}
        onPress={onClose}
      />
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
          style={{
            alignSelf: 'center',
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: palette.outlineVariant,
          }}
        />
        <Text
          style={[typography.headlineMd, { color: palette.onSurface, marginTop: spacing.md }]}
        >
          {period?.subject?.name ?? '—'}
        </Text>
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <Row
            icon="time-outline"
            label={`${period?.start_time} - ${period?.end_time}`}
            palette={palette}
            typography={typography}
          />
          {period?.class_section?.name ? (
            <Row icon="school-outline" label={period.class_section.name} palette={palette} typography={typography} />
          ) : null}
          {period?.teacher?.name ? (
            <Row icon="person-outline" label={period.teacher.name} palette={palette} typography={typography} />
          ) : null}
          {period?.room ? (
            <Row icon="location-outline" label={period.room} palette={palette} typography={typography} />
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

function Row({
  icon,
  label,
  palette,
  typography,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  palette: any;
  typography: any;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={18} color={palette.onSurfaceVariant} />
      <Text
        style={[typography.bodyMd, { color: palette.onSurfaceVariant, flex: 1 }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
