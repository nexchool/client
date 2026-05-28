// client/modules/audit/screens/AuditLogScreen.tsx
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View, RefreshControl } from 'react-native';
import { router } from 'expo-router';
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
      <Text style={[typography.display, { color: palette.onSurface }]}>Audit log</Text>
    </View>
  );
}

export default function AuditLogScreen() {
  const { hasPermission } = useAuth();
  const { palette, spacing, radius } = useTheme();

  const [filters, setFilters] = useState<AuditFilters>({});
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  if (!hasPermission(AUDIT_LOG_VIEW)) {
    return (
      <ScreenContainer scrollable={false}>
        <Header />
        <EmptyState
          icon={<Ionicons name="lock-closed-outline" size={28} color={palette.onSurfaceVariant} />}
          title="You don't have access"
          description="You don't have permission to view the audit log."
        />
      </ScreenContainer>
    );
  }

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
              title={isError ? 'Could not load audit log' : 'No activity yet'}
              description={
                isError
                  ? 'Something went wrong while loading the audit log.'
                  : 'Audit entries will appear here as activity happens.'
              }
              action={isError ? { label: 'Retry', onPress: () => refetch() } : undefined}
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
