import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/common/theme';
import {
  useUploadAnnouncementAttachment,
  useDeleteAnnouncementAttachment,
} from '../hooks/useAnnouncements';
import type { AnnouncementAttachment } from '../types';

type Props = {
  attachments: AnnouncementAttachment[];
  announcementId?: string;
  onAttachmentAdded: (att: AnnouncementAttachment) => void;
  onAttachmentRemoved: (id: string) => void;
};

export function AttachmentUploader({
  attachments,
  announcementId,
  onAttachmentAdded,
  onAttachmentRemoved,
}: Props) {
  const { palette, spacing, radius, typography } = useTheme();
  const uploadMutation = useUploadAnnouncementAttachment();
  const deleteMutation = useDeleteAnnouncementAttachment();

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: false });
      if (res.canceled || !res.assets[0]) return;
      const asset = res.assets[0];
      const att = (await uploadMutation.mutateAsync({
        file: { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' },
        announcement_id: announcementId,
      })) as unknown as AnnouncementAttachment;
      onAttachmentAdded(att);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      Alert.alert('Upload failed', e?.message ?? 'Try again');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      onAttachmentRemoved(id);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      Alert.alert('Delete failed', e?.message ?? 'Try again');
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[typography.labelMd, { color: palette.onSurfaceVariant }]}>Attachments</Text>
      {attachments.map((a) => (
        <View
          key={a.id}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.md,
            borderRadius: radius.lg,
            backgroundColor: palette.surfaceContainerLowest,
            borderWidth: 1,
            borderColor: palette.outlineVariant,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[typography.labelMd, { color: palette.onSurface }]} numberOfLines={1}>
              {a.original_filename ?? 'file'}
            </Text>
            <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
              {a.content_type ?? ''}
            </Text>
          </View>
          <Pressable onPress={() => handleDelete(a.id)} hitSlop={8}>
            <Ionicons name="close-circle-outline" size={22} color={palette.error} />
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={pickFile}
        disabled={uploadMutation.isPending}
        style={({ pressed }) => ({
          padding: spacing.md,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: palette.outlineVariant,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed || uploadMutation.isPending ? 0.7 : 1,
          flexDirection: 'row',
          gap: spacing.sm,
        })}
      >
        <Ionicons name="add" size={20} color={palette.primary} />
        <Text style={[typography.labelMd, { color: palette.primary }]}>
          {uploadMutation.isPending ? 'Uploading…' : 'Add attachment'}
        </Text>
      </Pressable>
    </View>
  );
}
