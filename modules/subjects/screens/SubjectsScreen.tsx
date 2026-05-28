import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type UseThemeResult } from '@/common/theme';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { useMySubjects } from '@/modules/subjects/hooks/useMySubjects';
import type { MySubject, MySubjectClass } from '@/modules/subjects/types';

const KNOWN_TYPES = ['core', 'elective', 'activity'] as const;

export function SubjectsScreen() {
  const { t } = useTranslation('subjects');
  const theme = useTheme();
  const { palette, spacing } = theme;
  const { data, isLoading, isError, refetch, isRefetching } = useMySubjects();

  const subjects = data ?? [];

  const renderHeader = () => (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[theme.typography.display, { color: palette.onSurface }]}>
        {t('mine.title')}
      </Text>
      <Text style={[theme.typography.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>
        {t('mine.subtitle')}
      </Text>
    </View>
  );

  if (isLoading && !data) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.surface, padding: spacing.marginMobile }]}>
        {renderHeader()}
        <View style={{ gap: spacing.md }}>
          <Skeleton width="100%" height={120} radius={theme.radius.xl} />
          <Skeleton width="100%" height={120} radius={theme.radius.xl} />
          <Skeleton width="100%" height={120} radius={theme.radius.xl} />
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
        paddingBottom: spacing.xl * 3,
        flexGrow: 1,
      }}
      refreshControl={
        <RefreshControl refreshing={!!isRefetching} onRefresh={() => refetch()} tintColor={palette.primary} />
      }
      ListEmptyComponent={
        isError ? (
          <EmptyState
            icon={<Ionicons name="alert-circle-outline" size={36} color={palette.error} />}
            title={t('mine.errorTitle')}
            description={t('mine.errorBody')}
          />
        ) : (
          <EmptyState
            icon={<Ionicons name="book-outline" size={36} color={palette.onSurfaceVariant} />}
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
  const { palette, spacing, radius, typography, elevation } = theme;
  const typeKey = KNOWN_TYPES.includes(subject.subject_type as (typeof KNOWN_TYPES)[number])
    ? subject.subject_type
    : 'other';

  return (
    <View
      style={[
        elevation.card,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.md,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[typography.headlineMd, { color: palette.onSurface, flex: 1 }]} numberOfLines={2}>
          {subject.name}
        </Text>
        <View style={[styles.badge, { backgroundColor: palette.primaryContainer, borderRadius: radius.full }]}>
          <Text style={[typography.labelSm, { color: palette.onPrimaryContainer }]}>
            {t(`mine.type.${typeKey}`)}
          </Text>
        </View>
      </View>

      {subject.code ? (
        <View style={[styles.codeChip, { backgroundColor: palette.surfaceContainerHigh, borderRadius: radius.sm }]}>
          <Text style={[typography.labelSm, { color: palette.onSurfaceVariant, fontFamily: 'Inter_500Medium' }]}>
            {subject.code}
          </Text>
        </View>
      ) : null}

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
  const { palette, spacing, radius, typography } = theme;
  const teacherNames = cls.teachers.map((teacher) => teacher.teacher_name).filter(Boolean);
  const teacherLabel = teacherNames.length > 0 ? teacherNames.join(', ') : t('mine.teachersNone');

  return (
    <View
      style={{
        backgroundColor: palette.surfaceContainerLow,
        borderRadius: radius.lg,
        padding: spacing.md,
        gap: spacing.xs,
      }}
    >
      <View style={styles.classTopRow}>
        <Text style={[typography.labelMd, { color: palette.onSurface, flex: 1 }]} numberOfLines={1}>
          {cls.class_name}
        </Text>
        <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
          {t('mine.perWeek', { count: cls.weekly_periods })}
        </Text>
      </View>
      <View style={styles.classMetaRow}>
        <View style={styles.metaItem}>
          <Ionicons
            name={cls.is_mandatory ? 'lock-closed-outline' : 'options-outline'}
            size={13}
            color={palette.onSurfaceVariant}
          />
          <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
            {cls.is_mandatory ? t('mine.mandatory') : t('mine.elective')}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={13} color={palette.onSurfaceVariant} />
          <Text style={[typography.labelSm, { color: palette.onSurfaceVariant, flex: 1 }]} numberOfLines={1}>
            {teacherLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4 },
  codeChip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3 },
  classTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  classMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
});
