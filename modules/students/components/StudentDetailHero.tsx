import React from 'react';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Student } from '../types';

const AVATAR = 112;

/** Hero: cover band, large centered avatar (photo or initial), name, class·roll subline, status pill. */
export function StudentDetailHero({ student }: { student: Student }) {
  const { t } = useTranslation('students');
  const { palette, spacing, radius, elevation } = useTheme();

  const initial = (student.name?.trim()?.[0] ?? '?').toUpperCase();
  const subParts: string[] = [];
  if (student.class_name) subParts.push(student.class_name);
  if (student.roll_number != null) subParts.push(`${t('detail.rollNumber')}: ${student.roll_number}`);
  const subline = subParts.join('  ·  ');

  return (
    <View
      style={[
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.lg,
          marginBottom: spacing.lg,
          overflow: 'hidden',
        },
        elevation.card,
      ]}
    >
      {/* Cover band */}
      <View style={{ height: 88, backgroundColor: palette.surfaceContainerHighest }} />

      <View style={{ alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
        <View
          style={{
            width: AVATAR,
            height: AVATAR,
            borderRadius: radius.full,
            marginTop: -AVATAR / 2,
            borderWidth: 4,
            borderColor: palette.surfaceContainerLowest,
            backgroundColor: palette.primaryContainer,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {student.profile_picture ? (
            <Image
              source={{ uri: student.profile_picture }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <Text variant="display" color="onPrimaryContainer">
              {initial}
            </Text>
          )}
        </View>

        <Text variant="headlineLg" color="onSurface" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
          {student.name}
        </Text>
        {subline ? (
          <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
            {subline}
          </Text>
        ) : null}

        {student.student_status ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.full,
                backgroundColor: palette.surfaceContainer,
              }}
            >
              <AppIcon name="ellipse" size="sm" color="primary" />
              <Text variant="labelSm" color="onSurface">
                {student.student_status}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
