import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useTheme } from '@/common/theme';
import { useEligibleAttendanceClasses } from '@/modules/academics/hooks/useAcademicQueries';
import type { EligibleClassItem } from '@/modules/academics/types';
import { AppIcon } from '@/common/components/AppIcon';
import { Text } from '@/common/components/Text';
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
  const { palette, spacing, radius } = useTheme();
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
        <View style={{ flex: 1 }}>
          <Text variant="display" color="onSurface">
            {t('myClasses.title', { defaultValue: 'Mark Attendance' })}
          </Text>
          <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
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
            <Pressable
              key={d.iso}
              onPress={() => setSelectedIso(d.iso)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                backgroundColor: isSelected ? palette.primaryContainer : palette.surfaceContainerLowest,
              }}
            >
              <Text
                variant="labelMd"
                color={isSelected ? 'onPrimaryContainer' : 'onSurfaceVariant'}
              >
                {d.label}
              </Text>
            </Pressable>
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
          icon={<AppIcon name="cafe-outline" size="xl" color="onSurfaceVariant" />}
          title={t('myClasses.empty', { defaultValue: 'No classes to mark' })}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {items.map((item: EligibleClassItem) => (
            <AttendanceClassCard
              key={item.class_id}
              state="pending"
              subject={item.class_name}
              classLabel={t(`myClasses.reason.${item.reason}`, { defaultValue: 'Eligible to mark' })}
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
                  pathname: '/(protected)/attendance/mark',
                  params: {
                    classId: item.class_id,
                    className: item.class_name,
                    date: selectedIso,
                  },
                } as any)
              }
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
