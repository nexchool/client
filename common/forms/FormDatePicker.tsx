import React from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { DatePicker } from '@/common/components/datepicker';

/**
 * react-hook-form adapter around the shared DatePicker. Kept as the form-layer
 * API (control + name) so existing form screens don't change; all picker UI
 * lives in common/components/datepicker.
 */
type Props<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label: string;
  helper?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
};

export function FormDatePicker<TForm extends FieldValues>({
  control,
  name,
  label,
  helper,
  minDate,
  maxDate,
  disabled,
}: Props<TForm>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <DatePicker
          label={label}
          value={(value as string) ?? null}
          onChange={onChange}
          minimumDate={minDate}
          maximumDate={maxDate}
          error={error?.message}
          helper={helper}
          disabled={disabled}
        />
      )}
    />
  );
}
