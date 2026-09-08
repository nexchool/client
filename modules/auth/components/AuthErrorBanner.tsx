import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, withAlpha } from '@/common/theme';
import { Text } from '@/common/components/Text';

type Props = {
  message: string;
  /** Positioning only (margin) — the box's own look is not a call-site decision. */
  style?: StyleProp<ViewStyle>;
};

/**
 * The one way this screen surfaces a sign-in error — session expiry, a
 * rejected password/code/PIN, a request that failed outright — across every
 * method it offers (email, mobile OTP, mobile PIN). Before this component
 * existed, `EmailPasswordForm`'s session-expiry notice was a saturated
 * `errorContainer` fill roughly 130px tall, centred, wedged between the
 * subtitle and the first field — it read as the screen's main event instead
 * of a footnote to it, and none of the other three forms agreed with it or
 * each other on how an error should look.
 *
 * Ported from admin-web's `LoginForm` (`rounded-lg bg-destructive/10 px-3
 * py-2 text-sm text-destructive`, `role="alert"`): a ~10% tint of the error
 * token, not a solid fill, left-aligned like a paragraph rather than centred
 * like a warning sign. `withAlpha` derives the tint from `palette.error`
 * itself (not a hardcoded pink) so it stays correct in both palettes and for
 * any tenant colour scheme.
 *
 * `accessibilityRole="alert"` matches this codebase's existing convention
 * for transient error/notice surfaces (`Toast`, `Dialog`).
 * `accessibilityLiveRegion="polite"` is additionally set because, unlike a
 * `Toast` (which mounts fresh and is inherently announced) or a `Dialog`
 * (which steals focus), this banner can appear inside a screen that is
 * already on-screen and focused — a live region is what gets a screen reader
 * to notice it without the user having to go looking.
 */
export function AuthErrorBanner({ message, style }: Props) {
  const { palette, spacing, radius } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        {
          paddingHorizontal: spacing[12],
          paddingVertical: spacing.sm,
          borderRadius: radius.DEFAULT,
          backgroundColor: withAlpha(palette.error, 0.1),
        },
        style,
      ]}
    >
      <Text variant="bodySm" style={{ color: palette.error, textAlign: 'left' }}>
        {message}
      </Text>
    </View>
  );
}
