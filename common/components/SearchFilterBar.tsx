import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { FilterPill } from '@/common/components/FilterPill';

export type AppliedFilter = {
  /** Stable key for the list — the filter's field name, not its value. */
  key: string;
  label: string;
  onRemove: () => void;
};

export type SearchFilterBarProps = {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  /**
   * Opens the screen's filter sheet. Omit it on a screen with nothing to
   * filter — the button and the applied-pill row then do not render at all,
   * and the same component gives you a search-only bar.
   */
  onOpenFilters?: () => void;
  /** Drives the button's tint and its count badge. */
  activeFilterCount?: number;
  /** What is currently applied, and how to drop each one. */
  pills?: AppliedFilter[];
  onClearAll?: () => void;
  /** Translated by the caller — this lives in `common/` and has no namespace. */
  clearAllLabel?: string;
  filtersLabel?: string;
  clearSearchLabel?: string;
};

/**
 * The search-and-filter toolbar every list screen gets its from.
 *
 * The anatomy was settled on the students list and then stayed there, inline,
 * so every screen written afterwards either copied ninety lines of JSX or
 * invented its own — which is how the finance module ended up with three
 * stacked chip rails where a sheet belonged.
 *
 * **The font fix can only live here.** `eslint.config.js` forbids the
 * `fontFamily` property in `modules/**` and `app/**`, because font choice
 * belongs to the typography scale and a screen setting its own is how the
 * scale stops meaning anything. `<Text>` carries a variant and so is covered;
 * a raw `<TextInput>` has no variant to inherit from and cannot name Inter
 * itself, so every screen that hand-rolled a search box has been rendering
 * its search text in the system font next to Inter everywhere else. Spreading
 * `typography.bodyMd` below is what closes that, and `common/**` is exempt
 * from the rule precisely so a shared primitive can do this.
 */
export function SearchFilterBar({
  value,
  onChangeText,
  placeholder,
  onOpenFilters,
  activeFilterCount = 0,
  pills = [],
  onClearAll,
  clearAllLabel = 'Clear all',
  filtersLabel = 'Filters',
  clearSearchLabel = 'Clear search',
}: SearchFilterBarProps) {
  const { palette, spacing, radius, typography } = useTheme();
  const hasFilters = !!onOpenFilters;
  const isFiltered = hasFilters && activeFilterCount > 0;

  return (
    <View style={{ gap: spacing[12] }}>
      <View style={[styles.row, { gap: spacing.sm }]}>
        <View
          style={[
            styles.box,
            {
              borderRadius: radius.DEFAULT,
              borderColor: palette.outlineVariant,
              backgroundColor: palette.surfaceContainerLowest,
              paddingHorizontal: spacing[12],
              paddingVertical: spacing.sm,
              gap: spacing.sm,
            },
          ]}
        >
          <AppIcon name="search" size="md" color="outline" />
          <TextInput
            style={[typography.bodyMd, styles.input, { color: palette.onSurface }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={palette.onSurfaceVariant}
            returnKeyType="search"
          />
          {value.length > 0 ? (
            <AppIcon
              name="close-circle"
              size="md"
              color="onSurfaceVariant"
              onPress={() => onChangeText('')}
              accessibilityLabel={clearSearchLabel}
            />
          ) : null}
        </View>

        {hasFilters ? (
          <Pressable
            onPress={onOpenFilters}
            accessibilityRole="button"
            accessibilityLabel={
              isFiltered ? `${filtersLabel}, ${activeFilterCount} applied` : filtersLabel
            }
            style={({ pressed }) => [
              styles.button,
              {
                borderRadius: radius.DEFAULT,
                borderColor: isFiltered ? palette.primary : palette.outlineVariant,
                backgroundColor: isFiltered
                  ? palette.primaryContainer
                  : pressed
                    ? palette.surfaceContainerHigh
                    : palette.surfaceContainerLowest,
              },
            ]}
          >
            <AppIcon
              name="options-outline"
              size="md"
              color={isFiltered ? 'onPrimaryContainer' : 'onSurfaceVariant'}
            />
            {/*
              The tint alone says "something is filtering this list"; the badge
              says how much, which is what tells you whether clearing one pill
              will bring the rows back or there is another still on.
            */}
            {isFiltered ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: palette.primary, borderRadius: radius.full },
                ]}
              >
                <Text variant="labelSm" color="onPrimary">
                  {activeFilterCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>

      {/* What is applied, and how to drop it. Nothing renders when no filter is
          on, so the list does not carry an empty row. */}
      {isFiltered && pills.length > 0 ? (
        <View style={[styles.applied, { gap: spacing.sm }]}>
          {pills.map((pill) => (
            <FilterPill key={pill.key} label={pill.label} onRemove={pill.onRemove} />
          ))}
          {onClearAll ? (
            <Pressable
              onPress={onClearAll}
              hitSlop={8}
              accessibilityRole="button"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text variant="labelMd" color="primary">
                {clearAllLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  box: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  input: { flex: 1, padding: 0 },
  button: { width: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applied: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
});
