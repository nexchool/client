// client/modules/student-leaves/components/ApproveLeaveActions.tsx
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Input } from '@/common/components/Input';
import { Button } from '@/common/components/Button';
import { useTheme } from '@/common/theme';
import { useApproveStudentLeave, useRejectStudentLeave } from '../hooks/useStudentLeaves';

type Props = { leaveId: string };

export function ApproveLeaveActions({ leaveId }: Props) {
  const { t } = useTranslation('studentLeaves');
  const { spacing } = useTheme();
  const approveMutation = useApproveStudentLeave();
  const rejectMutation = useRejectStudentLeave();
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(leaveId);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      Alert.alert(t('actions.error', { defaultValue: 'Action failed' }), e?.message ?? 'Try again');
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ id: leaveId, reason: reason.trim() });
      setReason('');
      setRejecting(false);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      Alert.alert(t('actions.error', { defaultValue: 'Action failed' }), e?.message ?? 'Try again');
    }
  };

  if (rejecting) {
    return (
      <View style={{ gap: spacing.md }}>
        <Input
          label={t('actions.rejectReason', { defaultValue: 'Reason for rejection' })}
          value={reason}
          onChangeText={setReason}
          placeholder={t('actions.rejectReasonPlaceholder', { defaultValue: 'Explain to the student' })}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button variant="ghost" fullWidth onPress={() => setRejecting(false)}>
              {t('actions.back', { defaultValue: 'Back' })}
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button variant="primary" fullWidth loading={rejectMutation.isPending} onPress={handleReject}>
              {t('actions.confirmReject', { defaultValue: 'Reject' })}
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <View style={{ flex: 1 }}>
        <Button variant="ghost" fullWidth onPress={() => setRejecting(true)}>
          {t('actions.reject', { defaultValue: 'Reject' })}
        </Button>
      </View>
      <View style={{ flex: 1 }}>
        <Button variant="primary" fullWidth loading={approveMutation.isPending} onPress={handleApprove}>
          {t('actions.approve', { defaultValue: 'Approve' })}
        </Button>
      </View>
    </View>
  );
}
