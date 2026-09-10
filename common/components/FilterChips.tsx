import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';

/**
 * The one filter-chip row for every list screen. Fixes the audit findings:
 * a single selected treatment (primary bg + onPrimary text), horizontal
 * scroll so chips never wrap mid-screen. 40px touch targets — same as
 * `Button`'s own `sm` size — so a compact row of these reads at the same
 * scale as the rest of the app's controls rather than standing out oversized.
 */

export type FilterChipOption<T extends string = string> = {
  value: T;
  label: string;
  /** Optional count badge, e.g. pending requests. */
  count?: number;
};

export type FilterChipsProps<T extends string = string> = {
  options: readonly FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function FilterChips<T extends string = string>({
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  const { palette, spacing, radius } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            hitSlop={4}
            style={({ pressed }) => ({
              minHeight: 40,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.sm,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: active ? palette.primary : palette.outlineVariant,
              backgroundColor: active
                ? palette.primary
                : pressed
                  ? palette.surfaceContainerHigh
                  : 'transparent',
            })}
          >
            <Text
              variant="labelMd"
              color={active ? 'onPrimary' : 'onSurface'}
              style={{ fontFamily: 'Inter_600SemiBold' }}
            >
              {opt.label}
            </Text>
            {opt.count != null && opt.count > 0 ? (
              <View
                style={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: radius.full,
                  paddingHorizontal: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? palette.onPrimary : palette.primaryContainer,
                }}
              >
                <Text variant="labelSm" color={active ? 'primary' : 'onPrimaryContainer'}>
                  {opt.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
