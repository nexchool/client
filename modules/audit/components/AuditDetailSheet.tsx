// client/modules/audit/components/AuditDetailSheet.tsx
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/common/theme';
import type { AuditLogEntry } from '../types';

function metaRows(meta: Record<string, unknown> | null): { key: string; value: string }[] {
  if (!meta) return [];
  return Object.entries(meta).map(([k, v]) => ({
    key: k,
    value:
      v === null || v === undefined ? '—'
      : typeof v === 'object' ? JSON.stringify(v)
      : String(v),
  }));
}

type Props = {
  entry: AuditLogEntry | null;
  visible: boolean;
  onClose: () => void;
};

export function AuditDetailSheet({ entry, visible, onClose }: Props) {
  const { palette, spacing, radius, typography } = useTheme();

  if (!entry) return null;

  const rows = metaRows(entry.meta);
  const when = entry.created_at ? new Date(entry.created_at).toLocaleString() : '—';
  const resource = entry.resource_id ? `${entry.resource_type} · ${entry.resource_id}` : entry.resource_type;

  const labeledRow = (label: string, value: string) => (
    <View key={label} style={{ gap: 2 }}>
      <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>{label}</Text>
      <Text style={[typography.bodyMd, { color: palette.onSurface }]}>{value}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            marginTop: 'auto',
            maxHeight: '85%',
            backgroundColor: palette.surfaceContainerLowest,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.lg,
            gap: spacing.md,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: palette.outlineVariant }} />
          </View>
          <Text style={[typography.headlineMd, { color: palette.onSurface }]}>{entry.action}</Text>
          <ScrollView contentContainerStyle={{ gap: spacing.md }} showsVerticalScrollIndicator={false}>
            {labeledRow('Actor', `${entry.actor_name} · ${entry.actor_role}`)}
            {labeledRow('Module', entry.module)}
            {labeledRow('Resource', resource)}
            {labeledRow('When', when)}
            {labeledRow('Description', entry.description)}
            <View style={{ gap: spacing.sm }}>
              <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>Details</Text>
              {rows.length === 0 ? (
                <Text style={[typography.bodyMd, { color: palette.onSurface }]}>No additional detail.</Text>
              ) : (
                rows.map((r) => (
                  <View
                    key={r.key}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}
                  >
                    <Text style={[typography.labelMd, { color: palette.onSurfaceVariant, flexShrink: 1 }]}>
                      {r.key}
                    </Text>
                    <Text
                      style={[typography.labelMd, { color: palette.onSurface, flex: 1, textAlign: 'right' }]}
                    >
                      {r.value}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
