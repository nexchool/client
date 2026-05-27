// client/modules/student-leaves/screens/StudentLeaveDetailScreen.tsx
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Skeleton } from '@/common/components/Skeleton';
import { Button } from '@/common/components/Button';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useStudentLeave, useRequestCancelStudentLeave } from '../hooks/useStudentLeaves';
import { CancelRequestSheet } from '../components/CancelRequestSheet';
import { ApproveLeaveActions } from '../components/ApproveLeaveActions';
import { ApproveCancelActions } from '../components/ApproveCancelActions';

export default function StudentLeaveDetailScreen() {
  const { t } = useTranslation('studentLeaves');
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isStudent, isTeacher, isAdmin } = useUiRole();
  const detail = useStudentLeave(id);
  const cancelMutation = useRequestCancelStudentLeave();
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);

  if (detail.isLoading || !detail.data) {
    return (
      <ScreenContainer>
        <Skeleton width="100%" height={400} radius={16} />
      </ScreenContainer>
    );
  }

  const leave = detail.data;
  const canApproveLeave =
    (isTeacher || isAdmin) &&
    (leave.status === 'pending_class_teacher' || leave.status === 'pending_admin');
  const canApproveCancel = (isTeacher || isAdmin) && !!leave.cancel_requested_at;
  const canRequestCancel =
    isStudent && !leave.cancel_requested_at && leave.status !== 'cancelled' && leave.status !== 'rejected';

  const handleRequestCancel = async (reason: string) => {
    try {
      await cancelMutation.mutateAsync({ id: leave.id, reason });
      setCancelSheetVisible(false);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      Alert.alert(t('cancel.error', { defaultValue: 'Could not submit' }), e?.message ?? 'Try again');
    }
  };

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 44, height: 44, justifyContent: 'center' }}>
        <Ionicons name="chevron-back" size={24} color={palette.onSurface} />
      </Pressable>

      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: 120 }}>
        <View
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
              gap: spacing.md,
            },
          ]}
        >
          <Text style={[typography.display, { color: palette.onSurface, textTransform: 'capitalize' }]}>
            {leave.leave_type} {t('detail.leaveSuffix', { defaultValue: 'leave' })}
          </Text>
          <Text style={[typography.labelMd, { color: palette.onSurfaceVariant }]}>
            {leave.start_date} – {leave.end_date}
            {leave.half_day ? ` (${leave.half_day.toUpperCase()})` : ''}
          </Text>
          <Text style={[typography.bodyMd, { color: palette.onSurface }]}>{leave.reason}</Text>
          {leave.rejection_reason ? (
            <View style={{ backgroundColor: `${palette.error}22`, padding: spacing.md, borderRadius: radius.lg }}>
              <Text style={[typography.labelSm, { color: palette.error }]}>
                {t('detail.rejectedReason', { defaultValue: 'Rejected:' })}
              </Text>
              <Text style={[typography.bodyMd, { color: palette.error }]}>{leave.rejection_reason}</Text>
            </View>
          ) : null}
          {leave.cancel_requested_at ? (
            <View style={{ backgroundColor: `${palette.warning}22`, padding: spacing.md, borderRadius: radius.lg }}>
              <Text style={[typography.bodyMd, { color: palette.warning }]}>
                {t('detail.cancelPending', { defaultValue: 'Cancellation is awaiting class teacher review.' })}
              </Text>
              {leave.cancel_requested_reason ? (
                <Text style={[typography.labelSm, { color: palette.warning, marginTop: 4 }]}>
                  {leave.cancel_requested_reason}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {canApproveLeave ? <ApproveLeaveActions leaveId={leave.id} /> : null}
        {canApproveCancel ? <ApproveCancelActions leaveId={leave.id} /> : null}

        {canRequestCancel ? (
          <Button variant="ghost" fullWidth onPress={() => setCancelSheetVisible(true)}>
            {t('detail.requestCancel', { defaultValue: 'Request cancellation' })}
          </Button>
        ) : null}
      </ScrollView>

      <CancelRequestSheet
        visible={cancelSheetVisible}
        onClose={() => setCancelSheetVisible(false)}
        onSubmit={handleRequestCancel}
        loading={cancelMutation.isPending}
      />
    </ScreenContainer>
  );
}
