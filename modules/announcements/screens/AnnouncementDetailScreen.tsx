import React, { useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
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
import { STATUS_LABEL } from '../constants';

export default function AnnouncementDetailScreen() {
  const { t } = useTranslation('announcements');
  const { palette, spacing, radius, typography, elevation } = useTheme();
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
      <ScreenContainer>
        <Skeleton width="100%" height={400} radius={16} />
      </ScreenContainer>
    );
  }

  const a = detail.data;
  const isRecalled = a.status === 'recalled';
  const canRecall = isAdmin && a.status === 'published';
  const canEdit = isAdmin && a.status !== 'recalled';

  const handleAttachmentTap = async (attachmentId: string) => {
    try {
      const res = await announcementService.downloadAttachment(attachmentId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const url = (res as any)?.url;
      if (!url) throw new Error('No URL returned');
      await Linking.openURL(url);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      Alert.alert(
        t('attachment.error', { defaultValue: 'Could not open file' }),
        e?.message ?? 'Try again',
      );
    }
  };

  const handleRecall = async () => {
    try {
      await recallMutation.mutateAsync({ id: a.id, reason: recallReason.trim() });
      setRecallVisible(false);
      setRecallReason('');
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      Alert.alert(
        t('recall.error', { defaultValue: 'Could not recall' }),
        e?.message ?? 'Try again',
      );
    }
  };

  const statusBg =
    a.status === 'published'
      ? `${palette.primary}22`
      : a.status === 'scheduled'
        ? `${palette.warning}22`
        : a.status === 'recalled'
          ? `${palette.error}22`
          : `${palette.outlineVariant}66`;
  const statusFg =
    a.status === 'published'
      ? palette.primary
      : a.status === 'scheduled'
        ? palette.warning
        : a.status === 'recalled'
          ? palette.error
          : palette.onSurfaceVariant;

  return (
    <ScreenContainer>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{ width: 44, height: 44, justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={24} color={palette.onSurface} />
        </Pressable>
        {isAdmin ? (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {canEdit ? (
              <Link
                onPress={() =>
                  router.push(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    {
                      pathname: '/(protected)/announcements/[id]/edit',
                      params: { id: a.id },
                    } as any,
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

      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: 100 }}>
        <View
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
              gap: spacing.md,
            },
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
            <Text style={[typography.display, { color: palette.onSurface, flex: 1 }]}>
              {a.title}
            </Text>
            <View
              style={{
                backgroundColor: statusBg,
                paddingHorizontal: spacing.sm,
                paddingVertical: 4,
                borderRadius: radius.full,
              }}
            >
              <Text style={[typography.labelSm, { color: statusFg }]}>
                {STATUS_LABEL[a.status] ?? a.status}
              </Text>
            </View>
          </View>

          <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
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
                backgroundColor: `${palette.error}22`,
                padding: spacing.md,
                borderRadius: radius.lg,
              }}
            >
              <Text
                style={[
                  typography.labelSm,
                  { color: palette.error, fontWeight: '600' },
                ]}
              >
                {t('detail.recalled', { defaultValue: 'Recalled' })}
              </Text>
              {a.recalled_reason ? (
                <Text
                  style={[typography.bodyMd, { color: palette.error, marginTop: 4 }]}
                >
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
              elevation.card,
              {
                backgroundColor: palette.surfaceContainerLowest,
                borderRadius: radius.xl,
                padding: spacing.lg,
                gap: spacing.sm,
              },
            ]}
          >
            <Text style={[typography.labelMd, { color: palette.onSurfaceVariant }]}>
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
                <Ionicons
                  name="document-attach-outline"
                  size={20}
                  color={palette.primary}
                />
                <Text
                  style={[typography.labelMd, { color: palette.onSurface, flex: 1 }]}
                  numberOfLines={1}
                >
                  {att.original_filename ?? 'file'}
                </Text>
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={palette.onSurfaceVariant}
                />
              </Pressable>
            ))}
          </View>
        ) : null}

        {isAdmin ? (
          <Pressable
            onPress={() =>
              router.push(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {
                  pathname: '/(protected)/announcements/[id]/recipients',
                  params: { id: a.id },
                } as any,
              )
            }
            style={({ pressed }) => ({
              padding: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: palette.surfaceContainerLowest,
              borderWidth: 1,
              borderColor: palette.outlineVariant,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={[typography.labelMd, { color: palette.onSurface }]}>
              {t('detail.viewRecipients', { defaultValue: 'View recipients' })}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={palette.onSurfaceVariant}
            />
          </Pressable>
        ) : null}

        {a.revision_count > 1 ? (
          <Pressable
            onPress={() => setShowRevisions((x) => !x)}
            style={({ pressed }) => ({
              padding: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: palette.surfaceContainerLowest,
              borderWidth: 1,
              borderColor: palette.outlineVariant,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={[typography.labelMd, { color: palette.onSurface }]}>
              {t('detail.revisions', { defaultValue: 'Revisions' })} ({a.revision_count})
            </Text>
            <Ionicons
              name={showRevisions ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={palette.onSurfaceVariant}
            />
          </Pressable>
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
                  gap: 4,
                }}
              >
                <Text
                  style={[typography.labelSm, { color: palette.onSurfaceVariant }]}
                >
                  v{r.revision_number} · {r.edited_by_name ?? 'Admin'} ·{' '}
                  {r.edited_at ? new Date(r.edited_at).toLocaleString() : ''}
                </Text>
                <Text style={[typography.labelMd, { color: palette.onSurface }]}>
                  {r.title}
                </Text>
                {r.edit_note ? (
                  <Text
                    style={[typography.labelSm, { color: palette.onSurfaceVariant }]}
                  >
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
                  borderRadius: 2,
                  backgroundColor: palette.outlineVariant,
                }}
              />
            </View>
            <Text style={[typography.headlineMd, { color: palette.onSurface }]}>
              {t('recall.title', { defaultValue: 'Recall announcement' })}
            </Text>
            <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]}>
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
    </ScreenContainer>
  );
}
