import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, Modal, TextInput,
  TouchableOpacity, ScrollView, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@/common/theme';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Holiday, CreateHolidayDTO, HolidayType } from '../types';
import { validateHolidayData } from '../validation/schemas';
import { DatePicker } from '@/common/components/datepicker';
import { useAcademicYears } from '@/modules/academics/hooks/useAcademicYears';
import { useAcademicYearContext } from '@/modules/academics/context/AcademicYearContext';

interface HolidayFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHolidayDTO) => Promise<void>;
  initialData?: Holiday | null;
  mode?: 'create' | 'edit';
}

const HOLIDAY_TYPES: HolidayType[] = ['public', 'school', 'regional', 'optional', 'weekly_off'];
const TYPE_ICONS: Record<HolidayType, keyof typeof import('@expo/vector-icons').Ionicons['glyphMap']> = {
  public:    'flag-outline',
  school:    'school-outline',
  regional:  'map-outline',
  optional:  'star-outline',
  weekly_off: 'repeat-outline',
};

type HolidayMode = 'single' | 'range' | 'recurring';

function getDefaultForm(): {
  name: string; description: string; holiday_type: HolidayType;
  start_date: string; end_date: string; academic_year_id: string;
  is_recurring: boolean; recurring_day_of_week: number | null;
} {
  return {
    name: '', description: '', holiday_type: 'school',
    start_date: '', end_date: '', academic_year_id: '',
    is_recurring: false, recurring_day_of_week: null,
  };
}

const ZOD_MSG_KEYS: Record<string, string> = {
  'Name is required': 'holidayForm.validation.nameRequired',
  'Max 120 characters': 'holidayForm.validation.nameMax',
  'Max 500 characters': 'holidayForm.validation.descriptionMax',
  'Select a valid holiday type': 'holidayForm.validation.invalidHolidayType',
  'Start date must be YYYY-MM-DD': 'holidayForm.validation.startDateFormat',
  'End date must be YYYY-MM-DD': 'holidayForm.validation.endDateFormat',
  'End date must be on or after start date': 'holidayForm.validation.endAfterStart',
  'Day of week is required': 'holidayForm.validation.dayRequired',
  'Must be 0-6': 'holidayForm.validation.dayRange',
};

