import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { useEligibleAttendanceClasses } from '@/modules/academics/hooks/useAcademicQueries';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { Link } from '@/common/components/Link';
import { AttendanceClassCard } from '../components/AttendanceClassCard';

function buildDayStrip(today: Date) {
  const out: { date: Date; label: string; isToday: boolean; iso: string }[] = [];
  for (let i = -6; i <= 0; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      date: d,
      label: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
      isToday: i === 0,
      iso: d.toISOString().slice(0, 10),
    });
  }
  return out;
}

export default function MyClassesScreen() {
  const { t } = useTranslation('attendance');
  const { palette, spacing, radius, typography } = useTheme();
  const today = new Date();
  const [selectedIso, setSelectedIso] = useState<string>(today.toISOString().slice(0, 10));
  const { data: items = [], isLoading, refetch, isRefetching } =
    useEligibleAttendanceClasses(selectedIso);

  const dayStrip = useMemo(() => buildDayStrip(today), []);
  const longDate = new Date(selectedIso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.marginMobile,
        gap: spacing.lg,
        paddingBottom: spacing.xl * 3,
      }}
      refreshControl={<RefreshControl refreshing={!!isRefetching} onRefresh={() => refetch()} />}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text style={[typography.display, { color: palette.onSurface }]}>
            {t('myClasses.title', { defaultValue: 'Mark Attendance' })}
          </Text>
          <Text
            style={[
              typography.bodyMd,
              { color: palette.onSurfaceVariant, marginTop: spacing.xs },
            ]}
          >
            {longDate}
          </Text>
        </View>
        <Link onPress={() => router.push('/(protected)/attendance/overview')}>
          {t('myClasses.viewPast', { defaultValue: 'View past' })}
        </Link>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm }}
      >
        {dayStrip.map((d) => {
          const isSelected = d.iso === selectedIso;
          return (
            <Text
              key={d.iso}
              onPress={() => setSelectedIso(d.iso)}
              style={[
                typography.labelMd,
                {
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  backgroundColor: isSelected ? palette.primaryContainer : palette.surfaceContainerLowest,
                  color: isSelected ? palette.onPrimaryContainer : palette.onSurfaceVariant,
                  overflow: 'hidden',
                  fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_500Medium',
                },
              ]}
            >
              {d.label}
            </Text>
          );
        })}
      </ScrollView>

      {isLoading && items.length === 0 ? (
        <View style={{ gap: spacing.md }}>
          <Skeleton width="100%" height={140} radius={radius.xl} />
          <Skeleton width="100%" height={140} radius={radius.xl} />
          <Skeleton width="100%" height={140} radius={radius.xl} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="cafe-outline" size={36} color={palette.onSurfaceVariant} />}
          title={t('myClasses.empty', { defaultValue: 'No classes to mark' })}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {items.map((item: any) => {
            const totalStudents = item.total_students ?? 0;
            const markedCount = item.marked_count ?? 0;
            const state: 'pending' | 'marked' | 'partial' =
              markedCount === 0
                ? 'pending'
                : totalStudents > 0 && markedCount >= totalStudents
                ? 'marked'
                : markedCount > 0
                ? 'partial'
                : 'pending';
            const subject = item.subject_name ?? item.class_name ?? '—';
            const classLabel = totalStudents
              ? `${item.class_name} • ${totalStudents} ${t('myClasses.students', { defaultValue: 'students' })}`
              : item.class_name ?? '';
            return (
              <AttendanceClassCard
                key={item.class_id}
                state={state}
                subject={subject}
                classLabel={classLabel}
                timeLabel={item.period_time}
                onPress={() =>
                  router.push({
                    pathname: '/(protected)/attendance/session',
                    params: {
                      classId: item.class_id,
                      className: item.class_name,
                      date: selectedIso,
                    },
                  } as any)
                }
                onPrimaryAction={() =>
                  router.push({
                    pathname:
                      state === 'marked'
                        ? '/(protected)/attendance/session'
                        : '/(protected)/attendance/mark',
                    params: {
                      classId: item.class_id,
                      className: item.class_name,
                      date: selectedIso,
                    },
                  } as any)
                }
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
