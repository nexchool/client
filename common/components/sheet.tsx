import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';

/**
 * The app's bottom-sheet idiom (scrim + grab handle + rounded top card) and the
 * Input-anatomy trigger field, shared by DatePicker, SelectSheet, and future
 * sheet-based pickers so every selector looks and behaves the same.
 */

export function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { palette, spacing, radius } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: palette.surfaceContainerLowest,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          padding: spacing.lg,
          paddingBottom: spacing.xl,
          gap: spacing.md,
        }}
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
        {children}
      </View>
    </Modal>
  );
}

type AppIconName = React.ComponentProps<typeof AppIcon>['name'];

/** Pressable field that opens a sheet — mirrors Input's anatomy (52px, helper line). */
export function FieldTrigger({
  label,
  display,
  placeholder,
  error,
  disabled,
  onPress,
  icon = 'chevron-down',
}: {
  label?: string;
  display: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  onPress: () => void;
  icon?: AppIconName;
}) {
  const { palette, spacing, radius } = useTheme();
  const borderColor = error ? palette.error : palette.outlineVariant;
  return (
    <View style={{ width: '100%' }}>
      {label ? (
        <Text variant="labelMd" color="onSurfaceVariant" style={{ marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        style={{
          height: 52,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: disabled ? palette.surfaceContainer : palette.surfaceContainerLowest,
          borderRadius: radius.DEFAULT,
          borderWidth: error ? 1.5 : 1,
          borderColor,
          paddingHorizontal: spacing.md,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Text
          variant="bodyMd"
          color={display ? 'onSurface' : 'outline'}
          style={{ flex: 1 }}
          numberOfLines={1}
        >
          {display || placeholder}
        </Text>
        <AppIcon name={icon} size="md" color="onSurfaceVariant" />
      </Pressable>
      <Text
        variant="labelSm"
        color={error ? 'error' : 'onSurfaceVariant'}
        style={{ marginTop: 4, minHeight: 14 }}
        numberOfLines={2}
      >
        {error ?? ' '}
      </Text>
    </View>
  );
}
