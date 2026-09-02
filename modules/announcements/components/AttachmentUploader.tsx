import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
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

/**
 * What an announcement attachment may be, mirroring the server's allowlist in
 * `modules/announcements/services.py`. Picking with a wildcard offered every
 * file on the device, and the refusal only arrived after the upload had
 * already gone up.
 */
const ATTACHMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function AttachmentUploader({
  attachments,
  announcementId,
  onAttachmentAdded,
  onAttachmentRemoved,
}: Props) {
  const { palette, spacing, radius } = useTheme();
  const uploadMutation = useUploadAnnouncementAttachment();
  const deleteMutation = useDeleteAnnouncementAttachment();

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ATTACHMENT_TYPES, multiple: false });
      if (res.canceled || !res.assets[0]) return;
      const asset = res.assets[0];
      const att = (await uploadMutation.mutateAsync({
        file: { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' },
        announcement_id: announcementId,
      })) as unknown as AnnouncementAttachment;
      onAttachmentAdded(att);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Try again';
      Alert.alert('Upload failed', message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      onAttachmentRemoved(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Try again';
      Alert.alert('Delete failed', message);
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="labelMd" color="onSurfaceVariant">Attachments</Text>
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
            <Text variant="labelMd" color="onSurface" numberOfLines={1}>
              {a.original_filename ?? 'file'}
            </Text>
            <Text variant="labelSm" color="onSurfaceVariant">
              {a.content_type ?? ''}
            </Text>
          </View>
          <AppIcon
            name="close-circle-outline"
            size="lg"
            color="error"
            onPress={() => handleDelete(a.id)}
            accessibilityLabel="Remove attachment"
          />
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
        <AppIcon name="add" size="md" color="primary" />
        <Text variant="labelMd" color="primary">
          {uploadMutation.isPending ? 'Uploading…' : 'Add attachment'}
        </Text>
      </Pressable>
    </View>
  );
}
