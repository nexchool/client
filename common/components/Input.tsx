import React, { useState, type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import { FontScaleCap, useTheme } from '@/common/theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
  secureTextEntry?: boolean;
  rightSlot?: ReactNode;
  /** Leading glyph inside the field, before the text input. Optional — most
   * callers render no icon, so this changes nothing for them. */
  leftIcon?: ReactNode;
  /** Rendered at the far end of the label row, opposite `label` — e.g. an
   * inline "Forgot password?" link beside the Password label. Optional. */
  labelRight?: ReactNode;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: TextInputProps['autoComplete'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  disabled?: boolean;
  testID?: string;
};

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helper,
  secureTextEntry,
  rightSlot,
  leftIcon,
  labelRight,
  keyboardType,
  autoComplete,
  autoCapitalize,
  disabled,
  testID,
}: Props) {
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? palette.error
    : focused
    ? palette.primary
    : palette.outlineVariant;
  const borderWidth = error || focused ? 1.5 : 1;

  const helperColor = error ? palette.error : palette.onSurfaceVariant;
  const helperText = error ?? helper ?? ' '; // reserve height

  return (
    <View style={styles.root}>
      <View style={styles.labelRow}>
        <Text maxFontSizeMultiplier={FontScaleCap.labelMd}
          style={[
            typography.labelMd,
            { color: palette.onSurfaceVariant, marginBottom: 8, includeFontPadding: false },
          ]}
        >
          {label}
        </Text>
        {labelRight}
      </View>
      <View
        style={[
          styles.fieldWrap,
          {
            backgroundColor: disabled ? palette.surfaceContainer : palette.surfaceContainerLowest,
            borderRadius: radius.DEFAULT,
            borderColor,
            borderWidth,
            paddingHorizontal: spacing.md,
            opacity: disabled ? 0.5 : 1,
          },
          focused && !error ? elevation.focusRing(palette.primary) : null,
        ]}
      >
        {leftIcon ? <View style={styles.left}>{leftIcon}</View> : null}
        <TextInput
          maxFontSizeMultiplier={FontScaleCap.bodyMd}
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.outline}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            typography.bodyMd,
            styles.input,
            {
              color: palette.onSurface,
              ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
            },
          ]}
        />
        {rightSlot ? <View style={styles.right}>{rightSlot}</View> : null}
      </View>
      <Text maxFontSizeMultiplier={FontScaleCap.labelSm}
        style={[
          typography.labelSm,
          { color: helperColor, marginTop: 4, minHeight: 14, includeFontPadding: false },
        ]}
        numberOfLines={2}
      >
        {helperText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldWrap: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  left: { marginRight: 8 },
  right: { marginLeft: 8 },
});
