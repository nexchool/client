import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useTheme } from '@/common/theme';
import { AppIcon } from '@/common/components/AppIcon';
import { Button } from '@/common/components/Button';
import { EmptyState } from '@/common/components/EmptyState';
import { Link } from '@/common/components/Link';
import { PageHeader } from '@/common/components/PageHeader';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Skeleton } from '@/common/components/Skeleton';
import {
  FormDatePicker,
  FormField,
  FormSection,
  FormSelect,
  FormSelectSheet,
  FormTextArea,
} from '@/common/forms';
import { useDialog, useToast } from '@/common/feedback';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useAcademicYears } from '@/modules/academics/hooks/useAcademicYears';
import { useAcademicYearContext } from '@/modules/academics/context/AcademicYearContext';
import { holidayService } from '../services/holidayService';
import {
  buildHolidayFormSchema,
  toHolidayPayload,
  type HolidayFormInput,
  type HolidayScheduleKind,
} from '../validation/schemas';
import type { Holiday, HolidayType } from '../types';

const SCHEDULE_KINDS: readonly HolidayScheduleKind[] = ['single', 'range', 'recurring'];
const HOLIDAY_TYPES: readonly HolidayType[] = ['public', 'school', 'regional', 'optional', 'weekly_off'];
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

const SCHEDULE_LABEL_KEYS: Record<HolidayScheduleKind, string> = {
  single: 'form.modeSingle',
  range: 'form.modeRange',
  recurring: 'form.modeRecurring',
};

function scheduleKindOf(h: Holiday): HolidayScheduleKind {
  if (h.is_recurring) return 'recurring';
  if (h.start_date && h.end_date && h.start_date !== h.end_date) return 'range';
  return 'single';
}

function toFormValues(h: Holiday): HolidayFormInput {
  return {
    schedule: scheduleKindOf(h),
    name: h.name ?? '',
    description: h.description ?? '',
    holiday_type: h.holiday_type,
    start_date: h.start_date ?? '',
    end_date: h.end_date ?? '',
    recurring_day_of_week: h.recurring_day_of_week != null ? String(h.recurring_day_of_week) : '',
    academic_year_id: h.academic_year_id ?? '',
  };
}

/**
 * Add or edit one holiday — framed exactly as the student and teacher forms
 * are: `ScreenContainer`, a header whose Cancel link only appears while
 * creating (an edit is left by the back chevron), a section per question,
 * the bordered save bar pinned to the bottom, and a "discard?" on the way
 * out if anything changed.
 *
 * With `id` in the route it loads that holiday first; without, it is a blank
 * form pre-set to the academic year the app is currently reading through.
 */
