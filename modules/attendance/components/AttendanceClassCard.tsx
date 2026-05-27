import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Button } from '@/common/components/Button';

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
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const accentColor =
    state === 'pending' ? palette.primary :
    state === 'marked' ? palette.success :
    palette.warning;
  const pillBg =
    state === 'pending' ? palette.primaryContainer :
    state === 'marked' ? `${palette.success}22` :
    `${palette.warning}22`;
  const pillFg =
    state === 'pending' ? palette.onPrimaryContainer :
    state === 'marked' ? palette.success :
    palette.warning;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        elevation.card,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
          opacity: pressed ? 0.95 : 1,
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
          <Text
            style={[
              typography.labelSm,
              { color: pillFg, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            {STATE_LABEL[state]}
          </Text>
        </View>
        {timeLabel ? (
          <Text style={[typography.labelMd, { color: palette.onSurfaceVariant }]}>{timeLabel}</Text>
        ) : null}
      </View>
      <Text
        style={[typography.headlineMd, { color: palette.onSurface, marginBottom: 2 }]}
        numberOfLines={1}
      >
        {subject}
      </Text>
      <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]} numberOfLines={1}>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({ card: {} });
