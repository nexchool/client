/**
 * TeacherFormScreen — create or edit a teacher.
 *
 * Routes: /(protected)/teachers/new      → create
 *         /(protected)/teachers/[id]/edit → edit
 *
 * Field set is the Slice 5 admin "new teacher" minimum:
 *   name, email, phone, designation, department (optional),
 *   qualification (optional), date_of_joining.
 * Subject assignment is out of scope here — handled in its own screen.
 */
import React from 'react';
import { Alert, BackHandler, Pressable, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';
import { Skeleton } from '@/common/components/Skeleton';
import { PageHeader } from '@/common/components/PageHeader';
import { FormField, FormSelectSheet, FormDatePicker, FormSection } from '@/common/forms';
import {
  useTeacher,
  useCreateTeacher,
  useUpdateTeacher,
  useTeacherDepartments,
} from '../hooks/useTeachers';
import { teacherFormSchema, type TeacherFormInput } from '../validation/schemas';
import type { CreateTeacherDTO, UpdateTeacherDTO } from '../types';
import { useDialog, useToast } from '@/common/feedback';
import { schoolTodayIso } from '@/common/utils/datetime';
import { PHONE_NUMBER_LENGTH, sanitizePhoneNumberInput } from '@/common/utils/phone';

const today = () => schoolTodayIso();

export default function TeacherFormScreen() {
  const { t } = useTranslation('teachers');
  const { confirm } = useDialog();
  const toast = useToast();
  const { palette, spacing } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;

  const detailQuery = useTeacher(params.id, isEdit);
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher(params.id ?? '');
  const departmentsQuery = useTeacherDepartments();
  // The field's value is the department's name (free text the server
  // resolves against the tenant's catalogue — see CreateTeacherDTO), so the
  // picker's options are keyed by name too, not id, to keep the form value
  // and API payload exactly as they were with the text input.
  const departmentOptions = (departmentsQuery.data ?? []).map((d) => ({
    value: d.name,
    label: d.name,
  }));

  const {
    control,
    handleSubmit,
    // Destructured here (not just `formState`) so react-hook-form's proxy
    // actually subscribes to these two fields. Its formState is Proxy-backed
    // and only stays live in production for properties read during render —
    // reading `formState.dirtyFields` solely inside the async `onSubmit`
    // callback below (never during render) left it stale there, so a real
    // edit could compute an empty `partial` and silently skip both the
    // update call and its success toast. Dev builds never showed this: the
    // optimization is disabled outside production.
    formState: { isDirty, dirtyFields },
    setError,
    reset,
  } = useForm<TeacherFormInput>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      designation: '',
      department: '',
      qualification: '',
      date_of_joining: today(),
    },
  });

  // Hydrate when editing — populate form once detail loads.
  React.useEffect(() => {
    if (!isEdit || !detailQuery.data) return;
    const teacher = detailQuery.data;
    reset({
      name: teacher.name ?? '',
      email: teacher.email ?? '',
      phone: teacher.phone ?? '',
      designation: teacher.designation ?? '',
      department: teacher.department ?? '',
      qualification: teacher.qualification ?? '',
      date_of_joining: teacher.date_of_joining ?? today(),
    });
  }, [isEdit, detailQuery.data, reset]);

  const handleBack = React.useCallback(async () => {
    if (!isDirty) {
      router.back();
      return;
    }
    const discard = await confirm({
      title: t('discard.title', { defaultValue: 'Discard changes?' }),
      description: t('discard.body', {
        defaultValue: 'Your unsaved changes will be lost.',
      }),
      tone: 'danger',
      confirmLabel: t('discard.confirm', { defaultValue: 'Discard' }),
      cancelLabel: t('discard.cancel', { defaultValue: 'Keep editing' }),
    });
    if (discard) router.back();
  }, [isDirty, t, confirm]);

  React.useEffect(() => {
    const onBackPress = () => {
      if (isDirty) {
        handleBack();
        return true; // consume — we handle navigation inside the Alert
      }
      return false; // let default back happen
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isDirty, handleBack]);

  const onSubmit = async (data: TeacherFormInput) => {
    // Build DTO — strip empty optionals so the server treats them as omitted.
    const payload: CreateTeacherDTO = {
      name: data.name,
      email: data.email,
      designation: data.designation,
      date_of_joining: data.date_of_joining,
      ...(data.phone ? { phone: data.phone } : {}),
      ...(data.department ? { department: data.department } : {}),
      ...(data.qualification ? { qualification: data.qualification } : {}),
    };

    try {
      if (isEdit) {
        // Only send fields the user actually changed; never re-send date_of_joining from this UI.
        const dirty = dirtyFields as Record<string, boolean>;
        const partial: UpdateTeacherDTO = {};
        (Object.keys(dirty) as (keyof TeacherFormInput)[]).forEach((key) => {
          if (key === 'date_of_joining') return;
          const v = (data as Record<string, unknown>)[key];
          if (v !== '' && v !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (partial as any)[key] = v;
          }
        });
        if (Object.keys(partial).length === 0) {
          // No-op submit — just navigate back, don't hit the server
          router.back();
          return;
        }
        await updateMutation.mutateAsync(partial);
        toast.success(t('detail.updated', { defaultValue: 'Teacher updated successfully' }));
        router.back();
      } else {
        const result = await createMutation.mutateAsync(payload);
        const created = result.teacher;
        if (result.credentials) {
          const credBody =
            `Email: ${result.credentials.email}\n` +
            `Employee ID: ${result.credentials.employee_id}\n` +
            `Password: ${result.credentials.password}\n\n` +
            'Share these with the teacher.';
          const navigateToDetail = () =>
            router.replace(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- expo-router typed routes don't yet include this dynamic route shape
              { pathname: '/(protected)/teachers/[id]', params: { id: created.id } } as any
            );
          // The password is shown once and nowhere else, so this stays a
          // dialog: it has to be read, and copying it is the point.
          const copyToClipboard = await confirm({
            title: t('credentials.title', { defaultValue: 'Teacher account created' }),
            description: credBody,
            confirmLabel: t('credentials.copy', { defaultValue: 'Copy credentials' }),
            cancelLabel: t('credentials.done', { defaultValue: 'Done' }),
          });
          if (copyToClipboard) {
            await Clipboard.setStringAsync(
              `Email: ${result.credentials!.email}\n` +
                `Employee ID: ${result.credentials!.employee_id}\n` +
                `Password: ${result.credentials!.password}`
            );
          }
          navigateToDetail();
        } else {
          // No email was given, so there is no account/credentials dialog to
          // read — the toast is this path's only success acknowledgement.
          toast.success(t('list.createdSimple', { defaultValue: 'Teacher created successfully' }));
          router.replace({
            pathname: '/(protected)/teachers/[id]',
            params: { id: created.id },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- expo-router typed routes don't yet include this dynamic route shape
          } as any);
        }
      }
    } catch (err) {
      // Map server validation errors into RHF setError, per api-conventions error envelope.
      // err shape: { data?: { error?: { details?: Array<{ field, issue }> } }, message? }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- service throws untyped errors
      const anyErr = err as any;
      const details: Array<{ field?: string; issue?: string; message?: string }> =
        anyErr?.data?.error?.details ?? anyErr?.data?.details ?? [];
      if (Array.isArray(details) && details.length > 0) {
        for (const d of details) {
          if (d?.field) {
            setError(d.field as Path<TeacherFormInput>, {
              message: String(d.issue ?? d.message ?? 'Invalid'),
            });
          }
        }
      } else {
        toast.error(anyErr?.message ?? 'Please try again.');
      }
    }
  };

  const loading = createMutation.isPending || updateMutation.isPending;

  if (isEdit && detailQuery.isLoading && !detailQuery.data) {
    return (
      <ScreenContainer>
        <Skeleton width="100%" height={400} radius={16} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer keyboardOffset={20} topInset={false}>
      <PageHeader
        title={
          isEdit
            ? t('form.editTitle', { defaultValue: 'Edit teacher' })
            : t('form.newTitle', { defaultValue: 'New teacher' })
        }
        onBack={handleBack}
        right={
          !isEdit ? (
            <Link onPress={handleBack}>{t('cancel', { defaultValue: 'Cancel' })}</Link>
          ) : null
        }
        noHorizontalPadding
        divider={false}
      />

      <View style={{ gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.scrollBottomWithFooter }}>
        <FormSection title={t('section.personal', { defaultValue: 'Personal info' })}>
          <FormField
            control={control}
            name="name"
            label={t('field.fullName', { defaultValue: 'Full name' })}
            autoCapitalize="words"
          />
          <FormField
            control={control}
            name="email"
            label={t('field.email', { defaultValue: 'Email' })}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
          />
          <FormField
            control={control}
            name="phone"
            label={t('field.phone', { defaultValue: 'Phone' })}
            keyboardType="number-pad"
            autoComplete="tel"
            maxLength={PHONE_NUMBER_LENGTH}
            transform={sanitizePhoneNumberInput}
          />
        </FormSection>

        <FormSection title={t('section.role', { defaultValue: 'Role' })}>
          <FormField
            control={control}
            name="designation"
            label={t('field.designation', { defaultValue: 'Designation' })}
            autoCapitalize="words"
          />
          <FormSelectSheet
            control={control}
            name="department"
            label={t('field.department', { defaultValue: 'Department' })}
            options={departmentOptions}
            allowEmpty
            emptyLabel={t('field.departmentNone', { defaultValue: 'No department' })}
            placeholder={t('field.departmentNone', { defaultValue: 'No department' })}
            disabled={departmentsQuery.isLoading}
          />
          <FormField
            control={control}
            name="qualification"
            label={t('field.qualification', { defaultValue: 'Qualification' })}
            autoCapitalize="words"
          />
          <FormDatePicker
            control={control}
            name="date_of_joining"
            label={t('field.dateOfJoining', { defaultValue: 'Date of joining' })}
            disabled={isEdit}
          />
        </FormSection>
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.marginMobile,
          backgroundColor: palette.surface,
          borderTopWidth: 1,
          borderTopColor: palette.outlineVariant,
        }}
      >
        <Button
          variant="primary"
          fullWidth
          loading={loading}
          onPress={handleSubmit(onSubmit)}
        >
          {isEdit
            ? t('save.update', { defaultValue: 'Update teacher' })
            : t('save.create', { defaultValue: 'Create teacher' })}
        </Button>
      </View>
    </ScreenContainer>
  );
}
