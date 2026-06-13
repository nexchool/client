// client/modules/audit/components/AuditFilterBar.tsx
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { DateRangePicker } from '@/common/components/datepicker';
import { FilterChips } from '@/common/components/FilterChips';
import { ACTION_OPTIONS, MODULE_OPTIONS, AuditSelectOption } from '../constants';
import type { AuditFilters } from '../types';

type Props = {
  filters: AuditFilters;
  onChange: (next: AuditFilters) => void;
};

export function AuditFilterBar({ filters, onChange }: Props) {
  const { spacing } = useTheme();
  const { t } = useTranslation('audit');

  // Translate a chip's display text from the i18n map, falling back to the
  // option's static label so unknown server values still render.
  const chipLabel = (group: 'module' | 'action', option: AuditSelectOption) =>
    option.value === ''
      ? t('filter.all')
      : t(`${group}.${option.value}`, { defaultValue: option.label });

  return (
    <View style={{ gap: spacing.xs }}>
      <DateRangePicker
        label={t('filter.dateRange', { defaultValue: 'Date range' })}
        value={{ from: filters.date_from ?? null, to: filters.date_to ?? null }}
        onChange={(r) =>
          onChange({
            ...filters,
            date_from: r.from ?? undefined,
            date_to: r.to ?? undefined,
          })
        }
      />
      <FilterChips
        options={MODULE_OPTIONS.map((o) => ({ value: o.value, label: chipLabel('module', o) }))}
        value={filters.module ?? ''}
        onChange={(v) => onChange({ ...filters, module: v || undefined })}
      />
      <FilterChips
        options={ACTION_OPTIONS.map((o) => ({ value: o.value, label: chipLabel('action', o) }))}
        value={filters.action ?? ''}
        onChange={(v) => onChange({ ...filters, action: v || undefined })}
      />
    </View>
  );
}
