import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Skeleton } from '@/common/components/Skeleton';
import { PageHeader } from '@/common/components/PageHeader';
import { useAnnouncementRecipients } from '../hooks/useAnnouncements';
import { ReadReceiptCounter } from '../components/ReadReceiptCounter';

export default function AnnouncementRecipientsScreen() {
  const { t } = useTranslation('announcements');
  const { palette, spacing, radius, elevation } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAnnouncementRecipients(id);

  const recipients = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  // Off the envelope, not off `recipients` — the roster is paged, so measuring
  // the rows in hand would report "20 / 20" for a notice sent to 4,000 parents.
  const counts = {
    total: data?.pages[0]?.total ?? 0,
    read: data?.pages[0]?.read_count ?? 0,
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile }}>
      <PageHeader
        title={t('recipients.title', { defaultValue: 'Recipients' })}
        onBack={() => router.back()}
        backLabel={t('back', { defaultValue: 'Back' })}
        noHorizontalPadding
        divider={false}
      />

      <View style={{ marginTop: spacing.md, marginBottom: spacing.md }}>
        <ReadReceiptCounter readCount={counts.read} totalCount={counts.total} />
      </View>

      {isLoading ? (
        <Skeleton width="100%" height={300} radius={radius.lg} />
      ) : (
        <FlatList
          data={recipients}
          keyExtractor={(item) => item.user_id}
          renderItem={({ item }) => (
            <View
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: palette.surfaceContainerLowest,
                  gap: spacing.sm,
                },
                elevation.card,
              ]}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.full,
                  backgroundColor: palette.primaryContainer,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="labelMd" color="onPrimaryContainer">
                  {(item.name?.[0] ?? '?').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="labelMd" color="onSurface">
                  {item.name}
                </Text>
                <Text variant="labelSm" color="onSurfaceVariant">
                  {item.read_at
                    ? t('recipients.readAt', { defaultValue: 'Read' }) +
                      ' · ' +
                      new Date(item.read_at).toLocaleString()
                    : t('recipients.unread', { defaultValue: 'Unread' })}
                </Text>
              </View>
              {item.read_at ? (
                <AppIcon name="eye-outline" size="md" color="success" />
              ) : (
                <AppIcon name="time-outline" size="md" color="onSurfaceVariant" />
              )}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.scrollBottom }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: spacing.md }}>
                <Skeleton width="100%" height={64} radius={radius.lg} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
