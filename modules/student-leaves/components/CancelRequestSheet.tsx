// client/modules/student-leaves/components/CancelRequestSheet.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { BottomSheet } from '@/common/components/sheet';
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
  const { spacing } = useTheme();
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    await onSubmit(reason.trim());
    setReason('');
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissOnBackdropPress={false}>
          <Text variant="headlineMd" color="onSurface">
            {t('cancel.title', { defaultValue: 'Request cancellation' })}
          </Text>
          <Text variant="bodyMd" color="onSurfaceVariant">
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
    </BottomSheet>
  );
}
