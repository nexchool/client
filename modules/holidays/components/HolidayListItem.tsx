import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { calendarLocaleForLanguage } from '@/i18n';
import { Colors } from '@/common/constants/colors';
import { Spacing, Layout } from '@/common/constants/spacing';
import { Holiday, HOLIDAY_TYPE_COLORS } from '../types';

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

  const typeColor = HOLIDAY_TYPE_COLORS[holiday.holiday_type] ?? Colors.text;
  const typeLabel = t(`holidayForm.types.${holiday.holiday_type}`, {
    ns: 'teacherLeaves',
    defaultValue: holiday.holiday_type,
  });

  return (
    <View style={styles.container}>
      <View style={[styles.accentDot, { backgroundColor: typeColor }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              {holiday.is_recurring && (
                <Ionicons name="repeat" size={14} color={Colors.textTertiary} style={styles.recurIcon} />
              )}
              <Text style={styles.name} numberOfLines={2}>
                {holiday.name}
              </Text>
            </View>
          </View>

          {canManage && (
            <View style={styles.actions}>
              {onEdit && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onEdit(holiday)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                >
                  <Ionicons name="pencil-outline" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onDelete(holiday)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <Text style={styles.dateLine}>{dateRange}</Text>

        <View style={styles.metaRow}>
          <View style={[styles.badge, { borderColor: typeColor + '40', backgroundColor: typeColor + '12' }]}>
            <Text style={[styles.badgeText, { color: typeColor }]}>{typeLabel}</Text>
          </View>
          {!holiday.is_recurring && holiday.duration_days > 1 && (
            <Text style={styles.durationText}>
              {t('list.durationDays', { count: holiday.duration_days })}
            </Text>
          )}
        </View>

        {holiday.falls_on_sunday && (
          <View style={styles.warningRow}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.warningText}>{t('list.fallsOnSunday')}</Text>
          </View>
        )}

        {!!holiday.description && (
          <Text style={styles.description} numberOfLines={3}>
            {holiday.description}
          </Text>
        )}

        {!!holiday.academic_year_name && (
          <Text style={styles.academicYear} numberOfLines={1}>
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
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderLight,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accentDot: {
    width: 3,
    alignSelf: 'stretch',
    opacity: 0.85,
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    paddingLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  titleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  recurIcon: {
    marginTop: 3,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  dateLine: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionBtn: {
    padding: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
  },
  warningText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
    lineHeight: 19,
  },
  academicYear: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 8,
  },
});
