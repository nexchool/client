import React from 'react';
import { Image, Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { PressScale } from '@/common/components/PressScale';
import { AppIcon } from '@/common/components/AppIcon';
import { Teacher } from '../types';

const AVATAR = 112;

interface Props {
  teacher: Teacher;
  canUpdate: boolean;
  onEdit: () => void;
}

/** Hero: cover band, large centered avatar (photo or initial), name, department subline,
 *  status pill, and real action buttons (edit + tap-to-call). */
export function TeacherDetailHero({ teacher, canUpdate, onEdit }: Props) {
  const { t } = useTranslation('teachers');
  const { palette, spacing, radius, elevation } = useTheme();

  const initial = (teacher.name?.trim()?.[0] ?? '?').toUpperCase();

  const subParts: string[] = [];
  if (teacher.designation) subParts.push(teacher.designation);
  if (teacher.department) subParts.push(teacher.department);
  const subline = subParts.join('  ·  ');

  const phone = teacher.phone?.trim();

  const handleCall = () => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

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
          {teacher.profile_picture ? (
            <Image
              source={{ uri: teacher.profile_picture }}
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
          {teacher.name}
        </Text>
        {subline ? (
          <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
            {subline}
          </Text>
        ) : null}

        {teacher.status ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              marginTop: spacing.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radius.full,
              backgroundColor: palette.surfaceContainer,
            }}
          >
            <AppIcon name="ellipse" size="sm" color="primary" />
            <Text variant="labelSm" color="onSurface">
              {t(`status.${teacher.status.toLowerCase()}`, { defaultValue: teacher.status })}
            </Text>
          </View>
        ) : null}

        {/* Real actions: edit (perm-gated) + tap-to-call (if phone exists) */}
        {(canUpdate || phone) ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            {canUpdate ? (
              <PressScale
                onPress={onEdit}
                accessibilityLabel={t('detail.editTeacher')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.md,
                  backgroundColor: palette.primary,
                }}
              >
                <AppIcon name="pencil" size="sm" color="onPrimary" />
                <Text variant="labelMd" color="onPrimary">
                  {t('detail.edit')}
                </Text>
              </PressScale>
            ) : null}
            {phone ? (
              <PressScale
                onPress={handleCall}
                accessibilityLabel={t('detail.call')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.md,
                  backgroundColor: palette.primaryContainer,
                }}
              >
                <AppIcon name="call" size="sm" color="onPrimaryContainer" />
                <Text variant="labelMd" color="onPrimaryContainer">
                  {t('detail.call')}
                </Text>
              </PressScale>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
