// client/modules/student-leaves/screens/StudentLeaveFormScreen.tsx
import React from 'react';
import { Alert, BackHandler, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';

import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';
import { Skeleton } from '@/common/components/Skeleton';
import { FormField, FormSelect, FormDatePicker, FormSection } from '@/common/forms';
import { studentService } from '@/modules/students/services/studentService';
import { useCreateStudentLeave } from '../hooks/useStudentLeaves';
import { createStudentLeaveSchema, type CreateStudentLeaveInput } from '../validation/schemas';
import { LEAVE_TYPE_OPTIONS, HALF_DAY_OPTIONS } from '../constants';
import type { CreateStudentLeavePayload } from '../types';

export default function StudentLeaveFormScreen() {
  const { t } = useTranslation('studentLeaves');
  const { spacing, palette, radius } = useTheme();
  const createMutation = useCreateStudentLeave();

  const myStudentQuery = useQuery({
    queryKey: ['students', 'me'],
    queryFn: () => studentService.getMyProfile(),
  });

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  const {
    control,
    handleSubmit,
    watch,
    formState,
  } = useForm<CreateStudentLeaveInput>({
    resolver: zodResolver(createStudentLeaveSchema),
    defaultValues: {
      leave_type: 'sick',
      start_date: todayIso,
      end_date: todayIso,
      half_day: 'full',
      reason: '',
    },
  });

  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const isSingleDay = startDate === endDate;

  const handleBack = React.useCallback(() => {
    if (formState.isDirty) {
      Alert.alert(
        t('discard.title', { defaultValue: 'Discard request?' }),
        t('discard.body', { defaultValue: 'Your unsaved request will be lost.' }),
        [
          { text: t('discard.cancel', { defaultValue: 'Keep editing' }), style: 'cancel' },
          { text: t('discard.confirm', { defaultValue: 'Discard' }), style: 'destructive', onPress: () => router.back() },
        ],
      );
    } else {
      router.back();
    }
  }, [formState.isDirty, t]);

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

  const onSubmit = async (data: CreateStudentLeaveInput) => {
    const studentId = myStudentQuery.data?.id;
    if (!studentId) {
      Alert.alert(
        t('error.noStudent.title', { defaultValue: 'Cannot apply' }),
        t('error.noStudent.body', { defaultValue: 'No student profile found on this account.' }),
      );
      return;
    }
    const payload = {
      student_id: studentId,
      leave_type: data.leave_type,
      start_date: data.start_date,
      end_date: data.end_date,
      half_day: data.half_day === 'full' ? undefined : data.half_day,
      reason: data.reason,
      attachment_document_id: data.attachment_document_id || undefined,
    } as const;

    try {
      const created = await createMutation.mutateAsync(payload as unknown as CreateStudentLeavePayload);
      router.replace({ pathname: '/(protected)/student-leaves/[id]', params: { id: created.id } } as never);
    } catch (err: unknown) {
      const e = err as { data?: { error?: { message?: string; details?: { detail?: string } } }; message?: string };
      const detail = e?.data?.error?.details?.detail || e?.data?.error?.message;
      const message = typeof detail === 'string' ? detail : (e?.message ?? t('error.submit.generic', { defaultValue: 'Please try again.' }));
      Alert.alert(t('error.submit.title', { defaultValue: 'Could not submit' }), message);
    }
  };

  if (myStudentQuery.isLoading) {
    return (
      <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
        <Skeleton width="100%" height={400} radius={radius.lg} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={20}
    >
      <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppIcon
            name="arrow-back"
            size="lg"
            color="onSurface"
            onPress={handleBack}
            accessibilityLabel={t('back', { defaultValue: 'Back' })}
          />
          <Link onPress={handleBack}>{t('cancel', { defaultValue: 'Cancel' })}</Link>
        </View>

        <Text variant="display" color="onSurface" style={{ marginTop: spacing.xs }}>
          {t('form.title', { defaultValue: 'Apply for leave' })}
        </Text>

        <ScrollView
          contentContainerStyle={{ gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl * 3 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormSection title={t('form.sections.type', { defaultValue: 'Type & dates' })}>
            <FormSelect control={control} name="leave_type" label={t('field.leaveType', { defaultValue: 'Leave type' })} options={LEAVE_TYPE_OPTIONS} />
            <FormDatePicker control={control} name="start_date" label={t('field.startDate', { defaultValue: 'Start date' })} minDate={today} />
            <FormDatePicker control={control} name="end_date" label={t('field.endDate', { defaultValue: 'End date' })} minDate={new Date(startDate)} />
            {isSingleDay ? (
              <FormSelect control={control} name="half_day" label={t('field.halfDay', { defaultValue: 'Day part' })} options={HALF_DAY_OPTIONS} />
            ) : null}
          </FormSection>

          <FormSection title={t('form.sections.reason', { defaultValue: 'Reason' })}>
            <FormField
              control={control}
              name="reason"
              label={t('field.reason', { defaultValue: 'Reason' })}
              placeholder={t('field.reasonPlaceholder', { defaultValue: 'Describe the reason for leave' })}
            />
          </FormSection>
        </ScrollView>

        <View style={{ paddingVertical: spacing.lg, backgroundColor: palette.surface }}>
          <Button variant="primary" fullWidth loading={createMutation.isPending} onPress={handleSubmit(onSubmit)}>
            {t('form.submit', { defaultValue: 'Submit request' })}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
