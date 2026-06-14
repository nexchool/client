import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Button } from '@/common/components/Button';
import { BottomSheet, FieldTrigger } from '@/common/components/sheet';
import { formatDate, formatDateTime } from '@/common/utils/datetime';
import { MonthGrid } from './MonthGrid';
import { TimeRow } from './TimeRow';

/**
 * Custom themed date picker — replaces DateField (which mixed the OS Android
 * dialog, a bespoke iOS spinner sheet, and the deprecated Colors shim). One
 * bottom-sheet calendar on both platforms, themed via useTheme().
 *
 * Values are ISO strings: 'YYYY-MM-DD' for mode="date", full ISO for
 * mode="datetime". Empty/null means unset.
 */

export type DatePickerProps = {
  label?: string;
  value?: string | null;
  onChange: (iso: string) => void;
  mode?: 'date' | 'datetime';
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
  helper?: string;
  disabled?: boolean;
};

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isoDay(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function DatePicker({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder,
  minimumDate,
  maximumDate,
  error,
  helper,
  disabled,
}: DatePickerProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const parsed = parseDate(value);
  const [draftDay, setDraftDay] = useState<string | null>(null);
  const [draftHour, setDraftHour] = useState(9);
  const [draftMinute, setDraftMinute] = useState(0);
  const [month, setMonth] = useState<Date>(parsed ?? new Date());

  const display =
    mode === 'datetime' ? (value ? formatDateTime(value) : '') : value ? formatDate(value) : '';

  const openSheet = () => {
    const v = parseDate(value);
    setDraftDay(v ? isoDay(v) : null);
    setDraftHour(v ? v.getHours() : 9);
    setDraftMinute(v ? v.getMinutes() : 0);
    setMonth(v ?? new Date());
    setOpen(true);
  };

  const confirm = () => {
    if (!draftDay) {
      setOpen(false);
      return;
    }
    if (mode === 'datetime') {
      const [y, m, d] = draftDay.split('-').map(Number);
      onChange(new Date(y, m - 1, d, draftHour, draftMinute).toISOString());
    } else {
      onChange(draftDay);
    }
    setOpen(false);
  };

  return (
    <>
      <FieldTrigger
        label={label}
        display={display}
        placeholder={placeholder ?? t('datePicker.placeholder', { defaultValue: 'Select date' })}
        error={error}
        helper={helper}
        disabled={disabled}
        onPress={openSheet}
        icon="calendar-outline"
      />
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <MonthGrid
          month={month}
          onMonthChange={setMonth}
          selected={draftDay}
          onSelectDay={setDraftDay}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          resetKey={open}
        />
        {mode === 'datetime' ? (
          <TimeRow
            hour={draftHour}
            minute={draftMinute}
            onChange={(h, m) => {
              setDraftHour(h);
              setDraftMinute(m);
            }}
          />
        ) : null}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button variant="secondary" onPress={() => setOpen(false)}>
              {t('datePicker.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button variant="primary" onPress={confirm} disabled={!draftDay}>
              {t('datePicker.done', { defaultValue: 'Done' })}
            </Button>
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

export type DateRangeValue = { from: string | null; to: string | null };

export type DateRangePickerProps = {
  label?: string;
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
  disabled?: boolean;
};

export function DateRangePicker({
  label,
  value,
  onChange,
  placeholder,
  minimumDate,
  maximumDate,
  error,
  disabled,
}: DateRangePickerProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>(value);
  const [month, setMonth] = useState<Date>(parseDate(value.from) ?? new Date());

  const display =
    value.from && value.to
      ? `${formatDate(value.from)} – ${formatDate(value.to)}`
      : value.from
        ? `${formatDate(value.from)} – …`
        : '';

  const selectDay = (iso: string) => {
    setDraft((prev) => {
      // First tap (or restarting after a complete range) sets `from`;
      // second tap sets `to`, swapping if it lands before `from`.
      if (!prev.from || (prev.from && prev.to)) return { from: iso, to: null };
      if (iso < prev.from) return { from: iso, to: prev.from };
      return { from: prev.from, to: iso };
    });
  };

  const openSheet = () => {
    setDraft(value);
    setMonth(parseDate(value.from) ?? new Date());
    setOpen(true);
  };

  const confirm = () => {
    onChange(draft.from && !draft.to ? { from: draft.from, to: draft.from } : draft);
    setOpen(false);
  };

  return (
    <>
      <FieldTrigger
        label={label}
        display={display}
        placeholder={
          placeholder ?? t('datePicker.rangePlaceholder', { defaultValue: 'Select dates' })
        }
        error={error}
        disabled={disabled}
        onPress={openSheet}
        icon="calendar-outline"
      />
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <MonthGrid
          month={month}
          onMonthChange={setMonth}
          rangeFrom={draft.from}
          rangeTo={draft.to}
          onSelectDay={selectDay}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          resetKey={open}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              variant="secondary"
              onPress={() => {
                setDraft({ from: null, to: null });
              }}
            >
              {t('datePicker.clear', { defaultValue: 'Clear' })}
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button variant="primary" onPress={confirm}>
              {t('datePicker.done', { defaultValue: 'Done' })}
            </Button>
          </View>
        </View>
      </BottomSheet>
    </>
  );
}
