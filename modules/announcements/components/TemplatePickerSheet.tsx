import React from 'react';
import { Modal, Pressable, Text, View, FlatList } from 'react-native';
import { useTheme } from '@/common/theme';
import { useTemplates } from '../hooks/useAnnouncements';
import type { SystemTemplate } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (template: SystemTemplate) => void;
};

export function TemplatePickerSheet({ visible, onClose, onPick }: Props) {
  const { palette, spacing, radius, typography } = useTheme();
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
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: palette.outlineVariant }} />
          </View>
          <Text style={[typography.headlineMd, { color: palette.onSurface }]}>Pick a template</Text>
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
                <Text style={[typography.labelMd, { color: palette.onSurface }]}>{item.title}</Text>
                <Text
                  style={[typography.labelSm, { color: palette.onSurfaceVariant, marginTop: 4 }]}
                  numberOfLines={2}
                >
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
