import React from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';

type Props = {
  visible: boolean;
  onToggle: () => void;
};

/**
 * Eye-icon toggle for a masked field's `rightSlot` (password, PIN) — replaces
 * the old "Show"/"Hide" text link, which ate into the placeholder's already
 * tight horizontal room and read as an odd, non-standard control next to a
 * password field. The accessibility label still carries the same
 * `show`/`hide` copy the text link used to display, so a screen reader
 * announces the same action a sighted user would have read.
 *
 * Shared by `EmailPasswordForm` (password) and `MobilePinForm` (PIN) rather
 * than inlined twice — both fields need the identical toggle.
 */
export function PasswordVisibilityToggle({ visible, onToggle }: Props) {
  const { t } = useTranslation('auth');
  const { palette, iconSize } = useTheme();

  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        visible ? t('hide', { defaultValue: 'Hide' }) : t('show', { defaultValue: 'Show' })
      }
    >
      <Ionicons
        name={visible ? 'eye-off-outline' : 'eye-outline'}
        size={iconSize.md}
        color={palette.onSurfaceVariant}
      />
    </Pressable>
  );
}
