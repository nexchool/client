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
  /**
   * 'outlined' (default) is every existing caller: a hairline border visible
   * at rest, white/`surfaceContainerLowest` fill. 'filled' is the sign-in
   * screen's soft-tint treatment — border only appears for focus/error
   * feedback, not at rest, so the field itself (not a border) is the
   * affordance. Scoped to a prop rather than a new default so the other 15
   * call sites of this component are pixel-unchanged.
   */
  variant?: 'outlined' | 'filled';
  /** Field corner radius override. Defaults to `radius.DEFAULT` (8), matching
   * every existing caller. */
  cornerRadius?: number;
  /** Gap between the label row and the field box. Defaults to 8 (existing
   * behavior). */
  labelGap?: number;
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
  variant = 'outlined',
  cornerRadius,
  labelGap = 8,
}: Props) {
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const [focused, setFocused] = useState(false);
  const isFilled = variant === 'filled';

  const borderColor = error
    ? palette.error
    : focused
    ? palette.primary
    : palette.outlineVariant;
  const showBorder = !isFilled || !!error || focused;
  const borderWidth = showBorder ? (error || focused ? 1.5 : 1) : 0;

  const helperColor = error ? palette.error : palette.onSurfaceVariant;
  const helperText = error ?? helper ?? ' '; // reserve height

  return (
    <View style={styles.root}>
      <View style={styles.labelRow}>
        <Text maxFontSizeMultiplier={FontScaleCap.labelMd}
          style={[
            typography.labelMd,
            { color: palette.onSurfaceVariant, marginBottom: labelGap, includeFontPadding: false },
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
            backgroundColor: disabled
              ? palette.surfaceContainer
              : isFilled
              ? palette.surfaceContainerLow
              : palette.surfaceContainerLowest,
            borderRadius: cornerRadius ?? radius.DEFAULT,
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
