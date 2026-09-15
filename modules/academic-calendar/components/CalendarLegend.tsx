import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { ENTRY_ACCENTS, type CalendarEntryKind } from '../types';

const SHOWN: CalendarEntryKind[] = ['holiday', 'vacation', 'weeklyOff', 'exam', 'event'];

/** The key to the grid's dots. Colour on its own is not a label. */
export function CalendarLegend() {
  const { t } = useTranslation('academicCalendar');
  const { palette, spacing } = useTheme();

  return (
    <View
      style={[
        styles.root,
        { gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
      ]}
    >
      {SHOWN.map((kind) => (
        <View key={kind} style={styles.item}>
          <View
            style={[styles.dot, { backgroundColor: palette[ENTRY_ACCENTS[kind]] }]}
          />
          <Text variant="labelSm" color="onSurfaceVariant">
            {t(`legend.${kind}`)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', flexWrap: 'wrap' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
