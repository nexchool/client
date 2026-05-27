// client/modules/student-leaves/components/ApproveCancelActions.tsx
import React from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/common/components/Button';
import { useTheme } from '@/common/theme';
import { useApproveCancelStudentLeave, useRejectCancelStudentLeave } from '../hooks/useStudentLeaves';

type Props = { leaveId: string };

export function ApproveCancelActions({ leaveId }: Props) {
  const { t } = useTranslation('studentLeaves');
  const { spacing } = useTheme();
  const approveMutation = useApproveCancelStudentLeave();
  const rejectMutation = useRejectCancelStudentLeave();

  const onApprove = async () => {
    try {
      await approveMutation.mutateAsync(leaveId);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      Alert.alert(t('actions.error', { defaultValue: 'Action failed' }), e?.message ?? 'Try again');
    }
  };

  const onReject = async () => {
    try {
      await rejectMutation.mutateAsync(leaveId);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      Alert.alert(t('actions.error', { defaultValue: 'Action failed' }), e?.message ?? 'Try again');
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
