import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';
import { Skeleton } from '@/common/components/Skeleton';
import { useStudents } from '../hooks/useStudents';
import { usePermissions } from '@/modules/permissions/hooks/usePermissions';
import * as PERMS from '@/modules/permissions/constants/permissions';
import { StudentDetailHero } from '../components/StudentDetailHero';
import { DetailTabs, type TabItem } from '@/common/components/DetailTabs';
import { PageHeader } from '@/common/components/PageHeader';
import { StudentInfoTab } from '../components/StudentInfoTab';
import { StudentParentsTab } from '../components/StudentParentsTab';
import { StudentFeesTab } from '../components/StudentFeesTab';
import { useDialog, useToast } from '@/common/feedback';

export default function StudentDetailScreen() {
  const { t } = useTranslation('students');
  const { confirm } = useDialog();
  const toast = useToast();
  const { palette, spacing, radius, elevation } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentStudent, loading, fetchStudent, deleteStudent } = useStudents();
  const { hasPermission, hasAnyPermission } = usePermissions();

  const canUpdate = hasPermission(PERMS.STUDENT_UPDATE);
  const canDelete = hasPermission(PERMS.STUDENT_DELETE);
  const canViewFees = hasAnyPermission([PERMS.FINANCE_READ, PERMS.FEE_READ_ALL]);

  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (id) {
      fetchStudent(id);
    }
  }, [id]);

  const tabs = useMemo<TabItem[]>(() => {
    const items: TabItem[] = [
      { key: 'info', label: t('detail.tabInfo') },
      { key: 'parents', label: t('detail.tabParents') },
    ];
    if (canViewFees) items.push({ key: 'fees', label: t('detail.tabFees') });
    return items;
  }, [canViewFees, t]);

  const handleBack = () => router.back();

  const confirmDelete = useCallback(async () => {
    if (!currentStudent) return;
    const remove = await confirm({
      title: t('detail.deleteConfirmTitle'),
      description: t('detail.deleteConfirmMessage'),
      tone: 'danger',
      confirmLabel: t('detail.delete'),
      cancelLabel: t('detail.cancel'),
    });
    if (!remove) return;
    try {
      await deleteStudent(currentStudent.id);
      router.replace('/students' as never);
    } catch (e: unknown) {
      // A failed delete leaves the student on screen; there is nothing to
      // decide about it, so it reports rather than interrupts.
      toast.error(e instanceof Error ? e.message : t('detail.deleteFailed'));
    }
  }, [currentStudent, deleteStudent, router, t, confirm, toast]);

  const goEdit = () =>
    router.push({
      pathname: '/(protected)/students/[id]/edit',
      params: { id: id ?? '' },
    } as never);

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      {/* Header */}
      <PageHeader
        title={t('detail.title')}
        onBack={handleBack}
        backLabel={t('detail.goBack')}
        right={
          canDelete ? (
            <AppIcon name="trash-outline" size="lg" color="error" onPress={confirmDelete} />
          ) : null
        }
      />

      {loading && !currentStudent ? (
        <View style={{ padding: spacing.marginMobile, gap: spacing.lg }}>
          <Skeleton width="100%" height={220} radius={radius.lg} />
          <Skeleton width="100%" height={160} radius={radius.lg} />
        </View>
      ) : !currentStudent ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text variant="bodyLg" color="error" style={{ marginBottom: spacing.lg, textAlign: 'center' }}>
            {t('detail.notFound')}
          </Text>
          <PressScale
            onPress={handleBack}
            style={{
              backgroundColor: palette.primary,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              borderRadius: radius.md,
            }}
          >
            <Text variant="labelLg" color="onPrimary">
              {t('detail.goBack')}
            </Text>
          </PressScale>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.marginMobile,
              paddingTop: spacing.lg,
              paddingBottom: 96,
            }}
            showsVerticalScrollIndicator={false}
          >
            <StudentDetailHero student={currentStudent} />
            <DetailTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {activeTab === 'info' && <StudentInfoTab student={currentStudent} />}
            {activeTab === 'parents' && <StudentParentsTab student={currentStudent} />}
            {activeTab === 'fees' && canViewFees && <StudentFeesTab studentId={currentStudent.id} />}
          </ScrollView>

          {canUpdate ? (
            <PressScale
              onPress={goEdit}
              accessibilityLabel={t('detail.editStudent')}
              style={[
                {
                  position: 'absolute',
                  right: spacing.marginMobile,
                  bottom: spacing.lg,
                  width: 56,
                  height: 56,
                  borderRadius: radius.full,
                  backgroundColor: palette.primaryContainer,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                elevation.modal,
              ]}
            >
              <AppIcon name="pencil" size="lg" color="onPrimaryContainer" />
            </PressScale>
          ) : null}
        </>
      )}
    </View>
  );
}
