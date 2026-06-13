import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Button } from '@/common/components/Button';
import { BottomSheet, FieldTrigger } from '@/common/components/sheet';

/**
 * Unified single/multi select — replaces the bespoke modal selectors
 * (ClassSelect / ClassMultiSelect / inline class lists). Bottom-sheet surface,
 * search appears automatically for long option lists, 44px rows.
 */

export type SelectOption = {
  value: string;
  label: string;
  /** Secondary line, e.g. an admission number or section. */
  sublabel?: string;
};

const SEARCH_THRESHOLD = 8;
const ROW_H = 48;

function OptionRow({
  option,
  selected,
  multi,
  onPress,
}: {
  option: SelectOption;
  selected: boolean;
  multi: boolean;
  onPress: () => void;
}) {
  const { palette, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: ROW_H,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: selected
          ? palette.primaryContainer
          : pressed
            ? palette.surfaceContainerHigh
            : 'transparent',
      })}
    >
      {multi ? (
        <AppIcon
          name={selected ? 'checkbox' : 'square-outline'}
          size="md"
          color={selected ? 'primary' : 'onSurfaceVariant'}
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text
          variant="bodyMd"
          color={selected ? 'onPrimaryContainer' : 'onSurface'}
          numberOfLines={1}
        >
          {option.label}
        </Text>
        {option.sublabel ? (
          <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1}>
            {option.sublabel}
          </Text>
        ) : null}
      </View>
      {!multi && selected ? <AppIcon name="checkmark" size="md" color="primary" /> : null}
    </Pressable>
  );
}

function SheetBody({
  title,
  options,
  isSelected,
  onToggle,
  footer,
}: {
  title?: string;
  options: SelectOption[];
  isSelected: (value: string) => boolean;
  onToggle: (value: string) => void;
  footer?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { palette, spacing, radius } = useTheme();
  const [query, setQuery] = useState('');
  const showSearch = options.length > SEARCH_THRESHOLD;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q)
    );
  }, [options, query]);

  return (
    <>
      {title ? (
        <Text variant="headlineMd" color="onSurface">
          {title}
        </Text>
      ) : null}
      {showSearch ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: palette.surfaceContainerHigh,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
            height: 44,
          }}
        >
          <AppIcon name="search-outline" size="md" color="onSurfaceVariant" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('select.searchPlaceholder', { defaultValue: 'Search…' })}
            placeholderTextColor={palette.onSurfaceVariant}
            style={{ flex: 1, color: palette.onSurface, paddingVertical: 0 }}
          />
        </View>
      ) : null}
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.value}
        style={{ maxHeight: ROW_H * 7 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
            <Text variant="bodyMd" color="onSurfaceVariant">
              {t('select.noMatches', { defaultValue: 'No matches.' })}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <OptionRow
            option={item}
            selected={isSelected(item.value)}
            multi={!!footer}
            onPress={() => onToggle(item.value)}
          />
        )}
      />
      {footer}
    </>
  );
}

export type SelectSheetProps = {
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: SelectOption[];
  placeholder?: string;
  /** When set, an "All / Any" row clears the selection (value null). */
  allowEmpty?: boolean;
  emptyLabel?: string;
  sheetTitle?: string;
  error?: string;
  disabled?: boolean;
};

export function SelectSheet({
  label,
  value,
  onChange,
  options,
  placeholder,
  allowEmpty,
  emptyLabel,
  sheetTitle,
  error,
  disabled,
}: SelectSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const display = options.find((o) => o.value === value)?.label ?? '';
  const allOptions: SelectOption[] = allowEmpty
    ? [
        {
          value: '__all__',
          label: emptyLabel ?? t('select.all', { defaultValue: 'All' }),
        },
        ...options,
      ]
    : options;

  return (
    <>
      <FieldTrigger
        label={label}
        display={display}
        placeholder={placeholder ?? t('select.placeholder', { defaultValue: 'Select…' })}
        error={error}
        disabled={disabled}
        onPress={() => setOpen(true)}
      />
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <SheetBody
          title={sheetTitle ?? label}
          options={allOptions}
          isSelected={(v) => (v === '__all__' ? value === null : v === value)}
          onToggle={(v) => {
            onChange(v === '__all__' ? null : v);
            setOpen(false);
          }}
        />
      </BottomSheet>
    </>
  );
}

export type MultiSelectSheetProps = {
  label?: string;
  value: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  sheetTitle?: string;
  /** Shown under the trigger, e.g. "Leave empty for all classes." */
  hint?: string;
  error?: string;
  disabled?: boolean;
};

export function MultiSelectSheet({
  label,
  value,
  onChange,
  options,
  placeholder,
  sheetTitle,
  hint,
  error,
  disabled,
}: MultiSelectSheetProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);

  const display =
    value.length === 0
      ? ''
      : value.length <= 2
        ? options
            .filter((o) => value.includes(o.value))
            .map((o) => o.label)
            .join(', ')
        : t('select.nSelected', { defaultValue: '{{count}} selected', count: value.length });

  const openSheet = () => {
    setDraft(value);
    setOpen(true);
  };

  return (
    <>
      <FieldTrigger
        label={label}
        display={display}
        placeholder={placeholder ?? hint ?? t('select.placeholder', { defaultValue: 'Select…' })}
        error={error}
        disabled={disabled}
        onPress={openSheet}
      />
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <SheetBody
          title={sheetTitle ?? label}
          options={options}
          isSelected={(v) => draft.includes(v)}
          onToggle={(v) =>
            setDraft((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))
          }
          footer={
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button variant="secondary" onPress={() => setDraft([])}>
                  {t('select.clear', { defaultValue: 'Clear' })}
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  variant="primary"
                  onPress={() => {
                    onChange(draft);
                    setOpen(false);
                  }}
                >
                  {t('select.done', { defaultValue: 'Done' })}
                </Button>
              </View>
            </View>
          }
        />
      </BottomSheet>
    </>
  );
}
