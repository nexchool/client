// client/modules/student-leaves/screens/StudentLeaveDetailScreen.tsx
import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Skeleton } from '@/common/components/Skeleton';
import { Button } from '@/common/components/Button';
import { DetailCard } from '@/common/components/DetailCard';
import { DetailRow } from '@/common/components/DetailRow';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useStudentLeave, useRequestCancelStudentLeave } from '../hooks/useStudentLeaves';
import { CancelRequestSheet } from '../components/CancelRequestSheet';
import { ApproveLeaveActions } from '../components/ApproveLeaveActions';
import { ApproveCancelActions } from '../components/ApproveCancelActions';
import { statusAccent } from '../constants';

const STATUS_LABEL: Record<string, string> = {
  pending_class_teacher: 'Pending teacher',
  pending_admin: 'Pending admin',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export default function StudentLeaveDetailScreen() {
  const { t } = useTranslation('studentLeaves');
  const { palette, spacing, radius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isStudent, isTeacher, isAdmin } = useUiRole();
  const detail = useStudentLeave(id);
  const cancelMutation = useRequestCancelStudentLeave();
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);

  if (detail.isLoading || !detail.data) {
    return (
      <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
        <Skeleton width="100%" height={400} radius={radius.lg} />
      </View>
    );
  }

  const leave = detail.data;
  const accent = statusAccent(leave.status);
  const canApproveLeave =
    (isTeacher || isAdmin) &&
    (leave.status === 'pending_class_teacher' || leave.status === 'pending_admin');
  const canApproveCancel = (isTeacher || isAdmin) && !!leave.cancel_requested_at;
  const canRequestCancel =
    isStudent && !leave.cancel_requested_at && leave.status !== 'cancelled' && leave.status !== 'rejected';

  const dateRange = `${leave.start_date} – ${leave.end_date}${
    leave.half_day ? ` (${leave.half_day.toUpperCase()})` : ''
  }`;

  const handleRequestCancel = async (reason: string) => {
    try {
      await cancelMutation.mutateAsync({ id: leave.id, reason });
      setCancelSheetVisible(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Try again';
      Alert.alert(t('cancel.error', { defaultValue: 'Could not submit' }), message);
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
      <AppIcon
        name="arrow-back"
        size="lg"
        color="onSurface"
        onPress={() => router.back()}
        accessibilityLabel={t('back', { defaultValue: 'Back' })}
      />

      <ScrollView
        contentContainerStyle={{ gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.scrollBottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Heading + status pill */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
          <Text variant="display" color="onSurface" style={{ flex: 1, textTransform: 'capitalize' }}>
            {leave.leave_type} {t('detail.leaveSuffix', { defaultValue: 'leave' })}
          </Text>
          <View
            style={{
              backgroundColor: palette.surfaceContainer,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: radius.full,
            }}
          >
            <Text variant="labelSm" color={accent}>
              {STATUS_LABEL[leave.status] ?? leave.status}
            </Text>
          </View>
        </View>

        <DetailCard title={t('detail.cardTitle', { defaultValue: 'Leave details' })} accent={accent}>
          <DetailRow icon="calendar-outline" label={t('detail.dates', { defaultValue: 'Dates' })} value={dateRange} />
          <DetailRow icon="document-text-outline" label={t('detail.reason', { defaultValue: 'Reason' })} value={leave.reason} />
          {leave.decided_by_name ? (
            <DetailRow
              icon="person-outline"
              label={t('detail.decidedBy', { defaultValue: 'Decided by' })}
              value={leave.decided_by_name}
            />
          ) : null}
        </DetailCard>

        {leave.rejection_reason ? (
          <View style={{ backgroundColor: `${palette.error}22`, padding: spacing.md, borderRadius: radius.lg }}>
            <Text variant="labelSm" color="error">
              {t('detail.rejectedReason', { defaultValue: 'Rejected:' })}
            </Text>
            <Text variant="bodyMd" color="error">
              {leave.rejection_reason}
            </Text>
          </View>
        ) : null}

        {leave.cancel_requested_at ? (
          <View style={{ backgroundColor: `${palette.warning}22`, padding: spacing.md, borderRadius: radius.lg }}>
            <Text variant="bodyMd" color="warning">
              {t('detail.cancelPending', { defaultValue: 'Cancellation is awaiting class teacher review.' })}
            </Text>
            {leave.cancel_requested_reason ? (
              <Text variant="labelSm" color="warning" style={{ marginTop: spacing.xs }}>
                {leave.cancel_requested_reason}
              </Text>
            ) : null}
          </View>
        ) : null}

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
    </View>
  );
}
