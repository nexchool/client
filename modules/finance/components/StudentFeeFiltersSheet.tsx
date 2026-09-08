import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Button } from '@/common/components/Button';
import { BottomSheet } from '@/common/components/sheet';
import { useModalBodyHeight } from '@/common/hooks/useModalBodyHeight';

/** '' is "any status" — it is also what the API wants for "don't filter". */
export const FEE_STATUS_VALUES = ['', 'overdue', 'unpaid', 'partial', 'paid'] as const;

export type StudentFeeFilters = {
  /** null = every class. */
  classId: string | null;
  /** '' = every status. */
  status: string;
};

export const EMPTY_STUDENT_FEE_FILTERS: StudentFeeFilters = { classId: null, status: '' };

export function countActiveStudentFeeFilters(filters: StudentFeeFilters): number {
  return (filters.classId ? 1 : 0) + (filters.status ? 1 : 0);
}

export type ClassFilterOption = { id: string; label: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  filters: StudentFeeFilters;
  onChange: (next: StudentFeeFilters) => void;
  classes: ClassFilterOption[];
};

/** Above this many classes the list needs its own search to stay usable. */
const SEARCH_THRESHOLD = 8;
const ROW_H = 48;

/**
 * The student-fee list's filter panel.
 *
 * A sheet rather than the three stacked chip rails it replaces: those were
 * pinned above the list and took roughly two-fifths of the screen before the
 * first row, on a screen whose entire job is rows. What is applied is shown
 * back on the list as pills, so nothing filters silently.
 *
 * Two departures from the students sheet it is otherwise modelled on:
 *
 * It edits a **draft** and commits on "Show results", where that one applies
 * on tap and closes. With two dimensions, closing on the first tap would make
 * the second one unreachable, and applying live refetches the list under a
 * sheet that is covering it.
 *
 * And the class list is rendered here rather than delegated to `SelectSheet`,
 * even though that component exists and does this well. `SelectSheet` opens
 * its own `Modal`, and a `Modal` inside a `Modal` is the arrangement that
 * already cost this app an Android touch-swallowing bug. One sheet, one
 * modal.
 */
export function StudentFeeFiltersSheet({
  visible,
  onClose,
  filters,
  onChange,
  classes,
}: Props) {
  const { t } = useTranslation('finance');
  const { palette, spacing, radius, typography } = useTheme();
  const bodyHeight = useModalBodyHeight(280);
  const [draft, setDraft] = useState<StudentFeeFilters>(filters);
  const [query, setQuery] = useState('');

  // Re-seed whenever the sheet opens, so a dismissed sheet's abandoned edits
  // don't reappear the next time it is opened.
  useEffect(() => {
    if (visible) {
      setDraft(filters);
      setQuery('');
    }
  }, [visible, filters]);

  const showSearch = classes.length > SEARCH_THRESHOLD;
  const filteredClasses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => c.label.toLowerCase().includes(q));
  }, [classes, query]);

  const apply = (next: StudentFeeFilters) => {
    onChange(next);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text variant="headlineMd" color="onSurface" style={{ flex: 1 }}>
          {t('filters.title', { defaultValue: 'Filters' })}
        </Text>
        {countActiveStudentFeeFilters(draft) > 0 ? (
          <Pressable
            onPress={() => setDraft(EMPTY_STUDENT_FEE_FILTERS)}
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

      {/* Status — a five-word vocabulary, so it fits as chips and stays one tap
          away rather than hiding behind another list. */}
      <Text variant="labelSm" color="onSurfaceVariant" style={{ opacity: 0.8 }}>
        {t('filters.statusLabel', { defaultValue: 'Status' })}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {FEE_STATUS_VALUES.map((value) => {
          const selected = draft.status === value;
          return (
            <Pressable
              key={value || '__any__'}
              onPress={() => setDraft({ ...draft, status: value })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => ({
                minHeight: 44,
                justifyContent: 'center',
                paddingHorizontal: spacing.md,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: selected ? palette.primary : palette.outlineVariant,
                backgroundColor: selected
                  ? palette.primary
                  : pressed
                    ? palette.surfaceContainerHigh
                    : 'transparent',
              })}
            >
              <Text variant="labelLg" color={selected ? 'onPrimary' : 'onSurface'}>
                {t(`feeFilters.${value || 'all'}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="labelSm" color="onSurfaceVariant" style={{ opacity: 0.8 }}>
        {t('filters.classLabel', { defaultValue: 'Class' })}
      </Text>

      {showSearch ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: palette.surfaceContainerHigh,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
            height: 44,
          }}
        >
          <AppIcon name="search-outline" size="md" color="onSurfaceVariant" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('filters.classSearchPlaceholder', { defaultValue: 'Search classes…' })}
            placeholderTextColor={palette.onSurfaceVariant}
            style={[typography.bodyMd, { flex: 1, color: palette.onSurface, paddingVertical: 0 }]}
          />
        </View>
      ) : null}

      <FlatList
        data={filteredClasses}
        keyExtractor={(c) => c.id}
        style={{ maxHeight: bodyHeight }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <ClassRow
            label={t('filters.classAny', { defaultValue: 'All classes' })}
            selected={draft.classId === null}
            onPress={() => setDraft({ ...draft, classId: null })}
          />
        }
        ListEmptyComponent={
          query ? (
            <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
              <Text variant="bodyMd" color="onSurfaceVariant">
                {t('filters.noClassMatches', { defaultValue: 'No matching classes.' })}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ClassRow
            label={item.label}
            selected={draft.classId === item.id}
            onPress={() => setDraft({ ...draft, classId: item.id })}
          />
        )}
      />

      <Button fullWidth onPress={() => apply(draft)}>
        {t('filters.apply', { defaultValue: 'Show results' })}
      </Button>
    </BottomSheet>
  );
}

function ClassRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: ROW_H,
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
        numberOfLines={1}
      >
        {label}
      </Text>
      {selected ? <AppIcon name="checkmark" size="md" color="onPrimaryContainer" /> : null}
    </Pressable>
  );
}
