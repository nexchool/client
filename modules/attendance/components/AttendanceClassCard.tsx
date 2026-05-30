import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { Button } from '@/common/components/Button';
import { PressScale } from '@/common/components/PressScale';

type State = 'pending' | 'marked' | 'partial';

type Props = {
  state: State;
  subject: string;
  classLabel: string;
  timeLabel?: string;
  onPress: () => void;
  onPrimaryAction: () => void;
};

const STATE_LABEL: Record<State, string> = {
  pending: 'PENDING',
  marked: 'MARKED',
  partial: 'PARTIAL',
};

export function AttendanceClassCard({
  state,
  subject,
  classLabel,
  timeLabel,
  onPress,
  onPrimaryAction,
}: Props) {
  const { t } = useTranslation('attendance');
  const { palette, spacing, radius, elevation } = useTheme();
  const accentColor =
    state === 'pending' ? palette.primary :
    state === 'marked' ? palette.success :
    palette.warning;
  const pillBg =
    state === 'pending' ? palette.primaryContainer :
    state === 'marked' ? `${palette.success}22` :
    `${palette.warning}22`;
  const pillColor: 'onPrimaryContainer' | 'success' | 'warning' =
    state === 'pending' ? 'onPrimaryContainer' :
    state === 'marked' ? 'success' :
    'warning';

  return (
    <PressScale
      onPress={onPress}
      style={[
        styles.card,
        elevation.card,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
        },
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.sm,
        }}
      >
        <View style={{ backgroundColor: pillBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm }}>
          <Text variant="labelSm" color={pillColor} style={styles.pill}>
            {STATE_LABEL[state]}
          </Text>
        </View>
        {timeLabel ? (
          <Text variant="labelMd" color="onSurfaceVariant">{timeLabel}</Text>
        ) : null}
      </View>
      <Text variant="headlineMd" color="onSurface" style={{ marginBottom: 2 }} numberOfLines={1}>
        {subject}
      </Text>
      <Text variant="bodyMd" color="onSurfaceVariant" numberOfLines={1}>
        {classLabel}
      </Text>
      <View style={{ marginTop: spacing.md, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Button
          variant={state === 'marked' ? 'secondary' : 'primary'}
          size="sm"
          onPress={onPrimaryAction}
        >
          {state === 'marked'
            ? t('class.view', { defaultValue: 'View' })
            : t('class.mark', { defaultValue: 'Mark' })}
        </Button>
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {},
  pill: { textTransform: 'uppercase', letterSpacing: 1 },
});
