import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { Student } from '../types';
import { DetailCard } from './DetailCard';
import { DetailRow } from './DetailRow';

interface Row {
  icon: React.ComponentProps<typeof DetailRow>['icon'];
  label: string;
  value?: string | number | null;
}

/** Parents / guardian tab. Renders only the parent blocks that have real data. */
export function StudentParentsTab({ student }: { student: Student }) {
  const { t } = useTranslation('students');
  const { spacing } = useTheme();

  const father: Row[] = [
    { icon: 'person-outline', label: t('detail.fatherName'), value: student.father_name },
    { icon: 'call-outline', label: t('detail.fatherPhone'), value: student.father_phone },
    { icon: 'mail-outline', label: t('detail.fatherEmail'), value: student.father_email },
    { icon: 'briefcase-outline', label: t('detail.fatherOccupation'), value: student.father_occupation },
    { icon: 'cash-outline', label: t('detail.fatherAnnualIncome'), value: student.father_annual_income },
  ];

  const mother: Row[] = [
    { icon: 'person-outline', label: t('detail.motherName'), value: student.mother_name },
    { icon: 'call-outline', label: t('detail.motherPhone'), value: student.mother_phone },
    { icon: 'mail-outline', label: t('detail.motherEmail'), value: student.mother_email },
    { icon: 'briefcase-outline', label: t('detail.motherOccupation'), value: student.mother_occupation },
    { icon: 'cash-outline', label: t('detail.motherAnnualIncome'), value: student.mother_annual_income },
  ];

  const guardian: Row[] = [
    { icon: 'person-outline', label: t('detail.guardianName'), value: student.guardian_name },
    { icon: 'git-branch-outline', label: t('detail.relationship'), value: student.guardian_relationship },
    { icon: 'call-outline', label: t('detail.guardianPhone'), value: student.guardian_phone },
    { icon: 'mail-outline', label: t('detail.guardianEmail'), value: student.guardian_email },
  ];

  const hasFather = father.some((r) => valued(r.value));
  const hasMother = mother.some((r) => valued(r.value));
  const hasGuardian = guardian.some((r) => valued(r.value));

  if (!hasFather && !hasMother && !hasGuardian) {
    return (
      <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
        <Text variant="bodyMd" color="onSurfaceVariant">
          {t('detail.noParentInfo')}
        </Text>
      </View>
    );
  }

  return (
    <>
      {hasFather && <ParentCard title={t('detail.father')} rows={father} accent="secondaryContainer" />}
      {hasMother && <ParentCard title={t('detail.mother')} rows={mother} accent="tertiaryContainer" />}
      {hasGuardian && <ParentCard title={t('detail.guardianInfo')} rows={guardian} accent="primaryContainer" />}
    </>
  );
}

function valued(v?: string | number | null) {
  return v != null && String(v).trim() !== '';
}

function ParentCard({
  title,
  rows,
  accent,
}: {
  title: string;
  rows: Row[];
  accent: React.ComponentProps<typeof DetailCard>['accent'];
}) {
  const visible = rows.filter((r) => valued(r.value));
  return (
    <DetailCard title={title} accent={accent}>
      {visible.map((r, i) => (
        <DetailRow key={`${r.label}-${i}`} icon={r.icon} label={r.label} value={String(r.value)} />
      ))}
    </DetailCard>
  );
}
