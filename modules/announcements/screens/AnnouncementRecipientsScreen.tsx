import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Skeleton } from '@/common/components/Skeleton';
import { useAnnouncementRecipients } from '../hooks/useAnnouncements';
import { ReadReceiptCounter } from '../components/ReadReceiptCounter';

export default function AnnouncementRecipientsScreen() {
  const { t } = useTranslation('announcements');
  const { palette, spacing, radius, elevation } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipients = [], isLoading } = useAnnouncementRecipients(id);

  const counts = useMemo(() => {
    const total = recipients.length;
    const read = recipients.filter((r) => !!r.read_at).length;
    return { total, read };
  }, [recipients]);

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
      <AppIcon
        name="chevron-back"
        size="lg"
        color="onSurface"
        onPress={() => router.back()}
        accessibilityLabel={t('back', { defaultValue: 'Back' })}
      />

      <Text variant="display" color="onSurface" style={{ marginTop: spacing.xs }}>
        {t('recipients.title', { defaultValue: 'Recipients' })}
      </Text>

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
        />
      )}
    </View>
  );
}
