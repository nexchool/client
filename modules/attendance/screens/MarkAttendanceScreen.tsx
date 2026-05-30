import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { AppIcon } from '@/common/components/AppIcon';
import { Text } from '@/common/components/Text';
import { Button } from '@/common/components/Button';
import { Input } from '@/common/components/Input';
import { Link } from '@/common/components/Link';
import { Skeleton } from '@/common/components/Skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { useAttendance } from '../hooks/useAttendance';
import { qk } from '@/modules/academics/hooks/queryKeys';
import { holidayService } from '@/modules/holidays/services/holidayService';
import type { Holiday } from '@/modules/holidays/types';
import type { AttendanceRecord } from '../types';
import { StudentRosterRow } from '../components/StudentRosterRow';
import {
  AttendanceStatusSegmented,
  type AttendanceStatus,
} from '../components/AttendanceStatusSegmented';
import { AttendanceStatsBanner } from '../components/AttendanceStatsBanner';
import { StudentDetailSheet } from '../components/StudentDetailSheet';

type LocalRecord = {
  status: string;
  remarks?: string;
};

function normalizeStatus(s: string | null | undefined): AttendanceStatus {
  if (s === 'present' || s === 'absent' || s === 'late') return s;
  return null;
}

export default function MarkAttendanceScreen() {
  const { t } = useTranslation('attendance');
  const { palette, spacing, radius } = useTheme();
  const router = useRouter();
  const { classId, className } = useLocalSearchParams<{
    classId: string;
    className?: string;
  }>();

  // ===== PRESERVED: legacy useAttendance callback hook =====
  // markAttendance posts to /api/attendance/mark with { class_id, date, records }.
  // After success we re-fetch the class attendance to sync server state back.
  const { classAttendance, loading, fetchClassAttendance, markAttendance } = useAttendance();
  // ===========================================================

  // Invalidate v2 React Query caches so Session/MyClasses refresh after a save.
  const queryClient = useQueryClient();

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [localRecords, setLocalRecords] = useState<Record<string, LocalRecord>>({});
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [editingStudent, setEditingStudent] = useState<AttendanceRecord | null>(null);
  const dateScrollRef = useRef<ScrollView>(null);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Holiday awareness — preserved from original
  const [holidayMap, setHolidayMap] = useState<Record<string, Holiday>>({});

  const DAY_NAMES = useMemo(
    () => [
      t('mark.weekdaySun'),
      t('mark.weekdayMon'),
      t('mark.weekdayTue'),
      t('mark.weekdayWed'),
      t('mark.weekdayThu'),
      t('mark.weekdayFri'),
      t('mark.weekdaySat'),
    ],
    [t],
  );
  const MONTH_NAMES = useMemo(
    () => [
      t('mark.monthJan'),
      t('mark.monthFeb'),
      t('mark.monthMar'),
      t('mark.monthApr'),
      t('mark.monthMay'),
      t('mark.monthJun'),
      t('mark.monthJul'),
      t('mark.monthAug'),
      t('mark.monthSep'),
      t('mark.monthOct'),
      t('mark.monthNov'),
      t('mark.monthDec'),
    ],
    [t],
  );

  // Generate last 30 days up to today
  const dateList = useMemo(() => {
    const dates: {
      dateStr: string;
      day: number;
      weekday: string;
      month: string;
      isToday: boolean;
    }[] = [];
    const todayDate = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dates.push({
        dateStr,
        day: d.getDate(),
        weekday: DAY_NAMES[d.getDay()],
        month: MONTH_NAMES[d.getMonth()],
        isToday: dateStr === today,
      });
    }
    return dates;
  }, [today, DAY_NAMES, MONTH_NAMES]);

  // Fetch holidays for the visible date range
  useEffect(() => {
    const loadHolidays = async () => {
      if (dateList.length === 0) return;
      try {
        const startDate = dateList[0].dateStr;
        const endDate = dateList[dateList.length - 1].dateStr;
        const [nonRecurring, recurring] = await Promise.all([
          holidayService.getHolidays({
            start_date: startDate,
            end_date: endDate,
            include_recurring: false,
          }),
          holidayService.getRecurring(),
        ]);
        const map: Record<string, Holiday> = {};
        for (const h of nonRecurring) {
          if (!h.start_date) continue;
          const hStart = new Date(h.start_date);
          const hEnd = new Date(h.end_date || h.start_date);
          const cur = new Date(hStart);
          while (cur <= hEnd) {
            const ds = cur.toISOString().split('T')[0];
            if (!map[ds]) map[ds] = h;
            cur.setDate(cur.getDate() + 1);
          }
        }
        for (const item of dateList) {
          const d = new Date(item.dateStr);
          const backendWeekday = (d.getDay() + 6) % 7;
          const match = recurring.find((r) => r.recurring_day_of_week === backendWeekday);
          if (match && !map[item.dateStr]) map[item.dateStr] = match;
        }
        setHolidayMap(map);
      } catch {
        // Informational only — fail silently
      }
    };
    loadHolidays();
  }, [dateList]);

  const selectedHoliday = holidayMap[selectedDate] ?? null;
  const isSelectedHoliday = selectedHoliday !== null;

  // Fetch class attendance whenever class or date changes
  useEffect(() => {
    if (classId) {
      fetchClassAttendance(classId, selectedDate);
    }
  }, [classId, selectedDate, fetchClassAttendance]);

  // Sync server attendance into local editable state
  useEffect(() => {
    if (classAttendance?.attendance) {
      const map: Record<string, LocalRecord> = {};
      classAttendance.attendance.forEach((r) => {
        if (r.status) {
          map[r.student_id] = { status: r.status, remarks: r.remarks };
        }
      });
      setLocalRecords(map);
    }
  }, [classAttendance]);

  const setStudentStatus = (studentId: string, next: AttendanceStatus) => {
    setLocalRecords((prev) => {
      const copy = { ...prev };
      if (next === null) {
        delete copy[studentId];
      } else {
        copy[studentId] = { status: next, remarks: prev[studentId]?.remarks };
      }
      return copy;
    });
  };

  const setStudentEdit = (studentId: string, status: AttendanceStatus, remarks: string) => {
    setLocalRecords((prev) => {
      const copy = { ...prev };
      if (status === null) {
        delete copy[studentId];
      } else {
        copy[studentId] = { status, remarks: remarks || undefined };
      }
      return copy;
    });
  };

  const markAllPresent = () => {
    if (!classAttendance?.attendance) return;
    const map: Record<string, LocalRecord> = {};
    classAttendance.attendance.forEach((r) => {
      map[r.student_id] = { status: 'present', remarks: localRecords[r.student_id]?.remarks };
    });
    setLocalRecords(map);
  };

  const markAllAbsent = () => {
    if (!classAttendance?.attendance) return;
    const map: Record<string, LocalRecord> = {};
    classAttendance.attendance.forEach((r) => {
      map[r.student_id] = { status: 'absent', remarks: localRecords[r.student_id]?.remarks };
    });
    setLocalRecords(map);
  };

  const handleSubmit = async () => {
    if (!classId) return;

    if (isSelectedHoliday) {
      const label = selectedHoliday.is_recurring
        ? selectedHoliday.recurring_day_name ?? t('mark.offDay')
        : selectedHoliday.name;
      Alert.alert(t('mark.holidayAlertTitle'), t('mark.holidayAlertBody', { label }));
      return;
    }

    const records = Object.entries(localRecords).map(([student_id, rec]) => ({
      student_id,
      status: rec.status,
      remarks: rec.remarks,
    }));

    if (records.length === 0) {
      Alert.alert(t('mark.errorTitle'), t('mark.markOneError'));
      return;
    }

    setSubmitting(true);
    try {
      // ===== PRESERVED MUTATION =====
      // Payload shape: { class_id, date, records: [{ student_id, status, remarks? }] }
      // POST /api/attendance/mark — see attendanceService.markAttendance.
      await markAttendance({
        class_id: classId,
        date: selectedDate,
        records,
      });
      // After success, invalidate v2 React Query caches so Session and MyClasses
      // reflect the new state when the user navigates back. Cache invalidation
      // is safe even after unmount — fire-and-forget.
      void queryClient.invalidateQueries({ queryKey: qk.classSession(classId, selectedDate) });
      void queryClient.invalidateQueries({ queryKey: qk.eligibleClasses(selectedDate) });
      void queryClient.invalidateQueries({ queryKey: qk.classAttendanceHistory(classId) });
      if (!isMountedRef.current) {
        // User navigated away. Cache invalidation already fired; skip Alert + refetch.
        return;
      }
      // Also re-fetch the local legacy state.
      Alert.alert(t('mark.successTitle'), t('mark.successBody'), [
        { text: t('mark.ok'), onPress: () => fetchClassAttendance(classId, selectedDate) },
      ]);
      // ===== END PRESERVED MUTATION =====
    } catch (err: any) {
      if (!isMountedRef.current) return;
      Alert.alert(t('mark.errorTitle'), err?.message || t('mark.saveError'));
    } finally {
      if (isMountedRef.current) setSubmitting(false);
    }
  };

  const students = classAttendance?.attendance ?? [];
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.student_name.toLowerCase().includes(q) ||
        String(s.admission_number ?? '').toLowerCase().includes(q) ||
        String(s.roll_number ?? '').toLowerCase().includes(q),
    );
  }, [students, search]);

  const counts = useMemo(() => {
    let p = 0;
    let a = 0;
    let l = 0;
    const total = students.length;
    for (const s of students) {
      const status = localRecords[s.student_id]?.status;
      if (status === 'present') p++;
      else if (status === 'absent') a++;
      else if (status === 'late') l++;
    }
    return { present: p, absent: a, late: l, unmarked: Math.max(0, total - p - a - l) };
  }, [students, localRecords]);

  const renderStudent = ({ item }: { item: AttendanceRecord }) => {
    const status = normalizeStatus(localRecords[item.student_id]?.status);
    return (
      <View style={{ opacity: isSelectedHoliday ? 0.5 : 1 }}>
        <StudentRosterRow
          name={item.student_name}
          rollNumber={item.roll_number ?? item.admission_number}
          onLongPress={isSelectedHoliday ? undefined : () => setEditingStudent(item)}
          rightSlot={
            <AttendanceStatusSegmented
              value={status}
              onChange={
                isSelectedHoliday
                  ? () => undefined
                  : (next) => setStudentStatus(item.student_id, next)
              }
            />
          }
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.surface }]}>
      {/* Top bar */}
      <View
        style={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <AppIcon name="chevron-back" size="lg" color="onSurface" />
        </Pressable>
      </View>

      {/* Context header: class name + date subline + Today/date chip */}
      <View
        style={{
          paddingHorizontal: spacing.marginMobile,
          paddingBottom: spacing.sm,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="headlineLg" color="onSurface" numberOfLines={1}>
            {className || classAttendance?.class_name || t('mark.headerFallback')}
          </Text>
          <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: 2 }}>
            {new Date(selectedDate).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        {selectedDate === today ? (
          <View
            style={{
              backgroundColor: palette.primaryContainer,
              borderRadius: radius.full,
              paddingHorizontal: spacing.md,
              paddingVertical: 4,
            }}
          >
            <Text variant="labelMd" color="onPrimary">
              {t('mark.todayChip')}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Date strip */}
      <View
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: palette.outlineVariant,
        }}
      >
        <ScrollView
          ref={dateScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            gap: 6,
          }}
          onLayout={() => dateScrollRef.current?.scrollToEnd({ animated: false })}
        >
          {dateList.map((item) => {
            const isSelected = item.dateStr === selectedDate;
            const isHolidayDate = !!holidayMap[item.dateStr];
            const cellBg = isSelected
              ? palette.primary
              : isHolidayDate
                ? palette.errorContainer
                : palette.surfaceContainerLow;
            const textColorKey: 'onPrimary' | 'onErrorContainer' | 'onSurface' = isSelected
              ? 'onPrimary'
              : isHolidayDate
                ? 'onErrorContainer'
                : 'onSurface';
            return (
              <Pressable
                key={item.dateStr}
                onPress={() => setSelectedDate(item.dateStr)}
                style={[
                  styles.dateCell,
                  {
                    backgroundColor: cellBg,
                    borderRadius: radius.lg,
                    borderWidth: item.isToday && !isSelected ? 1.5 : 0,
                    borderColor: palette.primary,
                  },
                ]}
              >
                {isHolidayDate ? (
                  <View
                    style={[
                      styles.holidayDot,
                      { backgroundColor: isSelected ? palette.onPrimary : palette.error },
                    ]}
                  />
                ) : null}
                <Text variant="labelSm" color={textColorKey}>{item.weekday}</Text>
                <Text variant="headlineMd" color={textColorKey} style={{ marginVertical: 2 }}>
                  {item.day}
                </Text>
                <Text variant="labelSm" color={textColorKey}>{item.month}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Stats banner */}
      <View style={{ paddingHorizontal: spacing.marginMobile, paddingTop: spacing.sm }}>
        <AttendanceStatsBanner
          present={counts.present}
          absent={counts.absent}
          late={counts.late}
          unmarked={counts.unmarked}
        />
      </View>

      {/* Holiday banner */}
      {isSelectedHoliday ? (
        <View
          style={{
            marginHorizontal: spacing.marginMobile,
            marginTop: spacing.sm,
            padding: spacing.md,
            backgroundColor: palette.errorContainer,
            borderRadius: radius.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <AppIcon name="umbrella-outline" size="md" color="onErrorContainer" />
          <View style={{ flex: 1 }}>
            <Text variant="labelMd" color="onErrorContainer">
              {selectedHoliday.is_recurring
                ? t('mark.weeklyOffTitle', {
                    name: selectedHoliday.recurring_day_name ?? t('mark.offDay'),
                  })
                : selectedHoliday.name}
            </Text>
            <Text variant="labelSm" color="onErrorContainer" style={{ marginTop: 2 }}>
              {t('mark.holidaySubtitle')}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Search + Mark All Present (ref action row) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.sm,
        }}
      >
        <View style={{ flex: 1 }}>
          <Input
            label=""
            value={search}
            onChangeText={setSearch}
            placeholder={t('mark.findStudent')}
            rightSlot={<AppIcon name="search" size="md" color="onSurfaceVariant" />}
          />
        </View>
        {!isSelectedHoliday ? (
          <View style={styles.markAllWrap}>
            <Link
              onPress={
                classAttendance?.attendance?.length ? markAllPresent : () => undefined
              }
            >
              {t('mark.allPresent')}
            </Link>
          </View>
        ) : null}
      </View>

      {/* All Absent (secondary bulk action, preserved behavior) */}
      <View
        style={{
          paddingHorizontal: spacing.marginMobile,
        }}
      >
        <Button
          variant="secondary"
          fullWidth
          disabled={isSelectedHoliday || !classAttendance?.attendance?.length}
          onPress={markAllAbsent}
        >
          {t('mark.allAbsent')}
        </Button>
      </View>

      {/* Student list */}
      {loading && !classAttendance ? (
        <View style={{ padding: spacing.marginMobile }}>
          <Skeleton width="100%" height={400} radius={radius.xl} />
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.student_id}
          renderItem={renderStudent}
          contentContainerStyle={{
            paddingHorizontal: spacing.marginMobile,
            paddingBottom: 100,
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text variant="bodyMd" color="onSurfaceVariant">
                {t('mark.emptyStudents')}
              </Text>
            </View>
          }
        />
      )}

      {/* Submit */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.marginMobile,
          backgroundColor: palette.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: palette.outlineVariant,
        }}
      >
        <Button
          variant="primary"
          fullWidth
          loading={submitting}
          disabled={submitting || isSelectedHoliday}
          onPress={handleSubmit}
        >
          {isSelectedHoliday ? t('mark.holidayDisabled') : t('mark.saveAttendance')}
        </Button>
      </View>

      <StudentDetailSheet
        visible={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        studentName={editingStudent?.student_name ?? ''}
        rollNumber={editingStudent?.roll_number ?? editingStudent?.admission_number}
        currentStatus={
          editingStudent ? normalizeStatus(localRecords[editingStudent.student_id]?.status) : null
        }
        currentRemarks={
          editingStudent ? localRecords[editingStudent.student_id]?.remarks : undefined
        }
        canEdit={!isSelectedHoliday}
        onSave={(status, remarks) => {
          if (editingStudent) setStudentEdit(editingStudent.student_id, status, remarks);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  // Vertically align the inline "Mark All Present" link with the Input field
  // (Input reserves a label row above the 52px field).
  markAllWrap: { height: 52, marginTop: 26, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  dateCell: {
    width: 52,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holidayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    position: 'absolute',
    top: 4,
    right: 4,
  },
});
