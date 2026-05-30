import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { useClassAttendanceSession } from '@/modules/academics/hooks/useAcademicQueries';
import { usePermissions } from '@/modules/permissions/hooks/usePermissions';
import * as PERMS from '@/modules/permissions/constants/permissions';
import { AppIcon } from '@/common/components/AppIcon';
import { Text } from '@/common/components/Text';
import { Button } from '@/common/components/Button';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { ProgressRing } from '@/modules/home/components/ProgressRing';
import { StudentRosterRow } from '../components/StudentRosterRow';
import { StudentDetailSheet } from '../components/StudentDetailSheet';
import type { AttendanceStatus } from '../components/AttendanceStatusSegmented';

type FilterStatus = 'all' | 'present' | 'absent' | 'late' | 'unmarked';

function isMarked(status: string | null | undefined): boolean {
  return !!status && status !== 'unmarked' && status !== '';
}

export default function AttendanceSessionScreen() {
  const { t } = useTranslation('attendance');
  const { palette, spacing, radius, elevation } = useTheme();
  const { hasPermission } = usePermissions();
  const params = useLocalSearchParams<{ classId: string; className?: string; date: string }>();
  const classId = params.classId;
  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const { data, isLoading, isRefetching, refetch } = useClassAttendanceSession(classId, date);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    roll?: string;
    status: AttendanceStatus;
    remarks?: string;
  } | null>(null);

  const session = data?.session ?? null;
  const records = data?.records ?? [];

  // Preserved permission gating from original screen: hide editing CTAs when the
  // session is finalized and the user lacks ATTENDANCE_MANAGE permission.
  const canManageFinalized = hasPermission(PERMS.ATTENDANCE_MANAGE);
  const readOnly = session?.status === 'finalized' && !canManageFinalized;

  const total = records.length;
  const marked = records.filter((r) => isMarked(r.status)).length;
  const pct = total > 0 ? Math.round((marked / total) * 100) : 0;
  const counts = {
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
    unmarked: total - marked,
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return records;
    if (filter === 'unmarked') return records.filter((r) => !isMarked(r.status));
    return records.filter((r) => r.status === filter);
  }, [records, filter]);

  const filterChips: { key: FilterStatus; label: string; color: keyof typeof palette }[] = [
    { key: 'present', label: t('counts.present', { defaultValue: 'Present' }), color: 'success' },
    { key: 'absent', label: t('counts.absent', { defaultValue: 'Absent' }), color: 'error' },
    { key: 'late', label: t('counts.late', { defaultValue: 'Late' }), color: 'warning' },
    { key: 'unmarked', label: t('counts.unmarked', { defaultValue: 'Unmarked' }), color: 'outline' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.marginMobile,
          gap: spacing.lg,
          paddingBottom: spacing.xl * 4,
        }}
        refreshControl={<RefreshControl refreshing={!!isRefetching} onRefresh={() => refetch()} />}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <AppIcon name="chevron-back" size="lg" color="onSurface" />
        </Pressable>

        {isLoading && !data ? (
          <Skeleton width="100%" height={180} radius={radius.xl} />
        ) : data ? (
          <>
            <View
              style={[
                elevation.card,
                {
                  backgroundColor: palette.surfaceContainerLowest,
                  borderRadius: radius.xl,
                  padding: spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text variant="headlineLg" color="onSurface" numberOfLines={1}>
                  {params.className ?? session?.class_name ?? ''}
                </Text>
                <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: 4 }} numberOfLines={1}>
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: 4 }}>
                  {t('session.marked', {
                    defaultValue: '{{marked}}/{{total}} marked',
                    marked,
                    total,
                  })}
                </Text>
              </View>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <ProgressRing value={pct} size={72} stroke={4} />
                <Text variant="labelMd" color="primary" style={styles.ringLabel}>
                  {pct}%
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {filterChips.map((c) => {
                const isActive = filter === c.key;
                const count = counts[c.key as keyof typeof counts];
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setFilter(isActive ? 'all' : c.key)}
                    style={{
                      flex: 1,
                      backgroundColor: isActive ? palette[c.color] + '22' : palette.surfaceContainerLowest,
                      borderRadius: radius.lg,
                      padding: spacing.sm,
                      alignItems: 'center',
                    }}
                  >
                    <Text variant="headlineMd" color={c.color}>{count}</Text>
                    <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: 2 }}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={[
                elevation.card,
                {
                  backgroundColor: palette.surfaceContainerLowest,
                  borderRadius: radius.xl,
                  overflow: 'hidden',
                },
              ]}
            >
              {filtered.length === 0 ? (
                <EmptyState
                  icon={<AppIcon name="search-outline" size="xl" color="onSurfaceVariant" />}
                  title={t('session.noMatching', { defaultValue: 'No students match this filter' })}
                />
              ) : (
                filtered.map((r) => (
                  <StudentRosterRow
                    key={r.student_id}
                    name={r.student_name ?? ''}
                    rollNumber={r.admission_number ?? undefined}
                    rightSlot={<StatusPill status={r.status} marked={isMarked(r.status)} />}
                    onPress={() =>
                      setSelectedStudent({
                        id: r.student_id,
                        name: r.student_name ?? '',
                        roll: r.admission_number ?? undefined,
                        status: (isMarked(r.status) ? (r.status as AttendanceStatus) : null),
                        remarks: r.remarks ?? undefined,
                      })
                    }
                  />
                ))
              )}
            </View>
          </>
        ) : null}
      </ScrollView>

      {data && !readOnly ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: spacing.marginMobile,
            backgroundColor: palette.surface,
          }}
        >
          <Button
            variant="primary"
            fullWidth
            onPress={() =>
              router.push({
                pathname: '/(protected)/attendance/mark',
                params: { classId, className: params.className, date },
              } as any)
            }
          >
            {marked > 0
              ? t('session.editAttendance', { defaultValue: 'Edit attendance' })
              : t('session.markAttendance', { defaultValue: 'Mark attendance' })}
          </Button>
        </View>
      ) : null}

      <StudentDetailSheet
        visible={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        studentName={selectedStudent?.name ?? ''}
        rollNumber={selectedStudent?.roll}
        currentStatus={selectedStudent?.status ?? null}
        currentRemarks={selectedStudent?.remarks}
        canEdit={false}
        onSave={() => {}}
      />
    </View>
  );
}

function StatusPill({ status, marked }: { status: string | null; marked: boolean }) {
  const { palette } = useTheme();
  if (!marked || !status) {
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: palette.outlineVariant,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
        }}
      >
        <Text variant="labelSm" color="onSurfaceVariant">—</Text>
      </View>
    );
  }
  const colorKey: 'success' | 'error' | 'warning' | 'outline' =
    status === 'present' ? 'success' :
    status === 'absent' ? 'error' :
    status === 'late' ? 'warning' :
    'outline';
  const label = status[0].toUpperCase() + status.slice(1);
  return (
    <View
      style={{
        backgroundColor: `${palette[colorKey]}22`,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text variant="labelSm" color={colorKey}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  ringLabel: { position: 'absolute' },
});
