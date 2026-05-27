import React, { useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/common/theme';
import { useMyAttendanceV2 } from '@/modules/academics/hooks/useAcademicQueries';
import { HomeKpiCard } from '@/modules/home/components/HomeKpiCard';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';

function CircularProgress({ value, size, palette }: { value: number; size: number; palette: any }) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const offset = C - (Math.min(100, Math.max(0, value)) / 100) * C;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={palette.surfaceContainerHighest} strokeWidth={stroke} fill="none" />
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

function monthOptions(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString(undefined, { month: 'short' });
    out.push({ key, label });
  }
  return out;
}

type DayCell = { date: string; day: number; status: string | null; isFuture: boolean };

function buildCalendar(month: string, records: any[]): DayCell[] {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);
  const cells: DayCell[] = [];
  const recordMap = new Map<string, string>();
  for (const r of records ?? []) {
    if (r?.date) recordMap.set(String(r.date), String(r.status ?? '').toLowerCase());
  }
  for (let d = 1; d <= last; d++) {
    const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      date,
      day: d,
      status: recordMap.get(date) ?? null,
      isFuture: date > today,
    });
  }
  return cells;
}

export default function MyAttendanceScreen() {
  const { t } = useTranslation('attendance');
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const months = useMemo(monthOptions, []);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(todayKey);
  const [selectedCell, setSelectedCell] = useState<DayCell | null>(null);
  const { data, isLoading, isRefetching, refetch } = useMyAttendanceV2(selectedMonth);

  const records: any[] = (data as any)?.records ?? [];
  const presentCount = (data as any)?.present ?? 0;
  const absentCount = (data as any)?.absent ?? 0;
  const lateCount = (data as any)?.late ?? 0;
  const totalDays = (data as any)?.total_days ?? records.length;
  const pct = (data as any)?.percentage ?? (totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0);

  const calendarCells = useMemo(() => buildCalendar(selectedMonth, records), [selectedMonth, records]);

  const colorFor = (status: string | null) => {
    if (status === 'present') return palette.success;
    if (status === 'absent') return palette.error;
    if (status === 'late') return palette.warning;
    if (status === 'holiday') return palette.tertiary;
    return palette.onSurfaceVariant;
  };
  const bgFor = (status: string | null) => {
    if (status === 'present') return `${palette.success}22`;
    if (status === 'absent') return `${palette.error}22`;
    if (status === 'late') return `${palette.warning}22`;
    if (status === 'holiday') return palette.tertiaryContainer;
    return 'transparent';
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.lg, paddingBottom: spacing.xl * 3 }}
        refreshControl={<RefreshControl refreshing={!!isRefetching} onRefresh={() => refetch()} />}
      >
        <View>
          <Text style={[typography.display, { color: palette.onSurface }]}>
            {t('myAttendance.title', { defaultValue: 'My Attendance' })}
          </Text>
          <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
            {t('myAttendance.subtitle', { defaultValue: 'Track your attendance and trends' })}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {months.map((m) => {
            const isActive = m.key === selectedMonth;
            return (
              <Text
                key={m.key}
                onPress={() => setSelectedMonth(m.key)}
                style={[
                  typography.labelMd,
                  {
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.full,
                    backgroundColor: isActive ? palette.tertiaryContainer : palette.surfaceContainerLowest,
                    color: isActive ? palette.onTertiaryContainer : palette.onSurfaceVariant,
                    overflow: 'hidden',
                    fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_500Medium',
                  },
                ]}
              >
                {m.label}
              </Text>
            );
          })}
        </ScrollView>

        {isLoading && !data ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Skeleton width="48%" height={110} radius={radius.xl} />
            <Skeleton width="48%" height={110} radius={radius.xl} />
            <Skeleton width="48%" height={110} radius={radius.xl} />
            <Skeleton width="48%" height={110} radius={radius.xl} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <View style={{ width: '48%' }}>
              <HomeKpiCard
                label={t('myAttendance.kpi.percentage', { defaultValue: 'Attendance %' })}
                value={`${pct}%`}
                accent="primary"
                iconName="checkmark-done-outline"
                iconBgToken="primaryContainer"
                rightSlot={<CircularProgress value={Number(pct)} size={28} palette={palette} />}
              />
            </View>
            <View style={{ width: '48%' }}>
              <HomeKpiCard
                label={t('myAttendance.kpi.present', { defaultValue: 'Days present' })}
                value={String(presentCount)}
                accent="secondary"
                iconName="calendar-outline"
                iconBgToken="secondaryContainer"
                secondaryText={t('myAttendance.kpi.ofTotal', { defaultValue: 'of {{n}}', n: totalDays })}
              />
            </View>
            <View style={{ width: '48%' }}>
              <HomeKpiCard
                label={t('myAttendance.kpi.absent', { defaultValue: 'Days absent' })}
                value={String(absentCount)}
                accent="error"
                iconName="close-circle-outline"
                iconBgToken="errorContainer"
              />
            </View>
            <View style={{ width: '48%' }}>
              <HomeKpiCard
                label={t('myAttendance.kpi.late', { defaultValue: 'Late marks' })}
                value={String(lateCount)}
                accent="error"
                iconName="time-outline"
                iconBgToken="surfaceContainerHigh"
              />
            </View>
          </View>
        )}

        {/* Calendar */}
        <View style={[elevation.card, { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.md }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.sm }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <Text key={i} style={[typography.labelSm, { color: palette.onSurfaceVariant, width: 36, textAlign: 'center' }]}>
                {d}
              </Text>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {calendarCells.map((c) => {
              const isToday = c.date === today.toISOString().slice(0, 10);
              return (
                <Pressable
                  key={c.date}
                  onPress={() => !c.isFuture && c.status && setSelectedCell(c)}
                  disabled={c.isFuture || !c.status}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: bgFor(c.status),
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: isToday ? 1.5 : 0,
                    borderColor: palette.primary,
                    opacity: c.isFuture ? 0.3 : 1,
                  }}
                >
                  <Text style={[typography.labelSm, { color: colorFor(c.status), fontFamily: c.status ? 'Inter_600SemiBold' : 'Inter_500Medium' }]}>
                    {c.day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {/* Legend */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md }}>
            {[
              { label: t('myAttendance.legend.present', { defaultValue: 'Present' }), color: palette.success },
              { label: t('myAttendance.legend.absent', { defaultValue: 'Absent' }), color: palette.error },
              { label: t('myAttendance.legend.late', { defaultValue: 'Late' }), color: palette.warning },
              { label: t('myAttendance.legend.holiday', { defaultValue: 'Holiday' }), color: palette.tertiary },
            ].map((it) => (
              <View key={it.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: it.color }} />
                <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>{it.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {records.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="calendar-outline" size={36} color={palette.onSurfaceVariant} />}
            title={t('myAttendance.empty', { defaultValue: 'No attendance data yet' })}
            description={t('myAttendance.emptyHelp', {
              defaultValue: 'Your first marked day will show here.',
            })}
          />
        ) : null}
      </ScrollView>

      {/* Day detail modal */}
      <Modal visible={!!selectedCell} transparent animationType="slide" onRequestClose={() => setSelectedCell(null)}>
        <Pressable style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(11, 28, 48, 0.40)' }]} onPress={() => setSelectedCell(null)} />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: palette.surfaceContainerLowest,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.lg,
            paddingBottom: spacing.xl,
          }}
        >
          <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: palette.outlineVariant }} />
          <Text style={[typography.headlineMd, { color: palette.onSurface, marginTop: spacing.md }]}>
            {selectedCell ? new Date(selectedCell.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
          </Text>
          <Text style={[typography.bodyMd, { color: colorFor(selectedCell?.status ?? null), marginTop: spacing.sm }]}>
            {selectedCell?.status ? selectedCell.status.toUpperCase() : '—'}
          </Text>
        </View>
      </Modal>
    </>
  );
}
