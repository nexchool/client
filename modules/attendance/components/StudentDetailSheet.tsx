import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Button } from '@/common/components/Button';
import { ProfileAvatar } from '@/common/components/ProfileAvatar';
import { AttendanceStatusSegmented, type AttendanceStatus } from './AttendanceStatusSegmented';

type Props = {
  visible: boolean;
  onClose: () => void;
  studentName: string;
  rollNumber?: number | string;
  currentStatus: AttendanceStatus;
  currentRemarks?: string;
  canEdit: boolean;
  onSave: (status: AttendanceStatus, remarks: string) => void;
};

export function StudentDetailSheet({
  visible,
  onClose,
  studentName,
  rollNumber,
  currentStatus,
  currentRemarks = '',
  canEdit,
  onSave,
}: Props) {
  const { t } = useTranslation('attendance');
  const { palette, spacing, radius, typography } = useTheme();
  const [status, setStatus] = useState<AttendanceStatus>(currentStatus);
  const [remarks, setRemarks] = useState<string>(currentRemarks);

  useEffect(() => {
    if (visible) {
      setStatus(currentStatus);
      setRemarks(currentRemarks ?? '');
    }
  }, [visible, currentStatus, currentRemarks]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(11, 28, 48, 0.40)' }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.lg,
            paddingBottom: spacing.xl,
          },
        ]}
      >
        <View
          style={{
            alignSelf: 'center',
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: palette.outlineVariant,
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
          <ProfileAvatar size={48} name={studentName} />
          <View style={{ flex: 1 }}>
            <Text
              style={[typography.headlineMd, { color: palette.onSurface }]}
              numberOfLines={1}
            >
              {studentName}
            </Text>
            {rollNumber != null ? (
              <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]}>
                #{rollNumber}
              </Text>
            ) : null}
          </View>
          {canEdit ? <AttendanceStatusSegmented value={status} onChange={setStatus} /> : null}
        </View>

        {canEdit ? (
          <View style={{ marginTop: spacing.lg }}>
            <Text
              style={[typography.labelMd, { color: palette.onSurfaceVariant, marginBottom: 6 }]}
            >
              {t('remarks', { defaultValue: 'Remarks' })}
            </Text>
            <TextInput
              value={remarks}
              onChangeText={setRemarks}
              placeholder={t('remarksPlaceholder', { defaultValue: 'Optional note...' })}
              placeholderTextColor={palette.outline}
              multiline
              style={[
                typography.bodyMd,
                {
                  backgroundColor: palette.surfaceContainerLow,
                  borderRadius: radius.DEFAULT,
                  padding: spacing.md,
                  minHeight: 80,
                  color: palette.onSurface,
                  textAlignVertical: 'top',
                },
              ]}
            />
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
          <View style={{ flex: 1 }}>
            <Button variant="ghost" fullWidth onPress={onClose}>
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
          </View>
          {canEdit ? (
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                fullWidth
                onPress={() => {
                  onSave(status, remarks);
                  onClose();
                }}
              >
                {t('save', { defaultValue: 'Save' })}
              </Button>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
