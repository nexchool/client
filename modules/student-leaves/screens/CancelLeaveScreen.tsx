// client/modules/student-leaves/screens/CancelLeaveScreen.tsx
import React from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';
import { PageHeader } from '@/common/components/PageHeader';
import { FormSection, FormTextArea } from '@/common/forms';
import { useDialog, useToast } from '@/common/feedback';
import { useRequestCancelStudentLeave } from '../hooks/useStudentLeaves';
import {
  cancelStudentLeaveSchema,
  type CancelStudentLeaveInput,
} from '../validation/schemas';

/**
 * Asking to call off a leave already filed.
 *
 * A screen rather than the bottom sheet this replaces: everywhere else in the
 * app, anything a person types into is its own route, with a back chevron, a
 * Cancel link and a discard prompt. A sheet here made one form in the product
 * behave unlike all the others.
 */
export default function CancelLeaveScreen() {
  const { t } = useTranslation('studentLeaves');
  const { confirm } = useDialog();
  const toast = useToast();
  const { spacing, palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cancelMutation = useRequestCancelStudentLeave();

  const { control, handleSubmit, formState } = useForm<CancelStudentLeaveInput>({
    resolver: zodResolver(cancelStudentLeaveSchema),
    defaultValues: { reason: '' },
  });

  const handleBack = React.useCallback(async () => {
    if (formState.isDirty) {
      const discard = await confirm({
        title: t('cancelScreen.discardTitle', { defaultValue: 'Discard request?' }),
        description: t('discard.body', { defaultValue: 'Your unsaved request will be lost.' }),
        tone: 'danger',
        confirmLabel: t('discard.confirm', { defaultValue: 'Discard' }),
        cancelLabel: t('discard.cancel', { defaultValue: 'Keep editing' }),
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

  const onSubmit = async (data: CancelStudentLeaveInput) => {
    if (!id) return;
    try {
      await cancelMutation.mutateAsync({ id, reason: data.reason });
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('cancel.error', { defaultValue: 'Could not submit' });
      toast.error(message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={20}
    >
      <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile }}>
        <PageHeader
          title={t('cancel.title', { defaultValue: 'Request cancellation' })}
          onBack={handleBack}
          backLabel={t('back', { defaultValue: 'Back' })}
          right={<Link onPress={handleBack}>{t('cancel', { defaultValue: 'Cancel' })}</Link>}
          noHorizontalPadding
          divider={false}
        />

        <ScrollView
          contentContainerStyle={{ gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.scrollBottom }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text variant="bodyMd" color="onSurfaceVariant">
            {t('cancel.body', {
              defaultValue: 'Your class teacher will be asked to approve the cancellation.',
            })}
          </Text>

          <FormSection title={t('cancel.reasonLabel', { defaultValue: 'Reason for cancellation' })}>
            <FormTextArea
              control={control}
              name="reason"
              label={t('cancel.reasonLabel', { defaultValue: 'Reason for cancellation' })}
              placeholder={t('cancel.reasonPlaceholder', { defaultValue: 'Plans changed' })}
            />
          </FormSection>
        </ScrollView>

        <View style={{ paddingVertical: spacing.lg, backgroundColor: palette.surface }}>
          <Button
            variant="primary"
            fullWidth
            loading={cancelMutation.isPending}
            onPress={handleSubmit(onSubmit)}
          >
            {t('cancel.submit', { defaultValue: 'Send request' })}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
