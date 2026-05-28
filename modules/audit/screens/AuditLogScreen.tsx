// client/modules/audit/screens/AuditLogScreen.tsx
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { EmptyState } from '@/common/components/EmptyState';
import { Skeleton } from '@/common/components/Skeleton';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { AUDIT_LOG_VIEW } from '@/modules/permissions/constants/permissions';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { AuditRow } from '../components/AuditRow';
import { AuditFilterBar } from '../components/AuditFilterBar';
import { AuditDetailSheet } from '../components/AuditDetailSheet';
import type { AuditFilters, AuditLogEntry } from '../types';

function Header() {
  const { palette, spacing, typography } = useTheme();
  const { t } = useTranslation('audit');
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ width: 44, height: 44, justifyContent: 'center' }}
      >
        <Ionicons name="chevron-back" size={24} color={palette.onSurface} />
      </Pressable>
      <Text style={[typography.display, { color: palette.onSurface }]}>{t('title')}</Text>
    </View>
  );
}

export default function AuditLogScreen() {
  const { hasPermission } = useAuth();
  const { palette, spacing, radius } = useTheme();
  const { t } = useTranslation('audit');

  const [filters, setFilters] = useState<AuditFilters>({});
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAuditLogs(filters);

  const canView = hasPermission(AUDIT_LOG_VIEW);

  if (!canView) {
    return (
      <ScreenContainer scrollable={false}>
        <Header />
        <EmptyState
          icon={<Ionicons name="lock-closed-outline" size={28} color={palette.onSurfaceVariant} />}
          title={t('notAuthorized.title')}
          description={t('notAuthorized.description')}
        />
      </ScreenContainer>
    );
  }

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <ScreenContainer scrollable={false}>
      <Header />

      <AuditFilterBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <Skeleton width="100%" height={72} radius={radius.lg} />
          <Skeleton width="100%" height={72} radius={radius.lg} />
          <Skeleton width="100%" height={72} radius={radius.lg} />
        </View>
      ) : (
        <FlatList
          style={{ marginTop: spacing.lg }}
          data={items}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => <AuditRow entry={item} onPress={setSelected} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: spacing.lg }}>
                <ActivityIndicator color={palette.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={
                <Ionicons
                  name={isError ? 'alert-circle-outline' : 'document-text-outline'}
                  size={28}
                  color={isError ? palette.error : palette.onSurfaceVariant}
                />
              }
              title={isError ? t('error.title') : t('empty.title')}
              description={isError ? t('error.description') : t('empty.description')}
              action={isError ? { label: t('retry'), onPress: () => refetch() } : undefined}
            />
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
        />
      )}

      <AuditDetailSheet
        entry={selected}
        visible={selected !== null}
        onClose={() => setSelected(null)}
      />
    </ScreenContainer>
  );
}
