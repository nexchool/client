// client/modules/audit/components/AuditRow.tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/common/theme';
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

type Props = {
  entry: AuditLogEntry;
  onPress: (entry: AuditLogEntry) => void;
};

export function AuditRow({ entry, onPress }: Props) {
  const { palette, spacing, radius, typography } = useTheme();
  const initial = (entry.actor_name?.trim()?.[0] ?? '?').toUpperCase();

  return (
    <Pressable
      onPress={() => onPress(entry)}
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
          borderBottomWidth: 1,
          borderBottomColor: palette.surfaceContainerHigh,
        }}
      >
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
          <Text style={[typography.labelMd, { color: palette.onSecondaryContainer }]}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
              <Text
                style={[typography.bodyMd, { color: palette.onSurface, flexShrink: 1 }]}
                numberOfLines={1}
              >
                {entry.actor_name}
              </Text>
              <View
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 2,
                  borderRadius: radius.full,
                  backgroundColor: palette.tertiaryContainer,
                }}
              >
                <Text style={[typography.labelSm, { color: palette.onTertiaryContainer }]} numberOfLines={1}>
                  {entry.actor_role}
                </Text>
              </View>
            </View>
            <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
              {relativeTime(entry.created_at)}
            </Text>
          </View>
          <Text style={[typography.labelMd, { color: palette.onSurfaceVariant, marginTop: 2 }]}>
            {entry.action} · {entry.module}
          </Text>
          {entry.description ? (
            <Text
              style={[typography.labelMd, { color: palette.onSurface, marginTop: 2 }]}
              numberOfLines={1}
            >
              {entry.description}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
