// client/modules/teacher-leaves/screens/TeacherLeaveFormScreen.tsx
import React from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';
import { PageHeader } from '@/common/components/PageHeader';
import { FormSection, FormSelect, FormDatePicker, FormTextArea } from '@/common/forms';
import { useDialog, useToast } from '@/common/feedback';
import { schoolTodayIso } from '@/common/utils/datetime';
import { LEAVE_TYPES } from '@/modules/teachers/types';
import { useCreateTeacherLeave, useMyLeaveBalances } from '../hooks/useTeacherLeaves';
import { estimateWorkingDays } from '../utils/workingDays';
import {
  createTeacherLeaveSchema,
  type CreateTeacherLeaveInput,
} from '../validation/schemas';

/**
 * Applying for leave, as a screen rather than the form-sheet modal it
 * replaces — the app's rule is that anything a person fills in is its own
 * route, with a back chevron, a Cancel link and a discard prompt.
 *
 * Two behaviours carried over from the modal, because they are the reason the
 * form is worth filling in carefully:
 *
 *   - the **balance check**, which stops a request the teacher cannot afford
 *     before they submit it rather than after the server refuses;
 *   - the **working-day estimate**, which tells a teacher that Friday to
 *     Monday over a long weekend costs two days, not four.
 */
export default function TeacherLeaveFormScreen() {
  const { t } = useTranslation('teacherLeaves');
  const { confirm } = useDialog();
  const toast = useToast();
  const { spacing, palette, radius } = useTheme();

  const balancesQuery = useMyLeaveBalances();
  const createMutation = useCreateTeacherLeave();

  const todayIso = schoolTodayIso();

  const { control, handleSubmit, watch, formState } = useForm<CreateTeacherLeaveInput>({
    resolver: zodResolver(createTeacherLeaveSchema),
    defaultValues: {
      leave_type: 'casual',
      start_date: todayIso,
      end_date: todayIso,
      reason: '',
    },
  });

  const leaveType = watch('leave_type');
  const startDate = watch('start_date');
  const endDate = watch('end_date');

  const [estimate, setEstimate] = React.useState<{
    workingDays: number;
    excludedDays: number;
  } | null>(null);
  const [checking, setChecking] = React.useState(false);

  // Re-cost the request whenever the range moves. The school's own holiday
  // calendar decides what counts, so this has to ask the server.
  React.useEffect(() => {
    let cancelled = false;
    if (!startDate || !endDate || endDate < startDate) {
      setEstimate(null);
      return;
    }
    setChecking(true);
    estimateWorkingDays(startDate, endDate)
      .then((result) => {
        if (!cancelled) setEstimate(result);
      })
      .catch(() => {
        // A holiday lookup that fails should not block an application. The
        // server recomputes the cost on submit; this is guidance, not a gate.
        if (!cancelled) setEstimate(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  const balance = balancesQuery.data?.find((b) => b.leave_type === leaveType);
  const needed = estimate?.workingDays ?? null;
  const overdrawn =
    balance != null &&
    !balance.is_unlimited &&
    !balance.allow_negative &&
    needed != null &&
    balance.available_days < needed;

  const handleBack = React.useCallback(async () => {
    if (formState.isDirty) {
      const discard = await confirm({
        title: t('tracker.discard.title', { defaultValue: 'Discard request?' }),
        description: t('tracker.discard.body', {
          defaultValue: 'Your unsaved request will be lost.',
        }),
        tone: 'danger',
        confirmLabel: t('tracker.discard.confirm', { defaultValue: 'Discard' }),
        cancelLabel: t('tracker.discard.cancel', { defaultValue: 'Keep editing' }),
      });
      if (discard) router.back();
    } else {
      router.back();
    }
  }, [formState.isDirty, t, confirm]);

  React.useEffect(() => {
    const onBack = () => {
      if (formState.isDirty) {
        handleBack();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [formState.isDirty, handleBack]);

  const onSubmit = async (data: CreateTeacherLeaveInput) => {
    try {
      const result = await createMutation.mutateAsync({
        start_date: data.start_date,
        end_date: data.end_date,
        leave_type: data.leave_type,
        reason: data.reason || undefined,
      });
      const warning = (result as { warning?: string })?.warning;
      if (warning) toast.info(warning);
      router.back();
    } catch (e: unknown) {
      toast.error(
        e instanceof Error
          ? e.message
          : t('tracker.applyModal.alertErrorSubmit', { defaultValue: 'Could not submit' }),
      );
    }
  };

  const leaveTypeOptions = LEAVE_TYPES.map((value) => ({
    value,
    label: t(`leaveTypes.${value}`, { defaultValue: value }),
  }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={20}
    >
      <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile }}>
        <PageHeader
          title={t('tracker.applyModal.title', { defaultValue: 'Apply for leave' })}
          onBack={handleBack}
          backLabel={t('tracker.back', { defaultValue: 'Back' })}
          right={<Link onPress={handleBack}>{t('tracker.cancel', { defaultValue: 'Cancel' })}</Link>}
          noHorizontalPadding
          divider={false}
        />

        <ScrollView
          contentContainerStyle={{
            gap: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.scrollBottom,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormSection
            title={t('tracker.applyModal.leaveType', { defaultValue: 'Type & dates' })}
          >
            <FormSelect
              control={control}
              name="leave_type"
              label={t('tracker.applyModal.leaveType', { defaultValue: 'Leave type' })}
              options={leaveTypeOptions}
            />
            <FormDatePicker
              control={control}
              name="start_date"
              label={t('tracker.applyModal.startDate', { defaultValue: 'Start date' })}
            />
            <FormDatePicker
              control={control}
              name="end_date"
              label={t('tracker.applyModal.endDate', { defaultValue: 'End date' })}
            />
          </FormSection>

          {/* What this request will actually cost, before it is sent. */}
          <View
            style={{
              backgroundColor: overdrawn ? `${palette.error}18` : palette.surfaceContainerLow,
              borderRadius: radius.lg,
              padding: spacing.md,
              gap: spacing.xs,
            }}
          >
            {checking ? (
              <Text variant="labelSm" color="onSurfaceVariant">
                {t('tracker.applyModal.checkingHolidays', {
                  defaultValue: 'Checking the school calendar…',
                })}
              </Text>
            ) : (
              <>
                {balance ? (
                  <Text variant="labelSm" color="onSurfaceVariant">
                    {balance.is_unlimited
                      ? t('tracker.applyModal.unlimited', { defaultValue: 'No limit on this type' })
                      : t('tracker.applyModal.availableDays', {
                          available: balance.available_days.toFixed(1),
                          defaultValue: '{{available}} days available',
                        })}
                  </Text>
                ) : null}

                {estimate ? (
                  <Text variant="bodyMd" color="onSurface">
                    {t('tracker.applyModal.costsDays', {
                      count: estimate.workingDays,
                      defaultValue: 'This request uses {{count}} working days',
                    })}
                    {estimate.excludedDays > 0
                      ? ` · ${t('tracker.applyModal.holidaysExcluded', {
                          count: estimate.excludedDays,
                          defaultValue: '{{count}} closed days not counted',
                        })}`
                      : ''}
                  </Text>
                ) : null}

                {overdrawn ? (
                  <Text variant="labelSm" color="error">
                    {t('tracker.applyModal.balErr', {
                      available: balance?.available_days.toFixed(1),
                      needed: needed?.toFixed(1),
                      defaultValue:
                        'Only {{available}} days left, and this request needs {{needed}}',
                    })}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          <FormSection title={t('tracker.applyModal.reason', { defaultValue: 'Reason' })}>
            <FormTextArea
              control={control}
              name="reason"
              label={t('tracker.applyModal.reason', { defaultValue: 'Reason' })}
              placeholder={t('tracker.applyModal.placeholderReason', {
                defaultValue: 'Why you need this leave',
              })}
            />
          </FormSection>
        </ScrollView>

        <View style={{ paddingVertical: spacing.lg, backgroundColor: palette.surface }}>
          <Button
            variant="primary"
            fullWidth
            disabled={overdrawn || checking}
            loading={createMutation.isPending}
            onPress={handleSubmit(onSubmit)}
          >
            {overdrawn
              ? t('tracker.applyModal.submitInsufficient', { defaultValue: 'Not enough balance' })
              : t('tracker.applyModal.submitRequest', { defaultValue: 'Submit request' })}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
