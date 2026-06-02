// client/modules/audit/screens/AuditLogScreen.tsx
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, View, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
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
  const { spacing } = useTheme();
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
      <AppIcon
        name="chevron-back"
        size="lg"
        color="onSurface"
        onPress={() => router.back()}
        accessibilityLabel={t('title')}
      />
      <Text variant="display" color="onSurface">
        {t('title')}
      </Text>
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
      <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
        <Header />
        <EmptyState
          icon={<AppIcon name="lock-closed-outline" size="xl" color="onSurfaceVariant" />}
          title={t('notAuthorized.title')}
          description={t('notAuthorized.description')}
        />
      </View>
    );
  }

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
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
                <AppIcon
                  name={isError ? 'alert-circle-outline' : 'document-text-outline'}
                  size="xl"
                  color={isError ? 'error' : 'onSurfaceVariant'}
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
    </View>
  );
}
