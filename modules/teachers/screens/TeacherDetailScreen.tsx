import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, ActivityIndicator, Alert, Modal, FlatList, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';
import { Input } from '@/common/components/Input';
import { Button } from '@/common/components/Button';
import { DetailCard } from '@/common/components/DetailCard';
import { DetailRow } from '@/common/components/DetailRow';
import { useTeachers } from '../hooks/useTeachers';
import { useTeacherSubjects } from '../hooks/useTeacherSubjects';
import { useTeacherAvailability } from '../hooks/useTeacherAvailability';
import { useTeacherLeaves } from '@/modules/teacher-leaves/hooks/useTeacherLeaves';
import { useTeacherWorkload } from '../hooks/useTeacherWorkload';
import { usePermissions } from '@/modules/permissions/hooks/usePermissions';
import * as PERMS from '@/modules/permissions/constants/permissions';
import { TeacherLeave, TeacherAvailability } from '../types';
import { TeacherDetailHero } from '../components/TeacherDetailHero';
import { TeacherSubjectsCard } from '../components/TeacherSubjectsCard';

type TabKey = 'info' | 'subjects' | 'availability' | 'leaves' | 'workload';

export default function TeacherDetailScreen() {
  const { t } = useTranslation('teachers');
  const { palette, spacing, radius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentTeacher, loading, fetchTeacher, deleteTeacher } = useTeachers();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  const canUpdate = hasPermission(PERMS.TEACHER_UPDATE);
  const canDelete = hasPermission(PERMS.TEACHER_DELETE);
  const canManage = hasPermission(PERMS.TEACHER_MANAGE);
  const canLeaveManage = hasPermission(PERMS.TEACHER_LEAVE_MANAGE);

  const teacherId = id || '';

  const dayNames = useMemo(
    () => [
      '',
      t('detail.days.mon'),
      t('detail.days.tue'),
      t('detail.days.wed'),
      t('detail.days.thu'),
      t('detail.days.fri'),
      t('detail.days.sat'),
      t('detail.days.sun'),
    ],
    [t],
  );

  const TABS: { key: TabKey; label: string }[] = useMemo(
    () => [
      { key: 'info', label: t('detail.tabs.info') },
      { key: 'subjects', label: t('detail.tabs.subjects') },
      { key: 'availability', label: t('detail.tabs.availability') },
      { key: 'leaves', label: t('detail.tabs.leaves') },
      { key: 'workload', label: t('detail.tabs.workload') },
    ],
    [t],
  );

  // --- Subjects tab (managed subject expertise list) ---
  const { subjects: teacherSubjects, loading: subjectsLoading, fetchSubjects } = useTeacherSubjects(teacherId);

  // --- Availability tab ---
  const {
    availability,
    loading: availLoading,
    fetchAvailability,
    createSlot,
    deleteSlot,
  } = useTeacherAvailability(teacherId);
  const [showAvailModal, setShowAvailModal] = useState(false);
  const [availDay, setAvailDay] = useState('1');
  const [availPeriod, setAvailPeriod] = useState('1');
  const [availIsAvailable, setAvailIsAvailable] = useState(false);

  // --- Leaves tab ---
  const { leaves, loading: leavesLoading, fetchLeaves, approveLeave, rejectLeave } = useTeacherLeaves();

  // --- Workload tab ---
  const { workload, loading: workloadLoading, fetchWorkload, saveWorkload } = useTeacherWorkload(teacherId);
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);
  const [maxPerDay, setMaxPerDay] = useState('6');
  const [maxPerWeek, setMaxPerWeek] = useState('30');
  const [workloadSaving, setWorkloadSaving] = useState(false);

  useEffect(() => {
    if (id) fetchTeacher(id);
  }, [id]);

  // Load tab data on first visit
  const tabVisited = React.useRef<Partial<Record<TabKey, boolean>>>({});

  useEffect(() => {
    if (!teacherId) return;
    if (!tabVisited.current[activeTab]) {
      tabVisited.current[activeTab] = true;
      if (activeTab === 'subjects') fetchSubjects();
      if (activeTab === 'availability') fetchAvailability();
      if (activeTab === 'leaves') fetchLeaves({ teacher_id: teacherId });
      if (activeTab === 'workload') fetchWorkload();
    }
  }, [activeTab, teacherId]);

  const goEdit = () =>
    router.push({
      pathname: '/(protected)/teachers/[id]/edit',
      params: { id: id ?? '' },
    } as never);

  const handleDelete = () => {
    Alert.alert(t('detail.deleteConfirmTitle'), t('detail.deleteConfirmMessage'), [
      { text: t('detail.cancel'), style: 'cancel' },
      {
        text: t('detail.delete'),
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          try {
            await deleteTeacher(id);
            router.back();
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : t('detail.deleteFailed');
            Alert.alert(t('detail.errorTitle'), msg);
          }
        },
      },
    ]);
  };

  // --- Availability helpers ---
  const handleCreateAvail = async () => {
    try {
      await createSlot({
        day_of_week: parseInt(availDay, 10),
        period_number: parseInt(availPeriod, 10),
        available: availIsAvailable,
      });
      setShowAvailModal(false);
      setAvailDay('1');
      setAvailPeriod('1');
      setAvailIsAvailable(false);
    } catch (e: unknown) {
      Alert.alert(t('detail.errorTitle'), e instanceof Error ? e.message : t('detail.saveAvailError'));
    }
  };

  const handleDeleteAvail = (slot: TeacherAvailability) => {
    Alert.alert(
      t('detail.deleteSlotTitle'),
      t('detail.deleteSlotMessage', { day: dayNames[slot.day_of_week] ?? '', period: slot.period_number }),
      [
        { text: t('detail.cancel'), style: 'cancel' },
        {
          text: t('detail.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSlot(slot.id);
            } catch (e: unknown) {
              Alert.alert(t('detail.errorTitle'), e instanceof Error ? e.message : t('detail.saveAvailError'));
            }
          },
        },
      ],
    );
  };

  // --- Leave helpers ---
  const handleApproveLeave = async (leave: TeacherLeave) => {
    try {
      await approveLeave(leave.id);
    } catch (e: unknown) {
      Alert.alert(t('detail.errorTitle'), e instanceof Error ? e.message : t('detail.errorTitle'));
    }
  };

  const handleRejectLeave = async (leave: TeacherLeave) => {
    try {
      await rejectLeave(leave.id);
    } catch (e: unknown) {
      Alert.alert(t('detail.errorTitle'), e instanceof Error ? e.message : t('detail.errorTitle'));
    }
  };

  // --- Workload helpers ---
  const openWorkloadModal = () => {
    setMaxPerDay(workload?.max_periods_per_day?.toString() ?? '6');
    setMaxPerWeek(workload?.max_periods_per_week?.toString() ?? '30');
    setShowWorkloadModal(true);
  };

  const handleSaveWorkload = async () => {
    const day = parseInt(maxPerDay, 10);
    const week = parseInt(maxPerWeek, 10);
    if (!day || !week || day < 1 || week < 1) {
      Alert.alert(t('detail.validationTitle'), t('detail.workloadValidation'));
      return;
    }
    try {
      setWorkloadSaving(true);
      await saveWorkload({ max_periods_per_day: day, max_periods_per_week: week });
      setShowWorkloadModal(false);
    } catch (e: unknown) {
      Alert.alert(t('detail.errorTitle'), e instanceof Error ? e.message : t('detail.saveWorkloadError'));
    } finally {
      setWorkloadSaving(false);
    }
  };

  const leaveStatusColor = (status: string): 'success' | 'error' | 'warning' => {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'error';
    return 'warning';
  };

  if (loading && !currentTeacher) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </View>
    );
  }

  if (!currentTeacher) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text variant="bodyLg" color="error" style={{ marginBottom: spacing.lg, textAlign: 'center' }}>
            {t('detail.notFound')}
          </Text>
          <PressScale
            onPress={() => router.back()}
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
      </View>
    );
  }

  const teacher = currentTeacher;

  // Contact rows — only real, present fields
  const contactRows = [
    { icon: 'card-outline' as const, label: t('detail.employeeId'), value: teacher.employee_id },
    { icon: 'mail-outline' as const, label: t('detail.email'), value: teacher.email },
    { icon: 'call-outline' as const, label: t('detail.phone'), value: teacher.phone },
    { icon: 'home-outline' as const, label: t('detail.sectionAddress'), value: teacher.address },
  ].filter((r) => r.value != null && String(r.value).trim() !== '');

  // Professional rows — only real, present fields
  const professionalRows = [
    { icon: 'briefcase-outline' as const, label: t('detail.designation'), value: teacher.designation },
    { icon: 'business-outline' as const, label: t('detail.department'), value: teacher.department },
    {
      icon: 'time-outline' as const,
      label: t('detail.experience'),
      value:
        teacher.experience_years != null
          ? t('detail.experienceYears', { years: teacher.experience_years })
          : undefined,
    },
    { icon: 'calendar-outline' as const, label: t('detail.dateOfJoining'), value: teacher.date_of_joining },
  ].filter((r) => r.value != null && String(r.value).trim() !== '');

  // Credentials rows — only real qualification / specialization strings (no fabricated degrees)
  const credentialRows = [
    { icon: 'school-outline' as const, label: t('detail.qualification'), value: teacher.qualification },
    { icon: 'ribbon-outline' as const, label: t('detail.specialization'), value: teacher.specialization },
  ].filter((r) => r.value != null && String(r.value).trim() !== '');

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.marginMobile,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: palette.surfaceContainerHighest,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
          <AppIcon
            name="arrow-back"
            size="lg"
            color="onSurface"
            onPress={() => router.back()}
            accessibilityLabel={t('detail.goBack')}
          />
          <Text variant="headlineMd" color="onSurface" numberOfLines={1}>
            {t('detail.title')}
          </Text>
        </View>
        {canDelete ? <AppIcon name="trash-outline" size="lg" color="error" onPress={handleDelete} /> : null}
      </View>

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 48, borderBottomWidth: 1, borderBottomColor: palette.surfaceContainerHighest }}
        contentContainerStyle={{ paddingHorizontal: spacing.xs, alignItems: 'center' }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <PressScale
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderBottomWidth: 2,
                borderBottomColor: isActive ? palette.primary : 'transparent',
              }}
            >
              <Text variant="labelMd" color={isActive ? 'primary' : 'onSurfaceVariant'}>
                {tab.label}
              </Text>
            </PressScale>
          );
        })}
      </ScrollView>

      {/* ── INFO TAB ── */}
      {activeTab === 'info' ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.marginMobile,
            paddingTop: spacing.lg,
            paddingBottom: 96,
          }}
          showsVerticalScrollIndicator={false}
        >
          <TeacherDetailHero teacher={teacher} canUpdate={canUpdate} onEdit={goEdit} />
          <TeacherSubjectsCard subjects={teacher.subjects ?? []} />
          {credentialRows.length > 0 ? (
            <DetailCard title={t('detail.credentials')} accent="secondaryContainer">
              {credentialRows.map((r) => (
                <DetailRow key={r.label} icon={r.icon} label={r.label} value={String(r.value)} />
              ))}
            </DetailCard>
          ) : null}
          {professionalRows.length > 0 ? (
            <DetailCard title={t('detail.sectionProfessional')} accent="primaryContainer">
              {professionalRows.map((r) => (
                <DetailRow key={r.label} icon={r.icon} label={r.label} value={String(r.value)} />
              ))}
            </DetailCard>
          ) : null}
          {contactRows.length > 0 ? (
            <DetailCard title={t('detail.sectionBasic')} accent="tertiaryContainer">
              {contactRows.map((r) => (
                <DetailRow key={r.label} icon={r.icon} label={r.label} value={String(r.value)} />
              ))}
            </DetailCard>
          ) : null}
        </ScrollView>
      ) : null}

      {/* ── SUBJECTS TAB (managed expertise list) ── */}
      {activeTab === 'subjects' ? (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
            <Text variant="headlineMd" color="onSurface">
              {t('detail.subjectExpertise')}
            </Text>
            <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
              {t('detail.subjectsReadOnlyHint')}
            </Text>
          </View>
          {subjectsLoading ? (
            <ActivityIndicator style={{ marginTop: spacing.xl }} color={palette.primary} />
          ) : teacherSubjects.length === 0 ? (
            <Text variant="bodyMd" color="onSurfaceVariant" style={{ padding: spacing.marginMobile }}>
              {t('detail.emptySubjects')}
            </Text>
          ) : (
            <FlatList
              data={teacherSubjects}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.sm }}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing.md,
                    borderRadius: radius.md,
                    backgroundColor: palette.surfaceContainerLowest,
                  }}
                >
                  <Text variant="bodyMd" color="onSurface">
                    {item.subject_name}
                  </Text>
                  {item.subject_code ? (
                    <View
                      style={{
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        borderRadius: radius.full,
                        backgroundColor: palette.tertiaryContainer,
                      }}
                    >
                      <Text variant="labelSm" color="onTertiaryContainer">
                        {item.subject_code}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            />
          )}
        </View>
      ) : null}

      {/* ── AVAILABILITY TAB ── */}
      {activeTab === 'availability' ? (
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.marginMobile,
              paddingTop: spacing.lg,
            }}
          >
            <Text variant="headlineMd" color="onSurface">
              {t('detail.unavailabilityTitle')}
            </Text>
            {canManage ? (
              <PressScale
                onPress={() => setShowAvailModal(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.md,
                  backgroundColor: palette.primary,
                }}
              >
                <AppIcon name="add" size="sm" color="onPrimary" />
                <Text variant="labelMd" color="onPrimary">
                  {t('detail.add')}
                </Text>
              </PressScale>
            ) : null}
          </View>
          <Text variant="bodyMd" color="onSurfaceVariant" style={{ paddingHorizontal: spacing.marginMobile, marginTop: spacing.xs }}>
            {t('detail.availabilityHelper')}
          </Text>
          {availLoading ? (
            <ActivityIndicator style={{ marginTop: spacing.xl }} color={palette.primary} />
          ) : availability.length === 0 ? (
            <Text variant="bodyMd" color="onSurfaceVariant" style={{ padding: spacing.marginMobile }}>
              {t('detail.emptyAvailability')}
            </Text>
          ) : (
            <FlatList
              data={availability}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.sm }}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing.md,
                    borderRadius: radius.md,
                    backgroundColor: palette.surfaceContainerLowest,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMd" color="onSurface">
                      {t('detail.slotLine', { day: dayNames[item.day_of_week] ?? '', period: item.period_number })}
                    </Text>
                    <Text variant="labelSm" color={item.available ? 'success' : 'error'} style={{ marginTop: spacing.xs }}>
                      {item.available ? t('detail.slotAvailable') : t('detail.slotUnavailable')}
                    </Text>
                  </View>
                  {canManage ? (
                    <AppIcon name="close-circle-outline" size="lg" color="error" onPress={() => handleDeleteAvail(item)} />
                  ) : null}
                </View>
              )}
            />
          )}
        </View>
      ) : null}

      {/* ── LEAVES TAB ── */}
      {activeTab === 'leaves' ? (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
            <Text variant="headlineMd" color="onSurface">
              {t('detail.leaveRequestsTitle')}
            </Text>
          </View>
          {leavesLoading ? (
            <ActivityIndicator style={{ marginTop: spacing.xl }} color={palette.primary} />
          ) : leaves.length === 0 ? (
            <Text variant="bodyMd" color="onSurfaceVariant" style={{ padding: spacing.marginMobile }}>
              {t('detail.emptyLeaves')}
            </Text>
          ) : (
            <FlatList
              data={leaves}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.md }}
              renderItem={({ item }) => {
                const statusColor = leaveStatusColor(item.status);
                return (
                  <View
                    style={{
                      padding: spacing.md,
                      borderRadius: radius.lg,
                      backgroundColor: palette.surfaceContainerLowest,
                      borderLeftWidth: 4,
                      borderLeftColor: palette[statusColor],
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                      <Text variant="labelMd" color="onSurface">
                        {item.leave_type.toUpperCase()}
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.xs,
                          borderRadius: radius.full,
                          backgroundColor: palette.surfaceContainer,
                        }}
                      >
                        <Text variant="labelSm" color={statusColor}>
                          {t(`status.${item.status}`, { defaultValue: item.status })}
                        </Text>
                      </View>
                    </View>
                    <Text variant="bodyMd" color="onSurface">
                      {item.start_date} → {item.end_date}
                    </Text>
                    {item.reason ? (
                      <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
                        {item.reason}
                      </Text>
                    ) : null}
                    {canLeaveManage && item.status === 'pending' ? (
                      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                        <Button size="sm" variant="primary" style={{ flex: 1 }} onPress={() => handleApproveLeave(item)}>
                          {t('detail.approve')}
                        </Button>
                        <Button size="sm" variant="destructive" style={{ flex: 1 }} onPress={() => handleRejectLeave(item)}>
                          {t('detail.reject')}
                        </Button>
                      </View>
                    ) : null}
                  </View>
                );
              }}
            />
          )}
        </View>
      ) : null}

      {/* ── WORKLOAD TAB ── */}
      {activeTab === 'workload' ? (
        <ScrollView contentContainerStyle={{ padding: spacing.marginMobile }}>
          <DetailCard title={t('detail.workloadRule')} accent="primaryContainer">
            {workloadLoading ? (
              <ActivityIndicator color={palette.primary} />
            ) : workload ? (
              <>
                <DetailRow
                  icon="today-outline"
                  label={t('detail.maxPeriodsPerDay')}
                  value={String(workload.max_periods_per_day)}
                />
                <DetailRow
                  icon="calendar-outline"
                  label={t('detail.maxPeriodsPerWeek')}
                  value={String(workload.max_periods_per_week)}
                />
              </>
            ) : (
              <Text variant="bodyMd" color="onSurfaceVariant">
                {t('detail.noWorkloadDefault')}
              </Text>
            )}
          </DetailCard>
          {canManage ? (
            <Button
              variant="secondary"
              fullWidth
              onPress={openWorkloadModal}
              leftIcon={<AppIcon name={workload ? 'create-outline' : 'add'} size="sm" color="primary" />}
            >
              {workload ? t('detail.editRule') : t('detail.setRule')}
            </Button>
          ) : null}
        </ScrollView>
      ) : null}

      {/* Availability Modal */}
      <Modal visible={showAvailModal} animationType="slide" presentationStyle="formSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }} edges={['top']}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.marginMobile,
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: palette.surfaceContainerHighest,
            }}
          >
            <Text variant="headlineMd" color="onSurface">
              {t('detail.addAvailabilityTitle')}
            </Text>
            <AppIcon name="close" size="lg" color="onSurface" onPress={() => setShowAvailModal(false)} />
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.md }}>
            <Input
              label={t('detail.dayOfWeekLabel')}
              value={availDay}
              onChangeText={setAvailDay}
              keyboardType="number-pad"
              placeholder="1"
            />
            <Input
              label={t('detail.periodNumberLabel')}
              value={availPeriod}
              onChangeText={setAvailPeriod}
              keyboardType="number-pad"
              placeholder="3"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="labelMd" color="onSurface">
                {t('detail.availableLabel')}
              </Text>
              <Switch
                value={availIsAvailable}
                onValueChange={setAvailIsAvailable}
                trackColor={{ true: palette.success, false: palette.error }}
              />
            </View>
            <Text variant="bodyMd" color="onSurfaceVariant">
              {t('detail.availabilitySwitchHint')}
            </Text>
            <Button variant="primary" fullWidth onPress={handleCreateAvail} style={{ marginTop: spacing.md }}>
              {t('detail.saveSlot')}
            </Button>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Workload Rule Modal */}
      <Modal visible={showWorkloadModal} animationType="slide" presentationStyle="formSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }} edges={['top']}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.marginMobile,
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: palette.surfaceContainerHighest,
            }}
          >
            <Text variant="headlineMd" color="onSurface">
              {t('detail.workloadModalTitle')}
            </Text>
            <AppIcon name="close" size="lg" color="onSurface" onPress={() => setShowWorkloadModal(false)} />
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.md }}>
            <Input
              label={t('detail.maxPerDayRequired')}
              value={maxPerDay}
              onChangeText={setMaxPerDay}
              keyboardType="number-pad"
              placeholder="6"
            />
            <Input
              label={t('detail.maxPerWeekRequired')}
              value={maxPerWeek}
              onChangeText={setMaxPerWeek}
              keyboardType="number-pad"
              placeholder="30"
            />
            <Button
              variant="primary"
              fullWidth
              loading={workloadSaving}
              onPress={handleSaveWorkload}
              style={{ marginTop: spacing.md }}
            >
              {workloadSaving ? t('detail.saving') : t('detail.saveRule')}
            </Button>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
