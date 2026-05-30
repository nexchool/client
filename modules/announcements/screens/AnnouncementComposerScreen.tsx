import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, KeyboardAvoidingView, ScrollView, View, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';
import { Skeleton } from '@/common/components/Skeleton';
import { FormField, FormSection, FormTextArea } from '@/common/forms';

import { AudiencePicker } from '../components/AudiencePicker';
import { AttachmentUploader } from '../components/AttachmentUploader';
import { TemplatePickerSheet } from '../components/TemplatePickerSheet';
import { MarkdownView } from '../components/MarkdownView';
import {
  useAnnouncement,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  usePublishAnnouncement,
  useScheduleAnnouncement,
  useUnscheduleAnnouncement,
} from '../hooks/useAnnouncements';
import { composeAnnouncementSchema, type ComposeAnnouncementInput } from '../validation/schemas';
import type { AnnouncementAttachment, AudienceJson, SystemTemplate } from '../types';

export default function AnnouncementComposerScreen() {
  const { t } = useTranslation('announcements');
  const { palette, spacing, radius } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;

  const detail = useAnnouncement(params.id, isEdit);
  const createMutation = useCreateAnnouncement();
  // Always call useUpdateAnnouncement to satisfy hook order — id may be empty string when creating.
  const updateMutation = useUpdateAnnouncement(params.id ?? '');
  const publishMutation = usePublishAnnouncement();
  const scheduleMutation = useScheduleAnnouncement();
  const unscheduleMutation = useUnscheduleAnnouncement();

  const [previewVisible, setPreviewVisible] = useState(false);
  const [templateSheetVisible, setTemplateSheetVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>([]);
  const [currentAnnouncementId, setCurrentAnnouncementId] = useState<string | undefined>(params.id);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState,
  } = useForm<ComposeAnnouncementInput>({
    resolver: zodResolver(composeAnnouncementSchema),
    defaultValues: {
      title: '',
      body_markdown: '',
      audience_json: { scope: 'all' },
    },
  });

  const liveBody = watch('body_markdown');

  // Hydrate on edit
  useEffect(() => {
    if (isEdit && detail.data) {
      const a = detail.data;
      setValue('title', a.title ?? '');
      setValue('body_markdown', a.body_markdown ?? '');
      setValue('audience_json', a.audience_json as ComposeAnnouncementInput['audience_json']);
      setAttachments(a.attachments ?? []);
      setCurrentAnnouncementId(a.id);
    }
  }, [isEdit, detail.data, setValue]);

  const status = detail.data?.status ?? 'draft';
  const isRecalled = status === 'recalled';
  const isPublished = status === 'published';
  const isScheduled = status === 'scheduled';

  const handleBack = React.useCallback(() => {
    if (formState.isDirty) {
      Alert.alert(
        t('discard.title', { defaultValue: 'Discard?' }),
        t('discard.body', { defaultValue: 'Your unsaved changes will be lost.' }),
        [
          { text: t('discard.keep', { defaultValue: 'Keep editing' }), style: 'cancel' },
          {
            text: t('discard.confirm', { defaultValue: 'Discard' }),
            style: 'destructive',
            onPress: () => router.back(),
          },
        ],
      );
    } else {
      router.back();
    }
  }, [formState.isDirty, t]);

  useEffect(() => {
    const onBack = () => {
      if (formState.isDirty) {
        handleBack();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [formState.isDirty, handleBack]);

  const persistDraft = async (data: ComposeAnnouncementInput): Promise<string> => {
    if (currentAnnouncementId) {
      await updateMutation.mutateAsync({
        title: data.title,
        body_markdown: data.body_markdown,
        audience_json: data.audience_json as AudienceJson,
      });
      return currentAnnouncementId;
    }
    const created = (await createMutation.mutateAsync({
      title: data.title,
      body_markdown: data.body_markdown,
      audience_json: data.audience_json as AudienceJson,
    })) as unknown as { id: string };
    setCurrentAnnouncementId(created.id);
    return created.id;
  };

  const onSaveDraft = async (data: ComposeAnnouncementInput) => {
    try {
      await persistDraft(data);
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Try again';
      Alert.alert(t('error.save', { defaultValue: 'Could not save' }), message);
    }
  };

  const onSendNow = async (data: ComposeAnnouncementInput) => {
    try {
      const id = await persistDraft(data);
      await publishMutation.mutateAsync(id);
      router.replace({ pathname: '/(protected)/announcements/[id]', params: { id } } as never);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Try again';
      Alert.alert(t('error.send', { defaultValue: 'Could not send' }), message);
    }
  };

  const onSchedule = async (data: ComposeAnnouncementInput) => {
    if (scheduledDate.getTime() <= Date.now() + 60_000) {
      Alert.alert(
        t('error.schedule.title', { defaultValue: 'Pick a future time' }),
        t('error.schedule.body', { defaultValue: 'Schedule must be at least 1 minute in the future.' }),
      );
      return;
    }
    try {
      const id = await persistDraft(data);
      await scheduleMutation.mutateAsync({ id, scheduled_at: scheduledDate.toISOString() });
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Try again';
      Alert.alert(t('error.schedule.title', { defaultValue: 'Could not schedule' }), message);
    }
  };

  const onUnschedule = async () => {
    if (!currentAnnouncementId) return;
    try {
      await unscheduleMutation.mutateAsync(currentAnnouncementId);
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Try again';
      Alert.alert(t('error.unschedule', { defaultValue: 'Could not unschedule' }), message);
    }
  };

  const handleTemplatePick = (template: SystemTemplate) => {
    const doApply = () => {
      setValue('title', template.title, { shouldDirty: true });
      setValue('body_markdown', template.body_markdown, { shouldDirty: true });
    };
    if (formState.isDirty) {
      Alert.alert(
        t('template.confirm.title', { defaultValue: 'Replace draft?' }),
        t('template.confirm.body', { defaultValue: 'This will overwrite your current title + body.' }),
        [
          { text: t('template.confirm.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
          { text: t('template.confirm.replace', { defaultValue: 'Replace' }), onPress: doApply },
        ],
      );
    } else {
      doApply();
    }
  };

  if (isEdit && detail.isLoading && !detail.data) {
    return (
      <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
        <Skeleton width="100%" height={400} radius={radius.lg} />
      </View>
    );
  }

  if (isRecalled) {
    return (
      <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
        <Text variant="bodyMd" color="error" style={{ marginTop: spacing.xl }}>
          {t('readonly.recalled', { defaultValue: 'This announcement has been recalled and cannot be edited.' })}
        </Text>
        <Button variant="ghost" onPress={() => router.back()}>
          {t('back', { defaultValue: 'Back' })}
        </Button>
      </View>
    );
  }

  const submittingAny =
    createMutation.isPending ||
    updateMutation.isPending ||
    publishMutation.isPending ||
    scheduleMutation.isPending ||
    unscheduleMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={20}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppIcon
          name="chevron-back"
          size="lg"
          color="onSurface"
          onPress={handleBack}
          accessibilityLabel={t('back', { defaultValue: 'Back' })}
        />
        <Link onPress={() => setTemplateSheetVisible(true)}>
          {t('templates.link', { defaultValue: 'Templates' })}
        </Link>
      </View>

      <Text variant="display" color="onSurface" style={{ marginTop: spacing.xs }}>
        {isEdit
          ? t('compose.editTitle', { defaultValue: 'Edit announcement' })
          : t('compose.newTitle', { defaultValue: 'New announcement' })}
      </Text>

      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: 200 }}>
        <FormSection title={t('section.content', { defaultValue: 'Content' })}>
          <FormField
            control={control}
            name="title"
            label={t('field.title', { defaultValue: 'Title' })}
            placeholder={t('field.titlePlaceholder', { defaultValue: 'School closure tomorrow' })}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Link onPress={() => setPreviewVisible(!previewVisible)}>
              {previewVisible
                ? t('preview.edit', { defaultValue: 'Edit' })
                : t('preview.show', { defaultValue: 'Preview' })}
            </Link>
          </View>
          {previewVisible ? (
            <View
              style={{
                padding: spacing.md,
                borderRadius: radius.md,
                backgroundColor: palette.surfaceContainerLowest,
                borderWidth: 1,
                borderColor: palette.outlineVariant,
                minHeight: 132,
              }}
            >
              <MarkdownView source={liveBody} />
            </View>
          ) : (
            <FormTextArea
              control={control}
              name="body_markdown"
              label={t('field.body', { defaultValue: 'Body (markdown)' })}
              placeholder={t('field.bodyPlaceholder', { defaultValue: 'Use **bold**, lists, links…' })}
              numberOfLines={8}
            />
          )}
        </FormSection>

        <FormSection title={t('section.audience', { defaultValue: 'Audience' })}>
          <Controller
            control={control}
            name="audience_json"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <AudiencePicker
                value={value as AudienceJson}
                onChange={onChange as (next: AudienceJson) => void}
                error={error?.message}
              />
            )}
          />
        </FormSection>

        <FormSection title={t('section.attachments', { defaultValue: 'Attachments' })}>
          <AttachmentUploader
            attachments={attachments}
            announcementId={currentAnnouncementId}
            onAttachmentAdded={(a) => setAttachments((cur) => [...cur, a])}
            onAttachmentRemoved={(id) => setAttachments((cur) => cur.filter((x) => x.id !== id))}
          />
        </FormSection>
      </ScrollView>

      {/* Footer action area */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.lg,
          backgroundColor: palette.surface,
          gap: spacing.sm,
        }}
      >
        {isPublished ? (
          <Button variant="primary" fullWidth loading={submittingAny} onPress={handleSubmit(onSaveDraft)}>
            {t('action.saveChanges', { defaultValue: 'Save changes' })}
          </Button>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button variant="ghost" fullWidth onPress={handleSubmit(onSaveDraft)} disabled={submittingAny}>
                  {t('action.saveDraft', { defaultValue: 'Save draft' })}
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  variant="ghost"
                  fullWidth
                  onPress={() => setShowDatePicker(true)}
                  disabled={submittingAny}
                >
                  {isScheduled
                    ? t('action.reschedule', { defaultValue: 'Reschedule' })
                    : t('action.schedule', { defaultValue: 'Schedule' })}
                </Button>
              </View>
            </View>
            {isScheduled ? (
              <Button variant="ghost" fullWidth onPress={onUnschedule} disabled={submittingAny}>
                {t('action.unschedule', { defaultValue: 'Unschedule' })}
              </Button>
            ) : null}
            <Button variant="primary" fullWidth loading={submittingAny} onPress={handleSubmit(onSendNow)}>
              {t('action.sendNow', { defaultValue: 'Send now' })}
            </Button>
          </>
        )}
      </View>

      {showDatePicker ? (
        <DateTimePicker
          value={scheduledDate}
          mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, d) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (d) {
              setScheduledDate(d);
              if (Platform.OS === 'android') {
                // Android fires once; submit immediately after picking.
                handleSubmit(onSchedule)();
              }
            }
          }}
          minimumDate={new Date()}
        />
      ) : null}
      {Platform.OS === 'ios' && showDatePicker ? (
        <View style={{ position: 'absolute', bottom: 200, right: spacing.lg }}>
          <Button variant="primary" onPress={() => { setShowDatePicker(false); handleSubmit(onSchedule)(); }}>
            {t('schedule.confirm', { defaultValue: 'Confirm' })}
          </Button>
        </View>
      ) : null}

      <TemplatePickerSheet
        visible={templateSheetVisible}
        onClose={() => setTemplateSheetVisible(false)}
        onPick={handleTemplatePick}
      />
    </KeyboardAvoidingView>
  );
}
