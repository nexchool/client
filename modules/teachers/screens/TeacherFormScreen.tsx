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
import { Alert, BackHandler, Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useForm, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';
import { Skeleton } from '@/common/components/Skeleton';
import { FormField, FormDatePicker, FormSection } from '@/common/forms';
import {
  useTeacher,
  useCreateTeacher,
  useUpdateTeacher,
} from '../hooks/useTeachers';
import { teacherFormSchema, type TeacherFormInput } from '../validation/schemas';
import type { CreateTeacherDTO, UpdateTeacherDTO } from '../types';

const today = () => new Date().toISOString().slice(0, 10);

export default function TeacherFormScreen() {
  const { t } = useTranslation('teachers');
  const { palette, spacing, typography } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;

  const detailQuery = useTeacher(params.id, isEdit);
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher(params.id ?? '');

  const {
    control,
    handleSubmit,
    formState,
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

  const handleBack = React.useCallback(() => {
    if (formState.isDirty) {
      Alert.alert(
        t('discard.title', { defaultValue: 'Discard changes?' }),
        t('discard.body', {
          defaultValue: 'Your unsaved changes will be lost.',
        }),
        [
          {
            text: t('discard.cancel', { defaultValue: 'Keep editing' }),
            style: 'cancel',
          },
          {
            text: t('discard.confirm', { defaultValue: 'Discard' }),
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  }, [formState.isDirty, t]);

  React.useEffect(() => {
    const onBackPress = () => {
      if (formState.isDirty) {
        handleBack();
        return true; // consume — we handle navigation inside the Alert
      }
      return false; // let default back happen
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [formState.isDirty, handleBack]);

  const onSubmit = async (data: TeacherFormInput) => {
    // Build DTO — strip empty optionals so the server treats them as omitted.
    const payload: CreateTeacherDTO = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      designation: data.designation,
      date_of_joining: data.date_of_joining,
      ...(data.department ? { department: data.department } : {}),
      ...(data.qualification ? { qualification: data.qualification } : {}),
    };

    try {
      if (isEdit) {
        // Only send fields the user actually changed; never re-send date_of_joining from this UI.
        const dirtyFields = formState.dirtyFields as Record<string, boolean>;
        const partial: UpdateTeacherDTO = {};
        (Object.keys(dirtyFields) as (keyof TeacherFormInput)[]).forEach((key) => {
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
          Alert.alert(
            t('credentials.title', { defaultValue: 'Teacher account created' }),
            credBody,
            [
              {
                text: t('credentials.copy', { defaultValue: 'Copy credentials' }),
                onPress: async () => {
                  await Clipboard.setStringAsync(
                    `Email: ${result.credentials!.email}\n` +
                      `Employee ID: ${result.credentials!.employee_id}\n` +
                      `Password: ${result.credentials!.password}`
                  );
                  navigateToDetail();
                },
              },
              {
                text: t('credentials.done', { defaultValue: 'Done' }),
                onPress: navigateToDetail,
              },
            ],
            { cancelable: false }
          );
        } else {
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
        Alert.alert(
          t('save.errorTitle', { defaultValue: 'Could not save' }),
          anyErr?.message ?? 'Please try again.'
        );
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
    <ScreenContainer keyboardOffset={20}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={{ width: 44, height: 44, justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={24} color={palette.onSurface} />
        </Pressable>
        {!isEdit ? (
          <Link onPress={handleBack}>
            {t('cancel', { defaultValue: 'Cancel' })}
          </Link>
        ) : null}
      </View>

      <Text
        style={[
          typography.display,
          { color: palette.onSurface, marginTop: spacing.xs },
        ]}
      >
        {isEdit
          ? t('form.editTitle', { defaultValue: 'Edit teacher' })
          : t('form.newTitle', { defaultValue: 'New teacher' })}
      </Text>

      <View style={{ gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: 120 }}>
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
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        </FormSection>

        <FormSection title={t('section.role', { defaultValue: 'Role' })}>
          <FormField
            control={control}
            name="designation"
            label={t('field.designation', { defaultValue: 'Designation' })}
            autoCapitalize="words"
          />
          <FormField
            control={control}
            name="department"
            label={t('field.department', { defaultValue: 'Department' })}
            autoCapitalize="words"
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
