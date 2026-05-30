import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '@/modules/auth/context/AuthContext';
import { Student } from '../types';
import { DetailCard } from '@/common/components/DetailCard';
import { DetailRow } from '@/common/components/DetailRow';
import { StudentDocumentsSection } from './StudentDocumentsSection';

interface Row {
  icon: React.ComponentProps<typeof DetailRow>['icon'];
  label: string;
  value?: string | number | null;
}

/** Info tab: only renders rows/cards that have real values on the detail response. */
export function StudentInfoTab({ student }: { student: Student }) {
  const { t } = useTranslation('students');
  const { isFeatureEnabled } = useAuthContext();

  const personal: Row[] = [
    { icon: 'card-outline', label: t('detail.admissionNumber'), value: student.admission_number },
    { icon: 'calendar-outline', label: t('detail.dateOfBirth'), value: student.date_of_birth },
    { icon: 'male-female-outline', label: t('detail.gender'), value: student.gender },
    { icon: 'water-outline', label: t('detail.bloodGroup'), value: student.blood_group },
    { icon: 'call-outline', label: t('detail.phone'), value: student.phone },
    { icon: 'mail-outline', label: t('detail.email'), value: student.email },
    { icon: 'home-outline', label: t('detail.address'), value: student.address },
  ];

  const identity: Row[] = [
    { icon: 'finger-print-outline', label: t('detail.aadharNumber'), value: student.aadhar_number },
    { icon: 'id-card-outline', label: t('detail.apaarId'), value: student.apaar_id },
    { icon: 'book-outline', label: t('detail.religion'), value: student.religion },
    { icon: 'people-outline', label: t('detail.category'), value: student.category },
    { icon: 'flag-outline', label: t('detail.nationality'), value: student.nationality },
    { icon: 'language-outline', label: t('detail.motherTongue'), value: student.mother_tongue },
    { icon: 'location-outline', label: t('detail.placeOfBirth'), value: student.place_of_birth },
  ];

  const health: Row[] = [
    { icon: 'resize-outline', label: t('detail.heightCm'), value: student.height_cm },
    { icon: 'barbell-outline', label: t('detail.weightKg'), value: student.weight_kg },
    { icon: 'alert-circle-outline', label: t('detail.medicalAllergies'), value: student.medical_allergies },
    { icon: 'medkit-outline', label: t('detail.medicalConditions'), value: student.medical_conditions },
    { icon: 'accessibility-outline', label: t('detail.disabilityDetails'), value: student.disability_details },
    { icon: 'eye-outline', label: t('detail.identificationMarks'), value: student.identification_marks },
  ];

  const emergency: Row[] = [
    { icon: 'person-outline', label: t('detail.emergencyName'), value: student.emergency_contact_name },
    { icon: 'git-branch-outline', label: t('detail.emergencyRelationship'), value: student.emergency_contact_relationship },
    { icon: 'call-outline', label: t('detail.emergencyPhone'), value: student.emergency_contact_phone },
    { icon: 'call-outline', label: t('detail.emergencyAltPhone'), value: student.emergency_contact_alt_phone },
  ];

  const academic: Row[] = [
    { icon: 'school-outline', label: t('detail.academicYear'), value: student.academic_year },
    { icon: 'calendar-number-outline', label: t('detail.admissionDate'), value: student.admission_date },
    { icon: 'business-outline', label: t('detail.previousSchoolName'), value: student.previous_school_name },
    { icon: 'ribbon-outline', label: t('detail.lastSchoolBoard'), value: student.last_school_board },
    { icon: 'document-text-outline', label: t('detail.tcNumber'), value: student.tc_number },
    { icon: 'home-outline', label: t('detail.houseName'), value: student.house_name },
  ];

  const tr = student.transport;
  const transport: Row[] = isFeatureEnabled('transport') && tr
    ? [
        { icon: 'bus-outline', label: t('detail.transportBus'), value: tr.bus?.bus_number },
        { icon: 'map-outline', label: t('detail.transportRoute'), value: tr.route?.name },
        { icon: 'enter-outline', label: t('detail.transportPickup'), value: tr.pickup_stop?.name ?? tr.pickup_point },
        { icon: 'exit-outline', label: t('detail.transportDrop'), value: tr.drop_stop?.name ?? tr.drop_point },
        { icon: 'person-outline', label: t('detail.transportDriver'), value: tr.driver?.name },
      ]
    : [];

  return (
    <>
      <DetailCardSection title={t('detail.personalDetails')} rows={personal} accent="secondaryContainer" />
      <DetailCardSection title={t('detail.identityInfo')} rows={identity} accent="tertiaryContainer" />
      <DetailCardSection title={t('detail.healthInfo')} rows={health} accent="errorContainer" />
      <DetailCardSection title={t('detail.emergencyInfo')} rows={emergency} accent="primaryContainer" />
      <DetailCardSection title={t('detail.academicInfo')} rows={academic} accent="secondaryContainer" />
      <DetailCardSection title={t('detail.transportInfo')} rows={transport} accent="tertiaryContainer" />
      <StudentDocumentsSection studentId={student.id} />
    </>
  );
}

function DetailCardSection({
  title,
  rows,
  accent,
}: {
  title: string;
  rows: Row[];
  accent: React.ComponentProps<typeof DetailCard>['accent'];
}) {
  const visible = rows.filter((r) => r.value != null && String(r.value).trim() !== '');
  if (visible.length === 0) return null;
  return (
    <DetailCard title={title} accent={accent}>
      {visible.map((r, i) => (
        <DetailRow key={`${r.label}-${i}`} icon={r.icon} label={r.label} value={String(r.value)} />
      ))}
    </DetailCard>
  );
}
