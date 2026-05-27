import React, { useMemo } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Skeleton } from '@/common/components/Skeleton';
import { Ionicons } from '@expo/vector-icons';
import { useAnnouncementRecipients } from '../hooks/useAnnouncements';
import { ReadReceiptCounter } from '../components/ReadReceiptCounter';

export default function AnnouncementRecipientsScreen() {
  const { t } = useTranslation('announcements');
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipients = [], isLoading } = useAnnouncementRecipients(id);

  const counts = useMemo(() => {
    const total = recipients.length;
    const read = recipients.filter((r) => !!r.read_at).length;
    return { total, read };
  }, [recipients]);

  return (
    <ScreenContainer>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ width: 44, height: 44, justifyContent: 'center' }}
      >
        <Ionicons name="chevron-back" size={24} color={palette.onSurface} />
      </Pressable>

      <Text
        style={[typography.display, { color: palette.onSurface, marginTop: spacing.xs }]}
      >
        {t('recipients.title', { defaultValue: 'Recipients' })}
      </Text>

      <View style={{ marginTop: spacing.md, marginBottom: spacing.md }}>
        <ReadReceiptCounter readCount={counts.read} totalCount={counts.total} />
      </View>

      {isLoading ? (
        <Skeleton width="100%" height={300} radius={16} />
      ) : (
        <FlatList
          data={recipients}
          keyExtractor={(item) => item.user_id}
          renderItem={({ item }) => (
            <View
              style={[
                elevation.card,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: palette.surfaceContainerLowest,
                  gap: spacing.sm,
                },
              ]}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: palette.primaryContainer,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={[typography.labelMd, { color: palette.onPrimaryContainer }]}
                >
                  {(item.name?.[0] ?? '?').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.labelMd, { color: palette.onSurface }]}>
                  {item.name}
                </Text>
                <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
                  {item.read_at
                    ? t('recipients.readAt', { defaultValue: 'Read' }) +
                      ' · ' +
                      new Date(item.read_at).toLocaleString()
                    : t('recipients.unread', { defaultValue: 'Unread' })}
                </Text>
              </View>
              {item.read_at ? (
                <Ionicons name="eye-outline" size={20} color={palette.success} />
              ) : (
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={palette.onSurfaceVariant}
                />
              )}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </ScreenContainer>
  );
}
