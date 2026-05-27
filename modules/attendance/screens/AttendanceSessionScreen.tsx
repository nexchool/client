import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/common/theme';
import { useClassAttendanceSession } from '@/modules/academics/hooks/useAcademicQueries';
import { usePermissions } from '@/modules/permissions/hooks/usePermissions';
import * as PERMS from '@/modules/permissions/constants/permissions';
import { Button } from '@/common/components/Button';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { StudentRosterRow } from '../components/StudentRosterRow';
import { StudentDetailSheet } from '../components/StudentDetailSheet';
import type { AttendanceStatus } from '../components/AttendanceStatusSegmented';

type FilterStatus = 'all' | 'present' | 'absent' | 'late' | 'unmarked';

function CircularProgress({
  value,
  size,
  palette,
}: {
  value: number;
  size: number;
  palette: any;
}) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const offset = C - (Math.min(100, Math.max(0, value)) / 100) * C;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={palette.surfaceContainerHighest}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={palette.primary}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${C} ${C}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

function isMarked(status: string | null | undefined): boolean {
  return !!status && status !== 'unmarked' && status !== '';
}

export default function AttendanceSessionScreen() {
  const { t } = useTranslation('attendance');
  const { palette, spacing, radius, typography, elevation } = useTheme();
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

  const filterChips: { key: FilterStatus; label: string; color: string }[] = [
    { key: 'present', label: t('counts.present', { defaultValue: 'Present' }), color: palette.success },
    { key: 'absent', label: t('counts.absent', { defaultValue: 'Absent' }), color: palette.error },
    { key: 'late', label: t('counts.late', { defaultValue: 'Late' }), color: palette.warning },
    { key: 'unmarked', label: t('counts.unmarked', { defaultValue: 'Unmarked' }), color: palette.outline },
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
          style={{ width: 44, height: 44, justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={24} color={palette.onSurface} />
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
                <Text
                  style={[typography.headlineLg, { color: palette.onSurface }]}
                  numberOfLines={1}
                >
                  {params.className ?? session?.class_name ?? ''}
                </Text>
                <Text
                  style={[
                    typography.bodyMd,
                    { color: palette.onSurfaceVariant, marginTop: 4 },
                  ]}
                  numberOfLines={1}
                >
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text
                  style={[
                    typography.bodyMd,
                    { color: palette.onSurfaceVariant, marginTop: 4 },
                  ]}
                >
                  {t('session.marked', {
                    defaultValue: '{{marked}}/{{total}} marked',
                    marked,
                    total,
                  })}
                </Text>
              </View>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress value={pct} size={72} palette={palette} />
                <Text
                  style={[
                    typography.labelMd,
                    {
                      color: palette.primary,
                      position: 'absolute',
                      fontFamily: 'Inter_600SemiBold',
                    },
                  ]}
                >
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
                      backgroundColor: isActive ? c.color + '22' : palette.surfaceContainerLowest,
                      borderRadius: radius.lg,
                      padding: spacing.sm,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={[typography.headlineMd, { color: c.color }]}>{count}</Text>
                    <Text
                      style={[
                        typography.labelSm,
                        { color: palette.onSurfaceVariant, marginTop: 2 },
                      ]}
                    >
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
                  icon={<Ionicons name="search-outline" size={28} color={palette.onSurfaceVariant} />}
                  title={t('session.noMatching', { defaultValue: 'No students match this filter' })}
                />
              ) : (
                filtered.map((r) => (
                  <StudentRosterRow
                    key={r.student_id}
                    name={r.student_name ?? ''}
                    rollNumber={r.admission_number ?? undefined}
                    rightSlot={
                      <StatusPill
                        status={r.status}
                        marked={isMarked(r.status)}
                        palette={palette}
                        typography={typography}
                      />
                    }
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

function StatusPill({
  status,
  marked,
  palette,
  typography,
}: {
  status: string | null;
  marked: boolean;
  palette: any;
  typography: any;
}) {
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
        <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>—</Text>
      </View>
    );
  }
  const color =
    status === 'present' ? palette.success :
    status === 'absent' ? palette.error :
    status === 'late' ? palette.warning :
    palette.outline;
  const label = status[0].toUpperCase() + status.slice(1);
  return (
    <View
      style={{
        backgroundColor: `${color}22`,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text
        style={[typography.labelSm, { color, fontFamily: 'Inter_600SemiBold' }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({});
