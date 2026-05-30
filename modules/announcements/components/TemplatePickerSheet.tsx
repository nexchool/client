import React from 'react';
import { Modal, Pressable, View, FlatList } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
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
            <View style={{ width: 40, height: 4, borderRadius: radius.sm, backgroundColor: palette.outlineVariant }} />
          </View>
          <Text variant="headlineMd" color="onSurface">Pick a template</Text>
          <FlatList
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}