export default function HolidayFormScreen() {
  const { t } = useTranslation(['holidays', 'common']);
  const { spacing, palette, radius } = useTheme();
  const { confirm } = useDialog();
  const toast = useToast();
  const { isFeatureEnabled } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const { selectedAcademicYearId } = useAcademicYearContext();
  const { data: academicYears = [] } = useAcademicYears(false);

  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'failed'>(isEdit ? 'loading' : 'idle');
  const [saving, setSaving] = useState(false);

  // Holidays live in the academic calendar, and the API gates them behind it.
  // Same guard as the list route, so a deep link cannot open a form that would
  // only ever save to a 403.
  useEffect(() => {
    if (!isFeatureEnabled('academic_calendar')) router.replace('/(protected)/home');
  }, [isFeatureEnabled]);

  const schema = useMemo(() => buildHolidayFormSchema((key) => t(`holidays:${key}`)), [t]);

  const { control, handleSubmit, watch, reset, formState } = useForm<HolidayFormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      schedule: 'single',
      name: '',
      description: '',
      holiday_type: 'school',
      start_date: '',
      end_date: '',
      recurring_day_of_week: '',
      academic_year_id: selectedAcademicYearId ?? '',
    },
  });

  const schedule = watch('schedule');
  const startDate = watch('start_date');

  const loadHoliday = useCallback(async () => {
    if (!id) return;
    setLoadState('loading');
    try {
      const holiday = await holidayService.getHoliday(id);
      reset(toFormValues(holiday));
      setLoadState('idle');
    } catch {
      setLoadState('failed');
    }
  }, [id, reset]);

  useEffect(() => { void loadHoliday(); }, [loadHoliday]);

  const handleBack = useCallback(async () => {
    if (!formState.isDirty) {
      router.back();
      return;
    }
    const discard = await confirm({
      title: t('holidays:form.discardTitle'),
      description: t('holidays:form.discardBody'),
      tone: 'danger',
      confirmLabel: t('holidays:form.discardConfirm'),
      cancelLabel: t('holidays:form.discardCancel'),
    });
    if (discard) router.back();
  }, [formState.isDirty, confirm, t]);

  useEffect(() => {
    const onBack = () => {
      if (!formState.isDirty) return false;
      void handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [formState.isDirty, handleBack]);

  const onSubmit = async (values: HolidayFormInput) => {
    setSaving(true);
    try {
      const payload = toHolidayPayload(values);
      if (isEdit) {
        await holidayService.updateHoliday(id!, payload);
        toast.success(t('holidays:alerts.updated'));
      } else {
        await holidayService.createHoliday(payload);
        toast.success(t('holidays:alerts.created'));
      }
      router.back();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('holidays:form.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const scheduleOptions = SCHEDULE_KINDS.map((k) => ({ value: k, label: t(`holidays:${SCHEDULE_LABEL_KEYS[k]}`) }));
  const typeOptions = HOLIDAY_TYPES.map((ht) => ({ value: ht, label: t(`holidays:form.types.${ht}`) }));
  const weekdayOptions = WEEKDAYS.map((d) => ({ value: String(d), label: t(`holidays:form.days.${d}`) }));
  const yearOptions = academicYears.map((ay) => ({ value: ay.id, label: ay.name }));

  const title = isEdit ? t('holidays:form.titleEdit') : t('holidays:form.titleAdd');

  const header = (
    <PageHeader
      title={title}
      onBack={() => void handleBack()}
      backLabel={t('common:back')}
      right={
        !isEdit ? (
          <Link onPress={() => void handleBack()}>{t('holidays:form.cancel')}</Link>
        ) : null
      }
      noHorizontalPadding
      divider={false}
    />
  );

  if (loadState === 'loading') {
    return (
      <ScreenContainer topInset={false}>
        <Skeleton width="100%" height={400} radius={radius.lg} />
      </ScreenContainer>
    );
  }

  if (loadState === 'failed') {
    return (
      <ScreenContainer topInset={false} scrollable={false}>
        {header}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon={<AppIcon name="alert-circle-outline" size="xl" color="error" />}
            title={t('holidays:form.loadFailed')}
            action={{ label: t('holidays:errors.retry'), onPress: () => void loadHoliday() }}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer keyboardOffset={20} topInset={false}>
      {header}

      <View style={{ gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.scrollBottomWithFooter }}>
        <FormSection title={t('holidays:form.sectionSchedule')}>
          <FormSelect control={control} name="schedule" label={t('holidays:form.scheduleLabel')} options={scheduleOptions} />

          {schedule === 'single' ? (
            <FormDatePicker control={control} name="start_date" label={t('holidays:form.dateLabel')} />
          ) : null}

          {schedule === 'range' ? (
            <>
              <FormDatePicker control={control} name="start_date" label={t('holidays:form.startDateLabel')} />
              <FormDatePicker
                control={control}
                name="end_date"
                label={t('holidays:form.endDateLabel')}
                minDate={startDate ? new Date(`${startDate}T00:00:00`) : undefined}
              />
            </>
          ) : null}

          {schedule === 'recurring' ? (
            <FormSelectSheet
              control={control}
              name="recurring_day_of_week"
              label={t('holidays:form.repeatsEvery')}
              options={weekdayOptions}
              placeholder={t('holidays:form.dayPlaceholder')}
              helper={t('holidays:form.recurringInfo')}
            />
          ) : null}
        </FormSection>

        <FormSection title={t('holidays:form.sectionDetails')}>
          <FormField
            control={control}
            name="name"
            label={t('holidays:form.nameLabel')}
            placeholder={t('holidays:form.namePlaceholder')}
            autoCapitalize="words"
          />
          <FormSelect control={control} name="holiday_type" label={t('holidays:form.categoryLabel')} options={typeOptions} />
          {yearOptions.length > 0 ? (
            <FormSelectSheet
              control={control}
              name="academic_year_id"
              label={t('holidays:form.academicYear')}
              options={yearOptions}
              placeholder={t('holidays:form.allYears')}
              allowEmpty
              emptyLabel={t('holidays:form.allYears')}
            />
          ) : null}
          <FormTextArea
            control={control}
            name="description"
            label={t('holidays:form.descriptionLabel')}
            placeholder={t('holidays:form.descriptionPlaceholder')}
            numberOfLines={4}
            maxLength={500}
          />
        </FormSection>
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.marginMobile,
          backgroundColor: palette.surface,
          borderTopWidth: 1,
          borderTopColor: palette.outlineVariant,
        }}
      >
        <Button variant="primary" fullWidth loading={saving} onPress={handleSubmit(onSubmit)}>
          {isEdit ? t('holidays:form.saveChanges') : t('holidays:form.addHoliday')}
        </Button>
      </View>
    </ScreenContainer>
  );
}
