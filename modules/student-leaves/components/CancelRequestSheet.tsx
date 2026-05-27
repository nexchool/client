// client/modules/student-leaves/components/CancelRequestSheet.tsx
import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Input } from '@/common/components/Input';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  loading?: boolean;
};

export function CancelRequestSheet({ visible, onClose, onSubmit, loading }: Props) {
  const { t } = useTranslation('studentLeaves');
  const { palette, spacing, radius, typography } = useTheme();
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    await onSubmit(reason.trim());
    setReason('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
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
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: palette.outlineVariant }} />
          </View>
          <Text style={[typography.headlineMd, { color: palette.onSurface }]}>
            {t('cancel.title', { defaultValue: 'Request cancellation' })}
          </Text>
          <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]}>
            {t('cancel.body', { defaultValue: 'Your class teacher will be asked to approve the cancellation.' })}
          </Text>
          <Input
            label={t('cancel.reasonLabel', { defaultValue: 'Reason for cancellation' })}
            value={reason}
            onChangeText={setReason}
            placeholder={t('cancel.reasonPlaceholder', { defaultValue: 'Plans changed' })}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md }}>
            <Link onPress={onClose}>{t('cancel.dismiss', { defaultValue: 'Dismiss' })}</Link>
            <View style={{ flex: 1 }}>
              <Button variant="primary" fullWidth loading={loading} onPress={handleSubmit}>
                {t('cancel.submit', { defaultValue: 'Send request' })}
              </Button>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