export const HolidayFormModal: React.FC<HolidayFormModalProps> = ({
  visible, onClose, onSubmit, initialData = null, mode = 'create',
}) => {
  const { t } = useTranslation('teacherLeaves');
  const { palette, spacing, radius, typography } = useTheme();
  const { bodyMd: bodyMdType } = typography;
  const trZod = useCallback((msg: string) => {
    const key = ZOD_MSG_KEYS[msg];
    return key ? t(key) : msg;
  }, [t]);

  const [form, setForm] = useState(getDefaultForm());
  const [holidayMode, setHolidayMode] = useState<HolidayMode>('single');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: academicYears = [] } = useAcademicYears(false);
  const { selectedAcademicYearId } = useAcademicYearContext();

  // Populate form when editing
  useEffect(() => {
    if (!visible) return;
    if (mode === 'edit' && initialData) {
      setForm({
        name: initialData.name ?? '',
        description: initialData.description ?? '',
        holiday_type: initialData.holiday_type,
        start_date: initialData.start_date ?? '',
        end_date: initialData.end_date ?? '',
        academic_year_id: initialData.academic_year_id ?? '',
        is_recurring: initialData.is_recurring,
        recurring_day_of_week: initialData.recurring_day_of_week ?? null,
      });
      if (initialData.is_recurring) {
        setHolidayMode('recurring');
      } else if (initialData.start_date && initialData.end_date && initialData.start_date !== initialData.end_date) {
        setHolidayMode('range');
      } else {
        setHolidayMode('single');
      }
    } else {
      setForm({ ...getDefaultForm(), academic_year_id: selectedAcademicYearId ?? '' });
      setHolidayMode('single');
    }
    setFieldErrors({});
    setSubmitError(null);
  }, [visible, mode, initialData, selectedAcademicYearId]);

  const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const handleModeChange = (m: HolidayMode) => {
    setHolidayMode(m);
    setFieldErrors({});
    setSubmitError(null);
    if (m === 'recurring') {
      setForm((prev) => ({ ...prev, is_recurring: true, start_date: '', end_date: '' }));
    } else {
      setForm((prev) => ({ ...prev, is_recurring: false, recurring_day_of_week: null }));
      if (m === 'single') {
        setForm((prev) => ({ ...prev, end_date: '' }));
      }
    }
  };

  const buildPayload = (): CreateHolidayDTO => {
    if (holidayMode === 'recurring') {
      return {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        holiday_type: form.holiday_type,
        is_recurring: true,
        recurring_day_of_week: form.recurring_day_of_week!,
        academic_year_id: form.academic_year_id || undefined,
      };
    }
    return {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      holiday_type: form.holiday_type,
      is_recurring: false,
      start_date: form.start_date.trim(),
      end_date: holidayMode === 'range' ? (form.end_date.trim() || undefined) : undefined,
      academic_year_id: form.academic_year_id || undefined,
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    const validation = validateHolidayData(payload);
    if (!validation.valid) {
      const mapped: Record<string, string> = {};
      Object.entries(validation.errors).forEach(([k, v]) => { mapped[k] = trZod(v); });
      setFieldErrors(mapped);
      setSubmitError(t('holidayForm.fixErrorsBelow'));
      return;
    }

    setLoading(true);
    setSubmitError(null);
    setFieldErrors({});
    try {
      await onSubmit(payload);
    } catch (err: any) {
      setSubmitError(err.message || t('holidayForm.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const sectionLabelStyle = {
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  };

  const fieldLabelStyle = {
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: palette.surfaceContainerLowest,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            height: '90%',
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.lg,
          }}
        >
          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.md }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: palette.outlineVariant,
              }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text variant="headlineMd" color="onSurface">
              {mode === 'edit' ? t('holidayForm.titleEdit') : t('holidayForm.titleAdd')}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: spacing.xs }}>
              <AppIcon name="close" size="lg" color="onSurface" />
            </TouchableOpacity>
          </View>

          {/* Error banner */}
          {submitError && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                backgroundColor: palette.errorContainer,
                padding: spacing.sm,
                borderRadius: radius.sm,
                marginBottom: spacing.sm,
                borderWidth: 1,
                borderColor: palette.error + '30',
              }}
            >
              <AppIcon name="alert-circle-outline" size="sm" color="error" />
              <Text variant="labelSm" color="error" style={{ flex: 1 }}>
                {submitError}
              </Text>
            </View>
          )}

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ─── Holiday Mode Tabs ─────────────────────────────── */}
            <Text variant="labelSm" color="onSurfaceVariant" style={sectionLabelStyle}>{t('holidayForm.sectionSchedule')}</Text>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: palette.surfaceContainerLow,
                borderRadius: radius.md,
                padding: 3,
                marginBottom: spacing.lg,
              }}
            >
              {(['single', 'range', 'recurring'] as HolidayMode[]).map((m) => {
                const active = holidayMode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: spacing.sm,
                      borderRadius: radius.sm,
                      gap: 4,
                      backgroundColor: active ? palette.primary : 'transparent',
                    }}
                    onPress={() => handleModeChange(m)}
                  >
                    <AppIcon
                      name={m === 'single' ? 'today-outline' : m === 'range' ? 'calendar-outline' : 'repeat-outline'}
                      size="sm"
                      color={active ? 'onPrimary' : 'onSurfaceVariant'}
                    />
                    <Text
                      variant="labelSm"
                      color={active ? 'onPrimary' : 'onSurfaceVariant'}
                      style={{ fontWeight: '600' }}
                    >
                      {m === 'single' ? t('holidayForm.modeSingle') : m === 'range' ? t('holidayForm.modeRange') : t('holidayForm.modeRecurring')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ─── Name ─────────────────────────────────────────── */}
            <Text variant="labelMd" color="onSurface" style={fieldLabelStyle}>{t('holidayForm.nameLabel')}</Text>
            <TextInput
              style={{
                backgroundColor: palette.surfaceContainerLow,
                borderWidth: fieldErrors.name ? 2 : 1,
                borderColor: fieldErrors.name ? palette.error : palette.outlineVariant,
                borderRadius: radius.md,
                padding: spacing.md,
                color: palette.onSurface,
                ...bodyMdType,
              }}
              value={form.name}
              onChangeText={(v) => setField('name', v)}
              placeholder={t('holidayForm.namePlaceholder')}
              placeholderTextColor={palette.outline}
            />
            {fieldErrors.name && (
              <Text variant="labelSm" color="error" style={{ marginTop: 3, marginBottom: 4 }}>
                {fieldErrors.name}
              </Text>
            )}

            {/* ─── Date inputs ──────────────────────────────────── */}
            {holidayMode === 'single' && (
              <>
                <DatePicker
                  label={t('holidayForm.dateLabel')}
                  value={form.start_date}
                  onChange={(v) => setField('start_date', v)}
                  placeholder={t('holidayForm.datePlaceholder')}
                  error={fieldErrors.start_date}
                />
              </>
            )}

            {holidayMode === 'range' && (
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                  <DatePicker
                    label={t('holidayForm.startDateLabel')}
                    value={form.start_date}
                    onChange={(v) => setField('start_date', v)}
                    placeholder={t('holidayForm.datePlaceholder')}
                    error={fieldErrors.start_date}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <DatePicker
                    label={t('holidayForm.endDateLabel')}
                    value={form.end_date}
                    onChange={(v) => setField('end_date', v)}
                    placeholder={t('holidayForm.datePlaceholder')}
                    error={fieldErrors.end_date}
                  />
                </View>
              </View>
            )}

            {holidayMode === 'recurring' && (
              <>
                <Text variant="labelMd" color="onSurface" style={fieldLabelStyle}>{t('holidayForm.repeatsEvery')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs }}>
                  {([0, 1, 2, 3, 4, 5, 6] as const).map((dow) => {
                    const active = form.recurring_day_of_week === dow;
                    return (
                      <TouchableOpacity
                        key={dow}
                        style={{
                          paddingVertical: spacing.sm,
                          paddingHorizontal: spacing.md,
                          borderRadius: radius.sm,
                          borderWidth: 1,
                          borderColor: active ? palette.primary : palette.outlineVariant,
                          backgroundColor: active ? palette.primary : palette.surfaceContainerLow,
                        }}
                        onPress={() => {
                          setField('recurring_day_of_week', dow);
                          if (fieldErrors.recurring_day_of_week) {
                            setFieldErrors((p) => { const n = { ...p }; delete n.recurring_day_of_week; return n; });
                          }
                        }}
                      >
                        <Text
                          variant="labelSm"
                          color={active ? 'onPrimary' : 'onSurface'}
                          style={{ fontWeight: '600' }}
                        >
                          {t(`holidayForm.daysShort.${dow}`)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {fieldErrors.recurring_day_of_week && (
                  <Text variant="labelSm" color="error" style={{ marginTop: 3, marginBottom: 4 }}>
                    {fieldErrors.recurring_day_of_week}
                  </Text>
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: spacing.xs,
                    backgroundColor: palette.surfaceContainerLow,
                    padding: spacing.sm,
                    borderRadius: radius.sm,
                    marginTop: spacing.xs,
                    borderWidth: 1,
                    borderColor: palette.outlineVariant,
                  }}
                >
                  <AppIcon name="information-circle-outline" size="sm" color="onSurfaceVariant" />
                  <Text
                    variant="labelSm"
                    color="onSurfaceVariant"
                    style={{ flex: 1, lineHeight: 18 }}
                  >
                    {t('holidayForm.recurringInfo')}
                  </Text>
                </View>
              </>
            )}

            {/* ─── Holiday Category ─────────────────────────────── */}
            <Text variant="labelMd" color="onSurface" style={fieldLabelStyle}>{t('holidayForm.categoryLabel')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xs }}>
              {HOLIDAY_TYPES.map((ht) => {
                const active = form.holiday_type === ht;
                return (
                  <TouchableOpacity
                    key={ht}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      marginRight: spacing.sm,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderColor: active ? palette.primary : palette.outlineVariant,
                      backgroundColor: active ? palette.primary : palette.surfaceContainerLow,
                    }}
                    onPress={() => setField('holiday_type', ht)}
                  >
                    <AppIcon
                      name={TYPE_ICONS[ht]}
                      size="sm"
                      color={active ? 'onPrimary' : 'onSurfaceVariant'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      variant="labelSm"
                      color={active ? 'onPrimary' : 'onSurface'}
                      style={{ fontWeight: '600' }}
                    >
                      {t(`holidayForm.types.${ht}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {fieldErrors.holiday_type && (
              <Text variant="labelSm" color="error" style={{ marginTop: 3, marginBottom: 4 }}>
                {fieldErrors.holiday_type}
              </Text>
            )}

            {/* ─── Academic Year ────────────────────────────────── */}
            {academicYears.length > 0 && (
              <>
                <Text variant="labelMd" color="onSurface" style={fieldLabelStyle}>{t('holidayForm.academicYear')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xs }}>
                  {(() => {
                    const active = !form.academic_year_id;
                    return (
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: spacing.sm,
                          paddingHorizontal: spacing.md,
                          marginRight: spacing.sm,
                          borderRadius: radius.sm,
                          borderWidth: 1,
                          borderColor: active ? palette.primary : palette.outlineVariant,
                          backgroundColor: active ? palette.primary : palette.surfaceContainerLow,
                        }}
                        onPress={() => setField('academic_year_id', '')}
                      >
                        <Text
                          variant="labelSm"
                          color={active ? 'onPrimary' : 'onSurface'}
                          style={{ fontWeight: '600' }}
                        >
                          {t('holidayForm.allYears')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })()}
                  {academicYears.map((ay: any) => {
                    const active = form.academic_year_id === ay.id;
                    return (
                      <TouchableOpacity
                        key={ay.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: spacing.sm,
                          paddingHorizontal: spacing.md,
                          marginRight: spacing.sm,
                          borderRadius: radius.sm,
                          borderWidth: 1,
                          borderColor: active ? palette.primary : palette.outlineVariant,
                          backgroundColor: active ? palette.primary : palette.surfaceContainerLow,
                        }}
                        onPress={() => setField('academic_year_id', ay.id)}
                      >
                        <Text
                          variant="labelSm"
                          color={active ? 'onPrimary' : 'onSurface'}
                          style={{ fontWeight: '600' }}
                        >
                          {ay.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* ─── Description ─────────────────────────────────── */}
            <Text variant="labelMd" color="onSurface" style={fieldLabelStyle}>{t('holidayForm.descriptionLabel')}</Text>
            <TextInput
              style={{
                backgroundColor: palette.surfaceContainerLow,
                borderWidth: fieldErrors.description ? 2 : 1,
                borderColor: fieldErrors.description ? palette.error : palette.outlineVariant,
                borderRadius: radius.md,
                padding: spacing.md,
                color: palette.onSurface,
                ...bodyMdType,
                minHeight: 80,
                paddingTop: spacing.sm,
              }}
              value={form.description}
              onChangeText={(v) => setField('description', v)}
              placeholder={t('holidayForm.descriptionPlaceholder')}
              placeholderTextColor={palette.outline}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {fieldErrors.description && (
              <Text variant="labelSm" color="error" style={{ marginTop: 3, marginBottom: 4 }}>
                {fieldErrors.description}
              </Text>
            )}

            <View style={{ height: spacing.xl }} />
          </ScrollView>

          {/* Footer */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: palette.outlineVariant,
              gap: spacing.md,
            }}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Link onPress={onClose}>{t('holidayForm.cancel')}</Link>
            </View>
            <View style={{ flex: 2 }}>
              <Button variant="primary" loading={loading} onPress={handleSubmit} fullWidth>
                {loading
                  ? (mode === 'edit' ? t('holidayForm.saving') : t('holidayForm.adding'))
                  : (mode === 'edit' ? t('holidayForm.saveChanges') : t('holidayForm.addHoliday'))}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
