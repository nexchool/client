import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTheme } from '@/common/theme';

type Props<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label: string;
  placeholder?: string;
  helper?: string;
  numberOfLines?: number;
  maxLength?: number;
};

export function FormTextArea<TForm extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  helper,
  numberOfLines = 6,
  maxLength,
}: Props<TForm>) {
  const { palette, spacing, radius, typography } = useTheme();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <View style={{ width: '100%' }}>
          <Text
            style={[
              typography.labelMd,
              { color: palette.onSurfaceVariant, marginBottom: 6, includeFontPadding: false },
            ]}
          >
            {label}
          </Text>
          <TextInput
            value={(value as string) ?? ''}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={palette.outline}
            multiline
            numberOfLines={numberOfLines}
            maxLength={maxLength}
            style={{
              minHeight: numberOfLines * 22 + 16,
              borderWidth: 1,
              borderColor: error ? palette.error : palette.outlineVariant,
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.lg,
              padding: spacing.md,
              color: palette.onSurface,
              textAlignVertical: 'top',
            }}
          />
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
      )}
    />
  );
}
