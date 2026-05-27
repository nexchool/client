import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTheme } from '@/common/theme';

export type SelectOption = { value: string; label: string };

type Props<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label: string;
  options: SelectOption[];
  helper?: string;
  multi?: boolean;
};

export function FormSelect<TForm extends FieldValues>({
  control,
  name,
  label,
  options,
  helper,
  multi = false,
}: Props<TForm>) {
  const { palette, spacing, radius, typography } = useTheme();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const selectedSet = new Set<string>(
          multi ? ((value as string[]) ?? []) : value ? [value as string] : []
        );
        const toggle = (v: string) => {
          if (multi) {
            const next = new Set(selectedSet);
            if (next.has(v)) next.delete(v); else next.add(v);
            onChange(Array.from(next));
          } else {
            onChange(v);
          }
        };
        return (
          <View style={{ width: '100%' }}>
            <Text
              style={[
                typography.labelMd,
                { color: palette.onSurfaceVariant, marginBottom: 6, includeFontPadding: false },
              ]}
            >
              {label}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {options.map((opt) => {
                const active = selectedSet.has(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => toggle(opt.value)}
                    style={({ pressed }) => ({
                      backgroundColor: active
                        ? palette.tertiaryContainer
                        : palette.surfaceContainerLowest,
                      borderRadius: radius.full,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderWidth: active ? 0 : 1,
                      borderColor: palette.outlineVariant,
                      opacity: pressed ? 0.85 : 1,
                      minHeight: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <Text
                      style={[
                        typography.labelMd,
                        {
                          color: active ? palette.onTertiaryContainer : palette.onSurface,
                          fontFamily: active ? 'Inter_600SemiBold' : 'Inter_500Medium',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text
              style={[
                typography.labelSm,
                {
                  color: error ? palette.error : palette.onSurfaceVariant,
                  marginTop: 6,
                  minHeight: 16,
                },
              ]}
              numberOfLines={2}
            >
              {error?.message ?? helper ?? ' '}
            </Text>
          </View>
        );
      }}
    />
  );
}
