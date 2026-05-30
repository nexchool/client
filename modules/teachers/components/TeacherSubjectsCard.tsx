import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { DetailCard } from '@/common/components/DetailCard';
import { TeacherSubjectItem } from '../types';

/** Subjects Taught card: real subjects[] from the detail response.
 *  Subject name + a code badge (subjects carry no grade/class field, so no grade badge). */
export function TeacherSubjectsCard({ subjects }: { subjects: TeacherSubjectItem[] }) {
  const { t } = useTranslation('teachers');
  const { palette, spacing, radius } = useTheme();

  if (!subjects || subjects.length === 0) return null;

  return (
    <DetailCard title={t('detail.subjectsTaught')} accent="tertiaryContainer">
      {subjects.map((subject) => (
        <View
          key={subject.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
          }}
        >
          <Text variant="bodyMd" color="onSurface" style={{ flex: 1 }}>
            {subject.name}
          </Text>
          {subject.code ? (
            <View
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: radius.full,
                backgroundColor: palette.tertiaryContainer,
              }}
            >
              <Text variant="labelSm" color="onTertiaryContainer">
                {subject.code}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
    </DetailCard>
  );
}
