import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';

type Props<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label: string;
  helper?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
};

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function FormDatePicker<TForm extends FieldValues>({
  control,
  name,
  label,
  helper,
  minDate,
  maxDate,
  disabled,
}: Props<TForm>) {
  const { palette, spacing, radius } = useTheme();
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const stringValue = (value as string) ?? '';
        const parsed = stringValue ? new Date(stringValue) : null;
        const dateValue = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;

        const handleChange = (_: DateTimePickerEvent, d?: Date) => {
          setShowAndroidPicker(false);
          if (d) onChange(toIso(d));
        };

        return (
          <View style={{ width: '100%' }}>
            <Text
              variant="labelMd"
              color="onSurfaceVariant"
              style={{ marginBottom: 6, includeFontPadding: false }}
            >
              {label}
            </Text>
            <Pressable
              disabled={disabled}
              onPress={() => Platform.OS === 'android' && setShowAndroidPicker(true)}
              style={[
                styles.field,
                {
                  borderColor: error ? palette.error : palette.outlineVariant,
                  backgroundColor: disabled
                    ? palette.surfaceContainer
                    : palette.surfaceContainerLowest,
                  borderRadius: radius.DEFAULT,
                  paddingHorizontal: spacing.md,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <Text variant="bodyMd" color={dateValue ? 'onSurface' : 'outline'}>
                {dateValue ? dateValue.toLocaleDateString() : 'Tap to pick date'}
              </Text>
              <AppIcon name="calendar-outline" size="md" color="onSurfaceVariant" />
            </Pressable>
            {Platform.OS === 'ios' && !disabled ? (
              <DateTimePicker
                value={dateValue ?? new Date()}
                mode="date"
                display="compact"
                onChange={handleChange}
                minimumDate={minDate}
                maximumDate={maxDate}
              />
            ) : null}
            {Platform.OS === 'android' && showAndroidPicker ? (
              <DateTimePicker
                value={dateValue ?? new Date()}
                mode="date"
                display="default"
                onChange={handleChange}
                minimumDate={minDate}
                maximumDate={maxDate}
              />
            ) : null}
            <Text
              variant="labelSm"
              color={error ? 'error' : 'onSurfaceVariant'}
              style={{ marginTop: 6, minHeight: 16 }}
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

const styles = StyleSheet.create({
  field: {
    height: 52,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
