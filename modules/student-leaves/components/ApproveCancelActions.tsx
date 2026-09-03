// client/modules/student-leaves/components/ApproveCancelActions.tsx
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/common/components/Button';
import { useTheme } from '@/common/theme';
import { useApproveCancelStudentLeave, useRejectCancelStudentLeave } from '../hooks/useStudentLeaves';
import { useToast } from '@/common/feedback';

type Props = { leaveId: string };

export function ApproveCancelActions({ leaveId }: Props) {
  const { t } = useTranslation('studentLeaves');
  const toast = useToast();
  const { spacing } = useTheme();
  const approveMutation = useApproveCancelStudentLeave();
  const rejectMutation = useRejectCancelStudentLeave();

  const onApprove = async () => {
    try {
      await approveMutation.mutateAsync(leaveId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Try again';
      toast.error(message);
    }
  };

  const onReject = async () => {
    try {
      await rejectMutation.mutateAsync(leaveId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Try again';
      toast.error(message);
    }
  };

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <View style={{ flex: 1 }}>
        <Button variant="ghost" fullWidth loading={rejectMutation.isPending} onPress={onReject}>
          {t('actions.keepActive', { defaultValue: 'Keep leave active' })}
        </Button>
      </View>
      <View style={{ flex: 1 }}>
        <Button variant="primary" fullWidth loading={approveMutation.isPending} onPress={onApprove}>
          {t('actions.approveCancellation', { defaultValue: 'Approve cancellation' })}
        </Button>
      </View>
    </View>
  );
}
