/**
 * StudentFormScreen — create or edit a student.
 *
 * Routes: /(protected)/students/new      → create
 *         /(protected)/students/[id]/edit → edit
 *
 * Field set is the Slice 5 admin "new admission" minimum:
 *   name, gender, date_of_birth, class_id, admission_date,
 *   guardian_name, guardian_relationship, guardian_phone,
 *   email (optional), phone (optional).
 * Section is not collected here — derived later from class assignment.
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
import {
  FormField,
  FormSelect,
  FormDatePicker,
  FormSection,
  type SelectOption,
} from '@/common/forms';
import {
  useStudent,
  useCreateStudent,
  useUpdateStudent,
} from '../hooks/useStudents';
import { studentFormSchema, type StudentFormInput } from '../validation/schemas';
// Note: useClasses lives in finance/hooks/useFinance.ts per pre-flight audit.
import { useClasses } from '@/modules/finance/hooks/useFinance';
import type { CreateStudentDTO, UpdateStudentDTO } from '../types';

const GENDER_OPTIONS: SelectOption[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const RELATIONSHIP_OPTIONS: SelectOption[] = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

const ALLOWED_GENDERS = ['male', 'female', 'other'] as const;
const ALLOWED_RELATIONSHIPS = ['father', 'mother', 'guardian', 'other'] as const;

const today = () => new Date().toISOString().slice(0, 10);

export default function StudentFormScreen() {
  const { t } = useTranslation('students');
  const { palette, spacing } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;

  const detailQuery = useStudent(params.id, isEdit);
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent(params.id ?? '');

  const classesQuery = useClasses();
  const classOptions: SelectOption[] = (classesQuery.data ?? []).map((c) => ({
    value: c.id,
    label: c.section ? `${c.name} - ${c.section}` : c.name,
  }));

  const {
    control,
    handleSubmit,
    formState,
    setError,
    reset,
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: '',
      gender: 'male',
      date_of_birth: '',
      class_id: '',
      admission_date: today(),
      guardian_name: '',
      guardian_relationship: 'father',
      guardian_phone: '',
      email: '',
      phone: '',
    },
  });

  // Hydrate when editing — populate form once detail loads.
  React.useEffect(() => {
    if (!isEdit || !detailQuery.data) return;
    const s = detailQuery.data;
    const gender = (s.gender as StudentFormInput['gender']) || 'male';
    const relationship =
      (s.guardian_relationship as StudentFormInput['guardian_relationship']) ||
      'father';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- runtime guard against unknown server values
    if (s.gender && !ALLOWED_GENDERS.includes(s.gender as any)) {
      console.warn('[StudentForm] Hydrate clamped unknown gender:', s.gender);
    }
    if (
      s.guardian_relationship &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- runtime guard against unknown server values
      !ALLOWED_RELATIONSHIPS.includes(s.guardian_relationship as any)
    ) {
      console.warn(
        '[StudentForm] Hydrate clamped unknown relationship:',
        s.guardian_relationship
      );
    }
    reset({
      name: s.name ?? '',
      gender: ['male', 'female', 'other'].includes(gender) ? gender : 'male',
      date_of_birth: s.date_of_birth ?? '',
      class_id: s.class_id ?? '',
      admission_date: s.admission_date ?? today(),
      guardian_name: s.guardian_name ?? '',
      guardian_relationship: ['father', 'mother', 'guardian', 'other'].includes(
        relationship
      )
        ? relationship
        : 'father',
      guardian_phone: s.guardian_phone ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
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

  const onSubmit = async (data: StudentFormInput) => {
    // Build DTO — strip empty optionals so the server treats them as omitted.
    const payload: CreateStudentDTO = {
      name: data.name,
      gender: data.gender,
      date_of_birth: data.date_of_birth,
      class_id: data.class_id,
      admission_date: data.admission_date,
      guardian_name: data.guardian_name,
      guardian_relationship: data.guardian_relationship,
      guardian_phone: data.guardian_phone,
      ...(data.email ? { email: data.email } : {}),
      ...(data.phone ? { phone: data.phone } : {}),
    };

    try {
      if (isEdit) {
        // Only send fields the user actually changed; never re-send admission_date from this UI.
        const dirtyFields = formState.dirtyFields as Record<string, boolean>;
        const partial: UpdateStudentDTO = {};
        (Object.keys(dirtyFields) as (keyof StudentFormInput)[]).forEach((key) => {
          if (key === 'admission_date') return;
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
        const created = result.student;
        if (result.credentials) {
          const credBody =
            `Username: ${result.credentials.username}\n` +
            `Password: ${result.credentials.password}\n\n` +
            'Share these with the parent.';
          const navigateToDetail = () =>
            router.replace(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- expo-router typed routes don't yet include this dynamic route shape
              { pathname: '/(protected)/students/[id]', params: { id: created.id } } as any
            );
          Alert.alert(
            t('credentials.title', { defaultValue: 'Student account created' }),
            credBody,
            [
              {
                text: t('credentials.copy', { defaultValue: 'Copy credentials' }),
                onPress: async () => {
                  await Clipboard.setStringAsync(
                    `Username: ${result.credentials!.username}\nPassword: ${result.credentials!.password}`
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
            pathname: '/(protected)/students/[id]',
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
            setError(d.field as Path<StudentFormInput>, {
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
    <ScreenContainer keyboardOffset={20} topInset={false}>
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
          <AppIcon name="chevron-back" size="lg" color="onSurface" />
        </Pressable>
        {!isEdit ? (
          <Link onPress={handleBack}>
            {t('cancel', { defaultValue: 'Cancel' })}
          </Link>
        ) : null}
      </View>

      <Text variant="display" color="onSurface" style={{ marginTop: spacing.xs }}>
        {isEdit
          ? t('form.editTitle', { defaultValue: 'Edit student' })
          : t('form.newTitle', { defaultValue: 'New student' })}
      </Text>

      <View style={{ gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: 120 }}>
        <FormSection title={t('section.basic', { defaultValue: 'Basic info' })}>
          <FormField
            control={control}
            name="name"
            label={t('field.fullName', { defaultValue: 'Full name' })}
            autoCapitalize="words"
          />
          <FormSelect
            control={control}
            name="gender"
            label={t('field.gender', { defaultValue: 'Gender' })}
            options={GENDER_OPTIONS}
          />
          <FormDatePicker
            control={control}
            name="date_of_birth"
            label={t('field.dob', { defaultValue: 'Date of birth' })}
            maxDate={new Date()}
          />
        </FormSection>

        <FormSection title={t('section.classInfo', { defaultValue: 'Class' })}>
          <FormSelect
            control={control}
            name="class_id"
            label={t('field.class', { defaultValue: 'Class' })}
            options={classOptions}
          />
          <FormDatePicker
            control={control}
            name="admission_date"
            label={t('field.admissionDate', { defaultValue: 'Admission date' })}
            disabled={isEdit}
          />
        </FormSection>

        <FormSection title={t('section.guardian', { defaultValue: 'Guardian' })}>
          <FormField
            control={control}
            name="guardian_name"
            label={t('field.guardianName', { defaultValue: 'Guardian name' })}
            autoCapitalize="words"
          />
          <FormSelect
            control={control}
            name="guardian_relationship"
            label={t('field.guardianRelationship', {
              defaultValue: 'Relationship',
            })}
            options={RELATIONSHIP_OPTIONS}
          />
          <FormField
            control={control}
            name="guardian_phone"
            label={t('field.guardianPhone', { defaultValue: 'Guardian phone' })}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        </FormSection>

        <FormSection title={t('section.contact', { defaultValue: 'Contact (optional)' })}>
          <FormField
            control={control}
            name="email"
            label={t('field.email', { defaultValue: 'Student email' })}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
          />
          <FormField
            control={control}
            name="phone"
            label={t('field.phone', { defaultValue: 'Student phone' })}
            keyboardType="phone-pad"
            autoComplete="tel"
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
            ? t('save.update', { defaultValue: 'Update student' })
            : t('save.create', { defaultValue: 'Create student' })}
        </Button>
      </View>
    </ScreenContainer>
  );
}
