import React from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { SelectSheet, type SelectOption } from '@/common/components/SelectSheet';

type Props<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  helper?: string;
  /** Offer an "Any / All" row that clears the selection. */
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
};

/**
 * A form select for a list whose length the school decides.
 *
 * `FormSelect` lays every option out as a chip, which is right for gender or a
 * leave type and wrong for anything a school grows: this app's own demo trust
 * has 65 classes, 87 teachers and 2,015 students, and each of those was being
 * rendered as a wall of chips the person had to scroll past to reach the rest
 * of the form. A sheet holds any number, brings its own search once there are
 * more than a handful, and shows a second line — which is the only way to tell
 * one "1 A" from the "1 A" in another campus.
 *
 * Rule of thumb: a fixed vocabulary stays a chip row; anything the tenant can
 * add to belongs here.
 */
export function FormSelectSheet<TForm extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  helper,
  allowEmpty,
  emptyLabel,
  disabled,
}: Props<TForm>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <SelectSheet
          label={label}
          value={(value as string) ?? null}
          onChange={(next) => onChange(next ?? '')}
          options={options}
          placeholder={placeholder}
          allowEmpty={allowEmpty}
          emptyLabel={emptyLabel}
          sheetTitle={label}
          error={error?.message}
          helper={helper}
          disabled={disabled}
        />
      )}
    />
  );
}
