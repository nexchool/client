import React from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Input } from '@/common/components/Input';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';

type Props<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label: string;
  placeholder?: string;
  helper?: string;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: TextInputProps['autoComplete'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  disabled?: boolean;
  rules?: object;
};

export function FormField<TForm extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  helper,
  keyboardType,
  autoComplete,
  autoCapitalize,
  secureTextEntry,
  disabled,
  rules,
}: Props<TForm>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <Input
          label={label}
          value={(value as string) ?? ''}
          onChangeText={onChange}
          placeholder={placeholder}
          helper={helper}
          error={error?.message}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          disabled={disabled}
        />
      )}
    />
  );
}
