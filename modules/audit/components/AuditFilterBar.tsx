// client/modules/audit/components/AuditFilterBar.tsx
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { ACTION_OPTIONS, MODULE_OPTIONS, AuditSelectOption } from '../constants';
import type { AuditFilters } from '../types';

type Props = {
  filters: AuditFilters;
  onChange: (next: AuditFilters) => void;
};

function parseIsoDate(value?: string): Date {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function AuditFilterBar({ filters, onChange }: Props) {
  const { palette, spacing, radius } = useTheme();
  const { t } = useTranslation('audit');
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  // Translate a chip's display text from the i18n map, falling back to the
  // option's static label so unknown server values still render.
  const chipLabel = (group: 'module' | 'action', option: AuditSelectOption) =>
    option.value === ''
      ? t('filter.all')
      : t(`${group}.${option.value}`, { defaultValue: option.label });

  const makeDateHandler =
    (field: 'date_from' | 'date_to', close: () => void) =>
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') {
        close();
        if (event.type === 'set' && date) {
          onChange({ ...filters, [field]: date.toISOString().slice(0, 10) });
        }
        return;
      }
      // iOS: inline spinner reports each change; keep open until backdrop/re-tap.
      if (date) {
        onChange({ ...filters, [field]: date.toISOString().slice(0, 10) });
      }
    };

  const dateControl = (
    label: string,
    field: 'date_from' | 'date_to',
    show: boolean,
    setShow: (v: boolean) => void,
    close: () => void,
  ) => {
    const current = filters[field];
    return (
      <View style={{ flex: 1, gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => setShow(true)}
            style={({ pressed }) => ({
              flex: 1,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: palette.outlineVariant,
              backgroundColor: palette.surfaceContainerLowest,
              opacity: pressed ? 0.85 : 1,
              minHeight: 40,
              justifyContent: 'center',
            })}
          >
            <Text variant="labelSm" color="onSurfaceVariant">
              {label}
            </Text>
            <Text variant="bodyMd" color={current ? 'onSurface' : 'onSurfaceVariant'}>
              {current ?? t('filter.any')}
            </Text>
          </Pressable>
          {current ? (
            <AppIcon
              name="close"
              size="sm"
              color="onSurfaceVariant"
              onPress={() => onChange({ ...filters, [field]: undefined })}
              style={{ paddingHorizontal: spacing.sm }}
              accessibilityLabel={t('filter.clear', { defaultValue: 'Clear' })}
            />
          ) : null}
        </View>
        {show ? (
          <DateTimePicker
            mode="date"
            value={parseIsoDate(current)}
            display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
            onChange={makeDateHandler(field, close)}
          />
        ) : null}
      </View>
    );
  };

  const chip = (active: boolean, option: AuditSelectOption, displayLabel: string, onPress: () => void) => (
    <Pressable
      key={`${option.value}-${option.label}`}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        backgroundColor: active ? palette.tertiaryContainer : palette.surfaceContainerLowest,
        borderWidth: active ? 0 : 1,
        borderColor: palette.outlineVariant,
        opacity: pressed ? 0.85 : 1,
        minHeight: 40,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text variant="labelMd" color={active ? 'onTertiaryContainer' : 'onSurface'}>
        {displayLabel}
      </Text>
    </Pressable>
  );

  const activeModule = filters.module ?? '';
  const activeAction = filters.action ?? '';

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {dateControl(t('filter.from'), 'date_from', showFrom, setShowFrom, () => setShowFrom(false))}
        {dateControl(t('filter.to'), 'date_to', showTo, setShowTo, () => setShowTo(false))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {MODULE_OPTIONS.map((option) =>
          chip(activeModule === option.value, option, chipLabel('module', option), () =>
            onChange({ ...filters, module: option.value || undefined }),
          ),
        )}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {ACTION_OPTIONS.map((option) =>
          chip(activeAction === option.value, option, chipLabel('action', option), () =>
            onChange({ ...filters, action: option.value || undefined }),
          ),
        )}
      </ScrollView>
    </View>
  );
}
