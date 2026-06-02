/**
 * CreateInvoiceScreen — admin-only form to create a fee invoice.
 *
 * Route: /(protected)/finance/invoices/new
 *
 * Server contract (POST /api/fees/invoices):
 *   student_id, academic_year (name, e.g. "2025-26"), issue_date, due_date,
 *   items[] (fee_head, period?, amount, discount?, fine?), notes?
 */
import React from 'react';
import { Alert, BackHandler, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import {
  FormField,
  FormSelect,
  FormDatePicker,
  FormSection,
  type SelectOption,
} from '@/common/forms';
import { useStudents } from '@/modules/students/hooks/useStudents';
import { useAcademicYearContext } from '@/modules/academics/context/AcademicYearContext';
import { useCreateInvoice } from '../hooks/useFinance';
import {
  createInvoiceSchema,
  type CreateInvoiceInput,
} from '../validation/invoiceSchemas';
import type { CreateInvoicePayload } from '../services/financeService';

const todayIso = () => new Date().toISOString().slice(0, 10);
const isoPlusDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export default function CreateInvoiceScreen() {
  const { t } = useTranslation('finance');
  const { palette, spacing, radius } = useTheme();

  const createMutation = useCreateInvoice();

  // Students — callback hook pattern. Fetch once on mount.
  const { students, fetchStudents } = useStudents();
  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const studentOptions: SelectOption[] = React.useMemo(
    () =>
      students.map((s) => ({
        value: s.id,
        label: s.admission_number
          ? `${s.name} (${s.admission_number})`
          : s.name,
      })),
    [students]
  );

  // Academic year — context gives selectedAcademicYearId + academicYears[]. Server wants the *name*.
  const { selectedAcademicYearId, academicYears } = useAcademicYearContext();
  const academicYearOptions: SelectOption[] = React.useMemo(
    () => academicYears.map((ay) => ({ value: ay.name, label: ay.name })),
    [academicYears]
  );
  const defaultAcademicYear = React.useMemo(() => {
    if (!academicYears.length) return '';
    const match = academicYears.find((ay) => ay.id === selectedAcademicYearId);
    return (match ?? academicYears[0]).name;
  }, [academicYears, selectedAcademicYearId]);

  const {
    control,
    handleSubmit,
    formState,
    setError,
    setValue,
    watch,
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      student_id: '',
      academic_year: '',
      issue_date: todayIso(),
      due_date: isoPlusDays(14),
      // amount/discount/fine are strings in the form; coerced to number at submit.
      items: [{ fee_head: '', period: '', amount: '' }],
      notes: '',
    },
  });

  // Once academic years load, set the default. Don't mark dirty.
  React.useEffect(() => {
    if (defaultAcademicYear && !watch('academic_year')) {
      setValue('academic_year', defaultAcademicYear, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultAcademicYear]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const issueDate = watch('issue_date');

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
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [formState.isDirty, handleBack]);

  const onSubmit = async (data: CreateInvoiceInput) => {
    // Strip empty optionals; coerce numeric strings to numbers (schema already validated they're parseable).
    const items: CreateInvoicePayload['items'] = data.items.map((i) => {
      const amount = parseFloat(i.amount) || 0;
      const discount =
        !i.discount || i.discount === ''
          ? undefined
          : parseFloat(i.discount);
      const fine =
        !i.fine || i.fine === '' ? undefined : parseFloat(i.fine);
      return {
        fee_head: i.fee_head,
        ...(i.period ? { period: i.period } : {}),
        amount,
        ...(discount !== undefined && !Number.isNaN(discount) ? { discount } : {}),
        ...(fine !== undefined && !Number.isNaN(fine) ? { fine } : {}),
      };
    });

    const payload: CreateInvoicePayload = {
      student_id: data.student_id,
      academic_year: data.academic_year,
      issue_date: data.issue_date,
      due_date: data.due_date,
      items,
      ...(data.notes ? { notes: data.notes } : {}),
    };

    try {
      const result = await createMutation.mutateAsync(payload);
      const invoiceId = result?.invoice?.id;
      Alert.alert(
        t('invoiceCreate.successTitle', { defaultValue: 'Invoice created' }),
        t('invoiceCreate.successBody', {
          defaultValue: 'The invoice has been issued.',
        }),
        [
          {
            text: t('invoiceCreate.ok', { defaultValue: 'OK' }),
            onPress: () => {
              if (invoiceId) {
                router.replace(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- expo-router typed routes don't yet include this dynamic route shape
                  {
                    pathname: '/(protected)/finance/invoices/[id]',
                    params: { id: invoiceId },
                  } as any
                );
              } else {
                router.back();
              }
            },
          },
        ]
      );
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- service throws untyped errors
      const anyErr = err as any;
      const details: Array<{ field?: string; issue?: string; message?: string }> =
        anyErr?.data?.error?.details ?? anyErr?.data?.details ?? [];
      if (Array.isArray(details) && details.length > 0) {
        for (const d of details) {
          if (d?.field) {
            setError(d.field as Path<CreateInvoiceInput>, {
              message: String(d.issue ?? d.message ?? 'Invalid'),
            });
          }
        }
      } else {
        Alert.alert(
          t('invoiceCreate.errorTitle', {
            defaultValue: 'Could not create invoice',
          }),
          anyErr?.message ?? 'Please try again.'
        );
      }
    }
  };

  return (
    <ScreenContainer keyboardOffset={20} topInset={false}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <AppIcon
          name="arrow-back"
          size="lg"
          color="onSurface"
          onPress={handleBack}
          accessibilityLabel="Back"
        />
        <Link onPress={handleBack}>
          {t('cancel', { defaultValue: 'Cancel' })}
        </Link>
      </View>

      <Text variant="display" color="onSurface" style={{ marginTop: spacing.xs }}>
        {t('invoiceCreate.title', { defaultValue: 'New invoice' })}
      </Text>

      <View
        style={{
          gap: spacing.lg,
          paddingTop: spacing.lg,
          // Clear the sticky action bar (button + its padding) without a big empty band.
          paddingBottom: spacing.xl * 3,
        }}
      >
        <FormSection
          title={t('invoiceCreate.sectionStudent', {
            defaultValue: 'Student & period',
          })}
        >
          <FormSelect
            control={control}
            name="student_id"
            label={t('invoiceCreate.fieldStudent', {
              defaultValue: 'Student',
            })}
            options={studentOptions}
          />
          <FormSelect
            control={control}
            name="academic_year"
            label={t('invoiceCreate.fieldAcademicYear', {
              defaultValue: 'Academic year',
            })}
            options={academicYearOptions}
          />
        </FormSection>

        <FormSection
          title={t('invoiceCreate.sectionDates', { defaultValue: 'Dates' })}
        >
          <FormDatePicker
            control={control}
            name="issue_date"
            label={t('invoiceCreate.fieldIssueDate', {
              defaultValue: 'Issue date',
            })}
          />
          <FormDatePicker
            control={control}
            name="due_date"
            label={t('invoiceCreate.fieldDueDate', {
              defaultValue: 'Due date',
            })}
            minDate={issueDate ? new Date(issueDate) : undefined}
          />
        </FormSection>

        <FormSection
          title={t('invoiceCreate.sectionItems', {
            defaultValue: 'Fee items',
          })}
        >
          {fields.map((field, index) => (
            <View
              key={field.id}
              style={{
                gap: spacing.sm,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: palette.outlineVariant,
                borderRadius: radius.md,
                backgroundColor: palette.surface,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text variant="labelMd" color="onSurfaceVariant">
                  {t('invoiceCreate.itemNumber', {
                    defaultValue: 'Item {{n}}',
                    n: index + 1,
                  })}
                </Text>
                <Pressable
                  onPress={() => remove(index)}
                  disabled={fields.length === 1}
                  hitSlop={8}
                  style={{
                    width: 32,
                    height: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: fields.length === 1 ? 0.3 : 1,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t('invoiceCreate.removeItem', {
                    defaultValue: 'Remove item',
                  })}
                >
                  <AppIcon name="close" size="md" color="onSurfaceVariant" />
                </Pressable>
              </View>

              <FormField
                control={control}
                name={`items.${index}.fee_head` as Path<CreateInvoiceInput>}
                label={t('invoiceCreate.fieldFeeHead', {
                  defaultValue: 'Fee head',
                })}
                placeholder="Tuition"
              />
              <FormField
                control={control}
                name={`items.${index}.period` as Path<CreateInvoiceInput>}
                label={t('invoiceCreate.fieldPeriod', {
                  defaultValue: 'Period (optional)',
                })}
                placeholder="Term 1"
              />
              <FormField
                control={control}
                name={`items.${index}.amount` as Path<CreateInvoiceInput>}
                label={t('invoiceCreate.fieldAmount', {
                  defaultValue: 'Amount',
                })}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>
          ))}

          <Button
            variant="ghost"
            fullWidth
            onPress={() =>
              append({
                fee_head: '',
                period: '',
                amount: '',
              })
            }
          >
            {t('invoiceCreate.addItem', {
              defaultValue: '+ Add another fee item',
            })}
          </Button>
        </FormSection>

        <FormSection
          title={t('invoiceCreate.sectionNotes', { defaultValue: 'Notes' })}
        >
          <FormField
            control={control}
            name="notes"
            label={t('invoiceCreate.fieldNotes', { defaultValue: 'Notes' })}
            placeholder={t('invoiceCreate.notesPlaceholder', {
              defaultValue: 'Internal note (not visible to student)',
            })}
          />
        </FormSection>
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: spacing.lg,
          left: 0,
          right: 0,
          paddingHorizontal: spacing.marginMobile,
          backgroundColor: palette.surface,
        }}
      >
        <Button
          variant="primary"
          fullWidth
          loading={createMutation.isPending}
          onPress={handleSubmit(onSubmit)}
        >
          {t('invoiceCreate.submit', { defaultValue: 'Create invoice' })}
        </Button>
      </View>
    </ScreenContainer>
  );
}
