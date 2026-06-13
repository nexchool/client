import React, { useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';
import { Skeleton } from '@/common/components/Skeleton';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';
import { Input } from '@/common/components/Input';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { announcementService } from '../services/announcementService';
import {
  useAnnouncement,
  useAnnouncementRevisions,
  useRecallAnnouncement,
} from '../hooks/useAnnouncements';
import { MarkdownView } from '../components/MarkdownView';
import { STATUS_LABEL, statusAccent } from '../constants';

export default function AnnouncementDetailScreen() {
  const { t } = useTranslation('announcements');
  const { palette, spacing, radius, elevation } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAdmin } = useUiRole();
  const detail = useAnnouncement(id);
  const revisionsQuery = useAnnouncementRevisions(id);
  const recallMutation = useRecallAnnouncement();

  const [showRevisions, setShowRevisions] = useState(false);
  const [recallVisible, setRecallVisible] = useState(false);
  const [recallReason, setRecallReason] = useState('');

  if (detail.isLoading || !detail.data) {
    return (
      <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
        <Skeleton width="100%" height={400} radius={radius.lg} />
      </View>
    );
  }

  const a = detail.data;
  const isRecalled = a.status === 'recalled';
  const canRecall = isAdmin && a.status === 'published';
  const canEdit = isAdmin && a.status !== 'recalled';
  const accent = statusAccent(a.status);

  const handleAttachmentTap = async (attachmentId: string) => {
    try {
      const res = await announcementService.downloadAttachment(attachmentId);
      const url = res?.url;
      if (!url) throw new Error('No URL returned');
      await Linking.openURL(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Try again';
      Alert.alert(t('attachment.error', { defaultValue: 'Could not open file' }), message);
    }
  };

  const handleRecall = async () => {
    try {
      await recallMutation.mutateAsync({ id: a.id, reason: recallReason.trim() });
      setRecallVisible(false);
      setRecallReason('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Try again';
      Alert.alert(t('recall.error', { defaultValue: 'Could not recall' }), message);
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <AppIcon
          name="chevron-back"
          size="lg"
          color="onSurface"
          onPress={() => router.back()}
          accessibilityLabel={t('back', { defaultValue: 'Back' })}
        />
        {isAdmin ? (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {canEdit ? (
              <Link
                onPress={() =>
                  router.push(
                    {
                      pathname: '/(protected)/announcements/[id]/edit',
                      params: { id: a.id },
                    } as never,
                  )
                }
              >
                {t('detail.edit', { defaultValue: 'Edit' })}
              </Link>
            ) : null}
            {canRecall ? (
              <Link onPress={() => setRecallVisible(true)}>
                {t('detail.recall', { defaultValue: 'Recall' })}
              </Link>
            ) : null}
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{ gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.scrollBottom }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
              gap: spacing.md,
            },
            elevation.card,
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: spacing.sm,
            }}
          >
            <Text variant="display" color="onSurface" style={{ flex: 1 }}>
              {a.title}
            </Text>
            <View
              style={{
                backgroundColor: palette.surfaceContainer,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: radius.full,
              }}
            >
              <Text variant="labelSm" color={accent}>
                {STATUS_LABEL[a.status] ?? a.status}
              </Text>
            </View>
          </View>

          <Text variant="labelSm" color="onSurfaceVariant">
            {a.author_name ?? 'Admin'}
            {a.published_at
              ? ` · ${new Date(a.published_at).toLocaleString()}`
              : a.created_at
                ? ` · ${new Date(a.created_at).toLocaleString()}`
                : ''}
            {a.revision_count > 1
              ? ` · ${t('detail.edited', { defaultValue: 'Edited' })}`
              : ''}
          </Text>

          {isRecalled ? (
            <View
              style={{
                backgroundColor: palette.errorContainer,
                padding: spacing.md,
                borderRadius: radius.lg,
              }}
            >
              <Text variant="labelSm" color="onErrorContainer">
                {t('detail.recalled', { defaultValue: 'Recalled' })}
              </Text>
              {a.recalled_reason ? (
                <Text variant="bodyMd" color="onErrorContainer" style={{ marginTop: spacing.xs }}>
                  {a.recalled_reason}
                </Text>
              ) : null}
            </View>
          ) : (
            <MarkdownView source={a.body_markdown} />
          )}
        </View>

        {a.attachments && a.attachments.length > 0 ? (
          <View
            style={[
              {
                backgroundColor: palette.surfaceContainerLowest,
                borderRadius: radius.xl,
                padding: spacing.lg,
                gap: spacing.sm,
              },
              elevation.card,
            ]}
          >
            <Text variant="labelMd" color="onSurfaceVariant">
              {t('detail.attachments', { defaultValue: 'Attachments' })}
            </Text>
            {a.attachments.map((att) => (
              <Pressable
                key={att.id}
                onPress={() => handleAttachmentTap(att.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: pressed ? palette.surfaceContainer : 'transparent',
                  gap: spacing.sm,
                })}
              >
                <AppIcon name="document-attach-outline" size="md" color="primary" />
                <Text variant="labelMd" color="onSurface" style={{ flex: 1 }} numberOfLines={1}>
                  {att.original_filename ?? 'file'}
                </Text>
                <AppIcon name="download-outline" size="md" color="onSurfaceVariant" />
              </Pressable>
            ))}
          </View>
        ) : null}

        {isAdmin ? (
          <PressScale
            onPress={() =>
              router.push(
                {
                  pathname: '/(protected)/announcements/[id]/recipients',
                  params: { id: a.id },
                } as never,
              )
            }
            style={{
              padding: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: palette.surfaceContainerLowest,
              borderWidth: 1,
              borderColor: palette.outlineVariant,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text variant="labelMd" color="onSurface">
              {t('detail.viewRecipients', { defaultValue: 'View recipients' })}
            </Text>
            <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
          </PressScale>
        ) : null}

        {a.revision_count > 1 ? (
          <PressScale
            onPress={() => setShowRevisions((x) => !x)}
            style={{
              padding: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: palette.surfaceContainerLowest,
              borderWidth: 1,
              borderColor: palette.outlineVariant,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text variant="labelMd" color="onSurface">
              {t('detail.revisions', { defaultValue: 'Revisions' })} ({a.revision_count})
            </Text>
            <AppIcon name={showRevisions ? 'chevron-up' : 'chevron-down'} size="md" color="onSurfaceVariant" />
          </PressScale>
        ) : null}

        {showRevisions && revisionsQuery.data ? (
          <View style={{ gap: spacing.sm }}>
            {revisionsQuery.data.map((r) => (
              <View
                key={r.id}
                style={{
                  padding: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: palette.surfaceContainerLowest,
                  borderWidth: 1,
                  borderColor: palette.outlineVariant,
                  gap: spacing.xs,
                }}
              >
                <Text variant="labelSm" color="onSurfaceVariant">
                  v{r.revision_number} · {r.edited_by_name ?? 'Admin'} ·{' '}
                  {r.edited_at ? new Date(r.edited_at).toLocaleString() : ''}
                </Text>
                <Text variant="labelMd" color="onSurface">
                  {r.title}
                </Text>
                {r.edit_note ? (
                  <Text variant="labelSm" color="onSurfaceVariant">
                    {r.edit_note}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={recallVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRecallVisible(false)}
      >
        <Pressable
          onPress={() => setRecallVisible(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              marginTop: 'auto',
              backgroundColor: palette.surfaceContainerLowest,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: radius.sm,
                  backgroundColor: palette.outlineVariant,
                }}
              />
            </View>
            <Text variant="headlineMd" color="onSurface">
              {t('recall.title', { defaultValue: 'Recall announcement' })}
            </Text>
            <Text variant="bodyMd" color="onSurfaceVariant">
              {t('recall.body', {
                defaultValue: 'A recall notification will be sent to all recipients.',
              })}
            </Text>
            <Input
              label={t('recall.reasonLabel', { defaultValue: 'Reason (optional)' })}
              value={recallReason}
              onChangeText={setRecallReason}
              placeholder={t('recall.reasonPlaceholder', {
                defaultValue: 'Sent in error / Updated event details',
              })}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button variant="ghost" fullWidth onPress={() => setRecallVisible(false)}>
                  {t('recall.cancel', { defaultValue: 'Cancel' })}
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  variant="primary"
                  fullWidth
                  loading={recallMutation.isPending}
                  onPress={handleRecall}
                >
                  {t('recall.confirm', { defaultValue: 'Recall' })}
                </Button>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
