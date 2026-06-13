import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type UseThemeResult } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { useMySubjects } from '@/modules/subjects/hooks/useMySubjects';
import type { MySubject, MySubjectClass } from '@/modules/subjects/types';

const KNOWN_TYPES = ['core', 'elective', 'activity'] as const;

export function SubjectsScreen() {
  const { t } = useTranslation('subjects');
  const theme = useTheme();
  const { palette, spacing, radius } = theme;
  const { data, isLoading, isError, refetch, isRefetching } = useMySubjects();

  const subjects = data ?? [];

  const renderHeader = () => (
    <View style={{ marginBottom: spacing.lg }}>
      <Text variant="display" color="onSurface">
        {t('mine.title')}
      </Text>
      <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
        {t('mine.subtitle')}
      </Text>
    </View>
  );

  if (isLoading && !data) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.surface, padding: spacing.marginMobile }]}>
        {renderHeader()}
        <View style={{ gap: spacing.md }}>
          <Skeleton width="100%" height={120} radius={radius.xl} />
          <Skeleton width="100%" height={120} radius={radius.xl} />
          <Skeleton width="100%" height={120} radius={radius.xl} />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: palette.surface }}
      data={subjects}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <SubjectCard subject={item} theme={theme} />}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={{
        padding: spacing.marginMobile,
        gap: spacing.md,
        paddingBottom: spacing.scrollBottom,
        flexGrow: 1,
      }}
      refreshControl={
        <RefreshControl refreshing={!!isRefetching} onRefresh={() => refetch()} tintColor={palette.primary} />
      }
      ListEmptyComponent={
        isError ? (
          <EmptyState
            icon={<AppIcon name="alert-circle-outline" size="xl" color="error" />}
            title={t('mine.errorTitle')}
            description={t('mine.errorBody')}
          />
        ) : (
          <EmptyState
            icon={<AppIcon name="book-outline" size="xl" color="onSurfaceVariant" />}
            title={t('mine.emptyTitle')}
            description={t('mine.emptyBody')}
          />
        )
      }
    />
  );
}

function SubjectCard({ subject, theme }: { subject: MySubject; theme: UseThemeResult }) {
  const { t } = useTranslation('subjects');
  const { palette, spacing, radius, elevation } = theme;
  const typeKey = KNOWN_TYPES.includes(subject.subject_type as (typeof KNOWN_TYPES)[number])
    ? subject.subject_type
    : 'other';

  return (
    <View
      style={[
        elevation.card,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.lg,
          borderLeftWidth: 4,
          borderLeftColor: palette.secondaryContainer,
          padding: spacing.lg,
          gap: spacing.md,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconChip,
            { backgroundColor: palette.primaryContainer, borderRadius: radius.md },
          ]}
        >
          <AppIcon name="book" size="md" color="onPrimaryContainer" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="headlineMd" color="onSurface" numberOfLines={2}>
            {subject.name}
          </Text>
          {subject.code ? (
            <Text variant="labelMd" color="onSurfaceVariant" style={{ marginTop: spacing[2] }}>
              {subject.code}
            </Text>
          ) : null}
        </View>
        <View style={[styles.badge, { backgroundColor: palette.primaryContainer, borderRadius: radius.full }]}>
          <Text variant="labelSm" color="onPrimaryContainer">
            {t(`mine.type.${typeKey}`)}
          </Text>
        </View>
      </View>

      {subject.classes.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          {subject.classes.map((cls) => (
            <ClassRow key={cls.class_id} cls={cls} theme={theme} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ClassRow({ cls, theme }: { cls: MySubjectClass; theme: UseThemeResult }) {
  const { t } = useTranslation('subjects');
  const { palette, spacing, radius } = theme;
  const teacherNames = cls.teachers.map((teacher) => teacher.teacher_name).filter(Boolean);
  const teacherLabel = teacherNames.length > 0 ? teacherNames.join(', ') : t('mine.teachersNone');

  return (
    <View
      style={{
        backgroundColor: palette.surfaceContainerLow,
        borderRadius: radius.md,
        padding: spacing.md,
        gap: spacing.xs,
      }}
    >
      <View style={styles.classTopRow}>
        <Text variant="labelMd" color="onSurface" style={{ flex: 1 }} numberOfLines={1}>
          {cls.class_name}
        </Text>
        <Text variant="labelSm" color="onSurfaceVariant">
          {t('mine.perWeek', { count: cls.weekly_periods })}
        </Text>
      </View>
      <View style={styles.classMetaRow}>
        <View style={styles.metaItem}>
          <AppIcon
            name={cls.is_mandatory ? 'lock-closed-outline' : 'options-outline'}
            size="sm"
            color="onSurfaceVariant"
          />
          <Text variant="labelSm" color="onSurfaceVariant">
            {cls.is_mandatory ? t('mine.mandatory') : t('mine.elective')}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <AppIcon name="person-outline" size="sm" color="onSurfaceVariant" />
          <Text variant="labelSm" color="onSurfaceVariant" style={{ flex: 1 }} numberOfLines={1}>
            {teacherLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconChip: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4 },
  classTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  classMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
});
