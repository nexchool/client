// client/modules/student-leaves/components/ApplicantCard.tsx
import React from 'react';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';
import { ProfileAvatar } from '@/common/components/ProfileAvatar';
import type { LeaveApplicant } from '../types';

type Props = {
  applicant: LeaveApplicant;
};

/**
 * Who applied, for somebody who has to decide.
 *
 * A principal at a trust has never met most of the children in it. Shown a
 * leave type, a date range and a reason, they have no way to place the
 * request — so this carries the things a school actually uses to recognise a
 * student, and the number to ring if something needs asking about.
 */
export function ApplicantCard({ applicant }: Props) {
  const { t } = useTranslation('studentLeaves');
  const { palette, spacing, radius, elevation } = useTheme();

  const subtitle = [applicant.class_name, applicant.campus_name, applicant.medium_name]
    .filter(Boolean)
    .join(' · ');

  const identifiers = [
    applicant.admission_number
      ? `${t('applicant.admissionNumber')} ${applicant.admission_number}`
      : null,
    applicant.roll_number != null
      ? `${t('applicant.rollNumber')} ${applicant.roll_number}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const phone = applicant.guardian_phone;

  return (
    <View
      style={[
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.md,
        },
        elevation.card,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <ProfileAvatar
          uri={applicant.profile_picture}
          name={applicant.display_name}
          size={48}
        />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="titleSm" color="onSurface">
            {applicant.display_name ?? '—'}
          </Text>
          {subtitle ? (
            <Text variant="labelSm" color="onSurfaceVariant">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {identifiers ? (
        <Text variant="labelSm" color="onSurfaceVariant">
          {identifiers}
        </Text>
      ) : null}

      {phone ? (
        <PressScale
          onPress={() => Linking.openURL(`tel:${phone}`)}
          accessibilityRole="button"
          accessibilityLabel={t('applicant.call')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: palette.surfaceContainer,
            borderRadius: radius.lg,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
          }}
        >
          <AppIcon name="call-outline" size="md" color="primary" />
          <View style={{ flex: 1 }}>
            <Text variant="labelSm" color="onSurfaceVariant">
              {applicant.guardian_name || t('applicant.guardian')}
            </Text>
            <Text variant="bodyMd" color="primary">
              {phone}
            </Text>
          </View>
        </PressScale>
      ) : null}
    </View>
  );
}
