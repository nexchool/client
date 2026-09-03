import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Button } from '@/common/components/Button';
import { BottomSheet } from '@/common/components/sheet';
import { useModalBodyHeight } from '@/common/hooks/useModalBodyHeight';
import {
  STUDENT_STATUS_VALUES,
  studentStatusKey,
} from '../constants/studentStatus';

export type StudentFilters = {
  /** null = no status filter; the server then returns every status. */
  status: string | null;
};

export const EMPTY_STUDENT_FILTERS: StudentFilters = { status: null };

export function countActiveStudentFilters(filters: StudentFilters): number {
  return filters.status ? 1 : 0;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  filters: StudentFilters;
  onChange: (next: StudentFilters) => void;
};

/**
 * The students list's filter panel.
 *
 * A sheet rather than a chip rail because the rail could only ever show what
 * fits: eight statuses ran off the side of the screen, so the three that fitted
 * became the only three anyone could pick. A sheet has room for the whole
 * vocabulary, and what is actually applied is shown back on the list as pills.
 */
export function StudentFiltersSheet({ visible, onClose, filters, onChange }: Props) {
  const { t } = useTranslation('students');
  const { palette, spacing, radius } = useTheme();
  const bodyHeight = useModalBodyHeight(360);

  const select = (status: string | null) => {
    onChange({ ...filters, status });
    onClose();
  };

  const rows: { value: string | null; label: string }[] = [
    { value: null, label: t('filters.statusAny', { defaultValue: 'Any status' }) },
    ...STUDENT_STATUS_VALUES.map((value) => ({
      value: value as string,
      label: t(studentStatusKey(value), { defaultValue: value }),
    })),
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text variant="headlineMd" color="onSurface" style={{ flex: 1 }}>
          {t('filters.title', { defaultValue: 'Filters' })}
        </Text>
        {countActiveStudentFilters(filters) > 0 ? (
          <Pressable
            onPress={() => {
              onChange(EMPTY_STUDENT_FILTERS);
              onClose();
            }}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text variant="labelLg" color="primary">
              {t('filters.clearAll', { defaultValue: 'Clear all' })}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text variant="labelSm" color="onSurfaceVariant" style={{ opacity: 0.8 }}>
        {t('filters.statusLabel', { defaultValue: 'Status' })}
      </Text>

      <ScrollView style={{ maxHeight: bodyHeight }} contentContainerStyle={{ gap: 2 }}>
        {rows.map((row) => {
          const selected = row.value === filters.status;
          return (
            <Pressable
              key={row.value ?? '__any__'}
              onPress={() => select(row.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => ({
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: radius.lg,
                backgroundColor: selected
                  ? palette.primaryContainer
                  : pressed
                    ? palette.surfaceContainerHigh
                    : 'transparent',
              })}
            >
              <Text
                variant="bodyLg"
                color={selected ? 'onPrimaryContainer' : 'onSurface'}
                style={{ flex: 1 }}
              >
                {row.label}
              </Text>
              {selected ? (
                <AppIcon name="checkmark" size="md" color="onPrimaryContainer" />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <Button variant="ghost" fullWidth onPress={onClose}>
        {t('cancel', { defaultValue: 'Cancel' })}
      </Button>
    </BottomSheet>
  );
}
