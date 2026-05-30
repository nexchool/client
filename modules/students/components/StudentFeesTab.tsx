import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import type { Palette } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { Skeleton } from '@/common/components/Skeleton';
import { formatCurrency } from '@/common/utils/formatCurrency';
import { useStudentFees } from '@/modules/finance/hooks/useFinance';
import type { StudentFee } from '@/modules/finance/types';

const STATUS_ACCENT: Record<StudentFee['status'], keyof Palette> = {
  paid: 'success',
  partial: 'warning',
  unpaid: 'onSurfaceVariant',
  overdue: 'error',
};

/** Fees tab. Real data via useStudentFees({ student_id }). Admin-gated by caller. */
export function StudentFeesTab({ studentId }: { studentId: string }) {
  const { t } = useTranslation('students');
  const { palette, spacing, radius, elevation } = useTheme();
  const { data, isLoading, isError } = useStudentFees({ student_id: studentId });

  if (isLoading) {
    return <Skeleton width="100%" height={160} radius={radius.lg} />;
  }

  if (isError) {
    return (
      <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
        <Text variant="bodyMd" color="onSurfaceVariant">
          {t('detail.feesError')}
        </Text>
      </View>
    );
  }

  const fees = data ?? [];
  if (fees.length === 0) {
    return (
      <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
        <Text variant="bodyMd" color="onSurfaceVariant">
          {t('detail.noFees')}
        </Text>
      </View>
    );
  }

  return (
    <>
      {fees.map((fee) => {
        const outstanding = Number(fee.total_amount) - Number(fee.paid_amount);
        return (
          <View
            key={fee.id}
            style={[
              {
                backgroundColor: palette.surfaceContainerLowest,
                borderRadius: radius.lg,
                padding: spacing.lg,
                marginBottom: spacing.md,
              },
              elevation.card,
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.sm,
              }}
            >
              <Text variant="labelLg" color="onSurface" style={{ flex: 1 }}>
                {fee.fee_structure_name ?? t('detail.feeStructure')}
              </Text>
              <View
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.full,
                  backgroundColor: palette.surfaceContainer,
                }}
              >
                <Text variant="labelSm" color={STATUS_ACCENT[fee.status]}>
                  {t(`detail.feeStatus.${fee.status}`)}
                </Text>
              </View>
            </View>
            <FeeLine label={t('detail.feeTotal')} value={formatCurrency(fee.total_amount)} />
            <FeeLine label={t('detail.feePaid')} value={formatCurrency(fee.paid_amount)} />
            <FeeLine label={t('detail.feeOutstanding')} value={formatCurrency(outstanding)} />
            {fee.due_date ? <FeeLine label={t('detail.feeDueDate')} value={fee.due_date} /> : null}
          </View>
        );
      })}
    </>
  );
}

function FeeLine({ label, value }: { label: string; value: string }) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.xs,
      }}
    >
      <Text variant="bodyMd" color="onSurfaceVariant">
        {label}
      </Text>
      <Text variant="labelMd" color="onSurface">
        {value}
      </Text>
    </View>
  );
}
