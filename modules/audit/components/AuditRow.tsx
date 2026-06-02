// client/modules/audit/components/AuditRow.tsx
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { PressScale } from '@/common/components/PressScale';
import type { Palette } from '@/common/theme';
import type { AuditLogEntry } from '../types';

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

// Soft accent on the avatar, tinted by the actor's role so scanning a long
// log groups visually. Falls back to the neutral secondary container.
const ROLE_ACCENT: Record<string, keyof Palette> = {
  admin: 'primary',
  principal: 'tertiary',
  teacher: 'secondary',
  staff: 'secondary',
};

type Props = {
  entry: AuditLogEntry;
  onPress: (entry: AuditLogEntry) => void;
};

export function AuditRow({ entry, onPress }: Props) {
  const { palette, spacing, radius, avatarSize } = useTheme();
  const initial = (entry.actor_name?.trim()?.[0] ?? '?').toUpperCase();
  const accent = ROLE_ACCENT[entry.actor_role?.toLowerCase()] ?? 'secondary';

  return (
    <PressScale onPress={() => onPress(entry)}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingVertical: spacing.md,
          gap: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: palette.surfaceContainerHigh,
        }}
      >
        <View
          style={{
            width: avatarSize.md,
            height: avatarSize.md,
            borderRadius: radius.full,
            backgroundColor: palette.surfaceContainer,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="labelMd" style={{ color: palette[accent] }}>
            {initial}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
              <Text variant="bodyMd" color="onSurface" style={{ flexShrink: 1 }} numberOfLines={1}>
                {entry.actor_name}
              </Text>
              <View
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 2,
                  borderRadius: radius.full,
                  backgroundColor: palette.surfaceContainer,
                }}
              >
                <Text variant="labelSm" style={{ color: palette[accent] }} numberOfLines={1}>
                  {entry.actor_role}
                </Text>
              </View>
            </View>
            <Text variant="labelSm" color="onSurfaceVariant">
              {relativeTime(entry.created_at)}
            </Text>
          </View>
          <Text variant="labelMd" color="onSurfaceVariant" style={{ marginTop: 2 }}>
            {entry.action} · {entry.module}
          </Text>
          {entry.description ? (
            <Text variant="labelMd" color="onSurface" style={{ marginTop: 2 }} numberOfLines={1}>
              {entry.description}
            </Text>
          ) : null}
        </View>
      </View>
    </PressScale>
  );
}
