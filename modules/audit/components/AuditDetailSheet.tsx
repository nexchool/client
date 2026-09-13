// client/modules/audit/components/AuditDetailSheet.tsx
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { BottomSheet } from '@/common/components/sheet';
import { useModalBodyHeight } from '@/common/hooks/useModalBodyHeight';
import type { AuditLogEntry } from '../types';
import { formatDateTimeFull } from '@/common/utils/datetime';

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
  const { spacing } = useTheme();
  const bodyHeight = useModalBodyHeight(420);
  const { t } = useTranslation('audit');

  if (!entry) return null;

  const rows = metaRows(entry.meta);
  const when = formatDateTimeFull(entry.created_at);
  const resource = entry.resource_id ? `${entry.resource_type} · ${entry.resource_id}` : entry.resource_type;

  const labeledRow = (label: string, value: string) => (
    <View key={label} style={{ gap: 2 }}>
      <Text variant="labelSm" color="onSurfaceVariant">
        {label}
      </Text>
      <Text variant="bodyMd" color="onSurface">
        {value}
      </Text>
    </View>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose}>
          <Text variant="headlineMd" color="onSurface">
            {entry.action}
          </Text>
          <ScrollView style={{ maxHeight: bodyHeight }} contentContainerStyle={{ gap: spacing.md }} showsVerticalScrollIndicator={false}>
            {labeledRow(t('detail.actor'), `${entry.actor_name} · ${entry.actor_role}`)}
            {labeledRow(t('detail.module'), entry.module)}
            {labeledRow(t('detail.resource'), resource)}
            {labeledRow(t('detail.when'), when)}
            {labeledRow(t('detail.description'), entry.description)}
            <View style={{ gap: spacing.sm }}>
              <Text variant="labelSm" color="onSurfaceVariant">
                {t('detail.meta')}
              </Text>
              {rows.length === 0 ? (
                <Text variant="bodyMd" color="onSurface">
                  {t('detail.noMeta')}
                </Text>
              ) : (
                rows.map((r) => (
                  <View
                    key={r.key}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}
                  >
                    <Text variant="labelMd" color="onSurfaceVariant" style={{ flexShrink: 1 }}>
                      {r.key}
                    </Text>
                    <Text variant="labelMd" color="onSurface" style={{ flex: 1, textAlign: 'right' }}>
                      {r.value}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
    </BottomSheet>
  );
}
