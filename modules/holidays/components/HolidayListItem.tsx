import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { calendarLocaleForLanguage } from '@/i18n';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { StatusPill } from '@/common/components/StatusPill';
import { Holiday, HOLIDAY_TYPE_ACCENTS } from '../types';

interface HolidayListItemProps {
  holiday: Holiday;
  /** Omit both for a read-only card — which is what every non-manager gets. */
  onEdit?: (holiday: Holiday) => void;
  onDelete?: (holiday: Holiday) => void;
}

/**
 * One holiday, as the same card every other list in the app deals in: the
 * leave row's anatomy — name and status on the first line, the dates under it,
 * a note if there is one — with the holiday's type colour on the left edge.
 *
 * Managing it is the two icons every other card in the app manages with —
 * pencil and bin, top right, the class-teachers panel's row — so somebody who
 * has edited a teacher already knows how to edit a holiday.
 */
export const HolidayListItem: React.FC<HolidayListItemProps> = ({
  holiday,
  onEdit,
  onDelete,
}) => {
  const { t, i18n } = useTranslation('holidays');
  const { palette, spacing, radius, elevation } = useTheme();
  const locale = calendarLocaleForLanguage(i18n.language ?? 'en');
  const canManage = !!(onEdit || onDelete);

  const accent = HOLIDAY_TYPE_ACCENTS[holiday.holiday_type] ?? 'onSurface';

  const dateLine = useMemo(() => {
    if (holiday.is_recurring) {
      return t('list.everyPrefix', { day: holiday.recurring_day_name ?? '' });
    }
    if (!holiday.start_date) return '';
    const fmt = (iso: string) =>
      new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    const singleDay =
      holiday.is_single_day ||
      !holiday.end_date ||
      holiday.start_date === holiday.end_date;
    if (singleDay) return fmt(holiday.start_date);
    const span = `${fmt(holiday.start_date)} – ${fmt(holiday.end_date!)}`;
    return holiday.duration_days > 1
      ? `${span} · ${t('list.durationDays', { count: holiday.duration_days })}`
      : span;
  }, [holiday, locale, t]);

  const typeLabel = t(`form.types.${holiday.holiday_type}`, {
    defaultValue: holiday.holiday_type,
  });

  return (
    <View
      style={[
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.sm,
          borderLeftWidth: 4,
          borderLeftColor: palette[accent],
        },
        elevation.card,
      ]}
    >
      <View style={[styles.row, { gap: spacing.sm }]}>
        <Text variant="labelLg" color="onSurface" style={styles.flex}>
          {holiday.name}
        </Text>
        {canManage ? (
          <View style={styles.actions}>
            {onEdit ? (
              <AppIcon
                name="create-outline"
                size="lg"
                color="primary"
                onPress={() => onEdit(holiday)}
                accessibilityLabel={t('list.edit')}
              />
            ) : null}
            {onDelete ? (
              <AppIcon
                name="trash-outline"
                size="lg"
                color="error"
                onPress={() => onDelete(holiday)}
                accessibilityLabel={t('list.delete')}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={[styles.row, { gap: spacing.xs }]}>
        <AppIcon
          name={holiday.is_recurring ? 'repeat-outline' : 'calendar-outline'}
          size="sm"
          color="onSurfaceVariant"
        />
        <Text variant="labelSm" color="onSurfaceVariant" style={styles.flex}>
          {dateLine}
        </Text>
      </View>

      <View style={styles.badges}>
        <StatusPill label={typeLabel} tone={accent} />
      </View>

      {holiday.description ? (
        <Text variant="bodyMd" color="onSurfaceVariant" numberOfLines={2}>
          {holiday.description}
        </Text>
      ) : null}

      {holiday.falls_on_sunday ? (
        <View style={[styles.row, { gap: spacing.xs }]}>
          <AppIcon name="alert-circle-outline" size="sm" color="warning" />
          <Text variant="labelSm" color="warning" style={styles.flex}>
            {t('list.fallsOnSunday')}
          </Text>
        </View>
      ) : null}

    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  flex: { flex: 1 },
});
