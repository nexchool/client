// client/modules/notifications/components/NotificationRow.tsx
import React, { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { stripHtmlToPlainText } from '@/modules/notifications/formatNotificationBody';
import type { AppNotification } from '@/modules/notifications/types';

function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type Props = {
  item: AppNotification;
  isLast: boolean;
  onPress: (item: AppNotification) => void;
  onMarkRead: (id: string) => void;
};

export function NotificationRow({ item, isLast, onPress, onMarkRead }: Props) {
  const { t } = useTranslation('notifications');
  const { palette, spacing, typography } = useTheme();
  const swipeRef = useRef<Swipeable>(null);
  const isUnread = !item.read_at;
  const preview = stripHtmlToPlainText(item.body);

  const rowBody = (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? palette.surfaceContainer : palette.surfaceContainerLowest,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: spacing.md,
          gap: spacing.md,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: palette.surfaceContainerHigh,
        }}
      >
        <View style={{ width: 8, paddingTop: 6 }}>
          {isUnread ? (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.primary }} />
          ) : null}
        </View>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.secondaryContainer,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={isUnread ? 'notifications' : 'notifications-outline'}
            size={20}
            color={palette.onSecondaryContainer}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
            <Text
              style={[
                typography.bodyMd,
                { color: palette.onSurface, flex: 1, fontFamily: isUnread ? 'Inter_600SemiBold' : undefined },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
              {relativeTime(item.created_at)}
            </Text>
          </View>
          {preview ? (
            <Text style={[typography.labelMd, { color: palette.onSurfaceVariant, marginTop: 2 }]} numberOfLines={2}>
              {preview}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );

  if (!isUnread) {
    return rowBody;
  }

  const renderRightActions = () => (
    <Pressable
      onPress={() => {
        onMarkRead(item.id);
        swipeRef.current?.close();
      }}
      style={{
        backgroundColor: palette.primary,
        justifyContent: 'center',
        alignItems: 'center',
        width: 96,
      }}
    >
      <Ionicons name="checkmark-done" size={20} color={palette.onPrimary} />
      <Text style={[typography.labelSm, { color: palette.onPrimary, marginTop: 2 }]}>
        {t('swipe.markRead', { defaultValue: 'Mark read' })}
      </Text>
    </Pressable>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      {rowBody}
    </Swipeable>
  );
}
