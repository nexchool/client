import React from 'react';
import { Pressable, FlatList } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { BottomSheet } from '@/common/components/sheet';
import { useModalBodyHeight } from '@/common/hooks/useModalBodyHeight';
import { useTemplates } from '../hooks/useAnnouncements';
import type { SystemTemplate } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (template: SystemTemplate) => void;
};

export function TemplatePickerSheet({ visible, onClose, onPick }: Props) {
  const { palette, spacing, radius } = useTheme();
  const { data: templates = [] } = useTemplates();
  const bodyHeight = useModalBodyHeight(420);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
          <Text variant="headlineMd" color="onSurface">Pick a template</Text>
          <FlatList
            style={{ maxHeight: bodyHeight }}
            data={templates}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onPick(item);
                  onClose();
                }}
                style={({ pressed }) => ({
                  padding: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: pressed ? palette.surfaceContainer : 'transparent',
                  marginBottom: spacing.sm,
                })}
              >
                <Text variant="labelMd" color="onSurface">{item.title}</Text>
                <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: spacing.xs }} numberOfLines={2}>
                  {item.body_markdown.replace(/[*_#]/g, '').slice(0, 80)}…
                </Text>
              </Pressable>
            )}
          />
    </BottomSheet>
  );
}
