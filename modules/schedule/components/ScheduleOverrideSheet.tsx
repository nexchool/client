import React, { useEffect, useMemo } from 'react';
import { Alert, Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/common/components/Text';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Button } from '@/common/components/Button';
import { FormField, FormSelect, FormDatePicker, type SelectOption } from '@/common/forms';
import { useTeachers } from '@/modules/teachers/hooks/useTeachers';
import { scheduleOverrideSchema, type ScheduleOverrideInput } from '../validation/schemas';
import { useCreateScheduleOverride } from '../hooks/useScheduleOverride';

type Props = {
  visible: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultSlotId?: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ScheduleOverrideSheet({ visible, onClose, defaultDate, defaultSlotId }: Props) {
  const { t } = useTranslation('schedule');
  const { palette, spacing, radius } = useTheme();
  const { teachers, fetchTeachers } = useTeachers();
  const createMutation = useCreateScheduleOverride();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { isSubmitting },
  } = useForm<ScheduleOverrideInput>({
    resolver: zodResolver(scheduleOverrideSchema),
    defaultValues: {
      override_type: 'cancelled',
      override_date: defaultDate ?? todayIso(),
      slot_id: defaultSlotId ?? '',
      reason: '',
    } as ScheduleOverrideInput,
  });

  const overrideType = watch('override_type');

  useEffect(() => {
    if (visible) {
      fetchTeachers();
      reset({
        override_type: 'cancelled',
        override_date: defaultDate ?? todayIso(),
        slot_id: defaultSlotId ?? '',
        reason: '',
      } as ScheduleOverrideInput);
    }
  }, [visible, defaultDate, defaultSlotId, fetchTeachers, reset]);

  const typeOptions: SelectOption[] = [
    {
      value: 'cancelled',
      label: t('override.type.cancelled', { defaultValue: 'Cancelled' }),
    },
    {
      value: 'substitute',
      label: t('override.type.substitute', { defaultValue: 'Substitute teacher' }),
    },
    {
      value: 'activity',
      label: t('override.type.activity', { defaultValue: 'Activity / event' }),
    },
  ];

  const teacherOptions: SelectOption[] = useMemo(
    () =>
      teachers.map((tch) => ({
        value: tch.id,
        label: tch.name || tch.email || tch.id,
      })),
    [teachers]
  );

  const onSubmit = async (values: ScheduleOverrideInput) => {
    try {
      await createMutation.mutateAsync(values);
      Alert.alert(
        t('override.savedTitle', { defaultValue: 'Override saved' }),
        t('override.savedMessage', { defaultValue: 'The schedule override has been saved.' })
      );
      onClose();
    } catch (err: any) {
      const details = err?.data?.error?.details;
      if (Array.isArray(details) && details.length > 0) {
        for (const d of details) {
          if (d?.field) {
            setError(d.field as any, { type: 'server', message: String(d.issue ?? d.message ?? 'Invalid') });
          }
        }
      } else {
        Alert.alert(
          t('override.errorTitle', { defaultValue: 'Could not save override' }),
          err?.message ?? 'Unknown error'
        );
      }
    }
  };

  const sheetMaxHeight = Dimensions.get('window').height * 0.85;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: 'rgba(11, 28, 48, 0.40)' }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.lg,
            paddingBottom: spacing.xl,
            maxHeight: sheetMaxHeight,
          },
        ]}
      >
        <View
          style={{
            alignSelf: 'center',
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: palette.outlineVariant,
            marginBottom: spacing.md,
          }}
        />
        <Text variant="headlineMd" color="onSurface">
          {t('override.title', { defaultValue: 'Override period' })}
        </Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: spacing.md, gap: spacing.md }}
          keyboardShouldPersistTaps="handled"
        >
          <FormSelect
            control={control}
            name="override_type"
            label={t('override.fields.type', { defaultValue: 'Override type' })}
            options={typeOptions}
          />

          <FormField
            control={control}
            name="slot_id"
            label={t('override.fields.slot', { defaultValue: 'Class period' })}
            placeholder="Slot ID"
            helper={t('override.fields.slotHelper', {
              defaultValue: 'Tap the period card on the schedule grid to pre-fill this',
            })}
          />

          <FormDatePicker
            control={control}
            name="override_date"
            label={t('override.fields.date', { defaultValue: 'Date' })}
            minDate={new Date()}
          />

          {overrideType === 'substitute' ? (
            <FormSelect
              control={control}
              name={'substitute_teacher_id' as any}
              label={t('override.fields.substituteTeacher', { defaultValue: 'Substitute teacher' })}
              options={teacherOptions}
            />
          ) : null}

          {overrideType === 'activity' ? (
            <FormField
              control={control}
              name={'activity_note' as any}
              label={t('override.fields.activityNote', { defaultValue: 'Activity description' })}
              placeholder="e.g., Annual sports day rehearsal"
            />
          ) : null}

          <FormField
            control={control}
            name="reason"
            label={t('override.fields.reason', { defaultValue: 'Reason (optional)' })}
            placeholder="Internal note (not visible to students)"
          />
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button variant="ghost" fullWidth onPress={onClose}>
              {t('override.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button
              variant="primary"
              fullWidth
              loading={isSubmitting || createMutation.isPending}
              onPress={handleSubmit(onSubmit)}
            >
              {t('override.save', { defaultValue: 'Save override' })}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
