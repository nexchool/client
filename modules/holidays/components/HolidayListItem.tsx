import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { calendarLocaleForLanguage } from '@/i18n';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Holiday, HOLIDAY_TYPE_ACCENTS } from '../types';

interface HolidayListItemProps {
  holiday: Holiday;
  /** Omit for read-only (mobile default). */
  onEdit?: (holiday: Holiday) => void;
  onDelete?: (holiday: Holiday) => void;
  canManage?: boolean;
}

export const HolidayListItem: React.FC<HolidayListItemProps> = ({
  holiday,
  onEdit,
  onDelete,
  canManage = !!(onEdit || onDelete),
}) => {
  const { t, i18n } = useTranslation(['holidays', 'teacherLeaves']);
  const { palette, spacing, radius, elevation } = useTheme();
  const locale = calendarLocaleForLanguage(i18n.language ?? 'en');

  const dateRange = useMemo(() => {
    const fmt = (iso: string) => {
      const d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    };
    if (holiday.is_recurring) {
      return t('list.everyPrefix', { day: holiday.recurring_day_name ?? '' });
    }
    if (!holiday.start_date) return '';
    if (holiday.is_single_day || !holiday.end_date || holiday.start_date === holiday.end_date) {
      return fmt(holiday.start_date);
    }
    return `${fmt(holiday.start_date)} – ${fmt(holiday.end_date)}`;
  }, [holiday, locale, t]);

  const accent = HOLIDAY_TYPE_ACCENTS[holiday.holiday_type] ?? 'onSurface';
  const accentColor = palette[accent];
  const typeLabel = t(`holidayForm.types.${holiday.holiday_type}`, {
    ns: 'teacherLeaves',
    defaultValue: holiday.holiday_type,
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.md,
          borderColor: palette.outlineVariant,
          marginBottom: spacing.sm + 2,
        },
        elevation.card,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={[styles.body, { padding: spacing.md }]}>
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            {holiday.is_recurring && (
              <AppIcon name="repeat" size="sm" color="onSurfaceVariant" style={styles.recurIcon} />
            )}
            <Text variant="labelLg" color="onSurface" numberOfLines={2} style={styles.name}>
              {holiday.name}
            </Text>
          </View>

          {canManage && (
            <View style={[styles.actions, { gap: spacing.xs }]}>
              {onEdit && (
                <AppIcon
                  name="pencil-outline"
                  size="sm"
                  color="onSurfaceVariant"
                  onPress={() => onEdit(holiday)}
                  accessibilityLabel="Edit holiday"
                />
              )}
              {onDelete && (
                <AppIcon
                  name="trash-outline"
                  size="sm"
                  color="error"
                  onPress={() => onDelete(holiday)}
                  accessibilityLabel="Delete holiday"
                />
              )}
            </View>
          )}
        </View>

        <Text variant="bodySm" color="onSurfaceVariant" style={{ marginTop: spacing.xs + 4 }}>
          {dateRange}
        </Text>

        <View style={[styles.metaRow, { gap: spacing.sm, marginTop: spacing.sm + 2 }]}>
          <View
            style={[
              styles.badge,
              { borderColor: accentColor + '40', backgroundColor: accentColor + '12', borderRadius: radius.sm + 2 },
            ]}
          >
            <Text variant="labelSm" style={{ color: accentColor }}>
              {typeLabel}
            </Text>
          </View>
          {!holiday.is_recurring && holiday.duration_days > 1 && (
            <Text variant="labelSm" color="onSurfaceVariant">
              {t('list.durationDays', { count: holiday.duration_days })}
            </Text>
          )}
        </View>

        {holiday.falls_on_sunday && (
          <View style={[styles.warningRow, { gap: spacing.xs + 2, marginTop: spacing.sm + 2 }]}>
            <AppIcon name="information-circle-outline" size="sm" color="onSurfaceVariant" />
            <Text variant="labelSm" color="onSurfaceVariant" style={styles.flex}>
              {t('list.fallsOnSunday')}
            </Text>
          </View>
        )}

        {!!holiday.description && (
          <Text variant="bodySm" color="onSurfaceVariant" numberOfLines={3} style={{ marginTop: spacing.sm + 2 }}>
            {holiday.description}
          </Text>
        )}

        {!!holiday.academic_year_name && (
          <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ marginTop: spacing.xs + 4 }}>
            {holiday.academic_year_name}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    opacity: 0.85,
  },
  body: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  recurIcon: {
    marginTop: 3,
  },
  name: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flex: {
    flex: 1,
  },
});
