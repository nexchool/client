import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
  /** One optional affordance, e.g. "Retry" or "Undo". */
  action?: { label: string; onPress: () => void };
};

const TONE: Record<ToastTone, { icon: string; color: 'success' | 'error' | 'onSurfaceVariant' }> = {
  success: { icon: 'checkmark-circle', color: 'success' },
  error: { icon: 'alert-circle', color: 'error' },
  info: { icon: 'information-circle', color: 'onSurfaceVariant' },
};

/**
 * One toast. Reports something that has already happened.
 *
 * Three quarters of this app's `Alert.alert` calls were announcements —
 * "Attendance saved", "Could not connect" — each of which stopped the person
 * and took a tap to acknowledge something they could do nothing about. A toast
 * says the same thing without taking the screen hostage, and an error can
 * carry the one action worth offering instead of a dead OK.
 */
function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const { palette, spacing, radius, elevation } = useTheme();
  const tone = TONE[item.tone];
  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(140)}
      style={[
        styles.toast,
        elevation.card,
        {
          backgroundColor: palette.inverseSurface,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          gap: spacing.sm,
        },
      ]}
      accessibilityRole="alert"
    >
      <AppIcon name={tone.icon as never} size="md" color={tone.color} />
      <Text
        variant="bodyMd"
        color="inverseOnSurface"
        style={styles.message}
        numberOfLines={3}
      >
        {item.message}
      </Text>
      {item.action ? (
        <Pressable onPress={item.action.onPress} hitSlop={8}>
          <Text variant="labelLg" color="primary">
            {item.action.label}
          </Text>
        </Pressable>
      ) : (
        <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="Dismiss">
          <AppIcon name="close" size="md" color="inverseOnSurface" />
        </Pressable>
      )}
    </Animated.View>
  );
}

/**
 * Where toasts live: top-right of the screen, across the whole app.
 *
 * `pointerEvents="box-none"` on the host is what keeps the screen underneath
 * usable — only the toasts themselves take touches, the gap around them does
 * not. A toast that blocked the list it was reporting on would be worse than
 * the alert it replaced.
 *
 * Wrapped in a transparent `Modal` — same as `Dialog` — because a toast fired
 * while a form's own bottom sheet (its own `Modal`) is open otherwise renders
 * *underneath* that sheet: a plain positioned `View` can never out-stack a
 * native `Modal` window, no matter its z-index. That's also why top-right
 * rather than the bottom band a sheet's footer sits over: a corner the open
 * sheet never reaches stays legible without depending on stacking order at
 * all. `onRequestClose` clears the visible toasts rather than doing nothing,
 * so a back-press while one is showing dismisses it instead of being
 * swallowed.
 *
 * Rendered newest-first so an incoming toast appears at the corner itself —
 * the state array stays oldest-first (`FeedbackProvider` still drops the
 * oldest past three), only the on-screen stacking order is reversed here.
 */
export function ToastHost({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();
  if (items.length === 0) return null;
  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => items.forEach((item) => onDismiss(item.id))}
    >
      <View
        pointerEvents="box-none"
        style={[
          styles.host,
          {
            top: insets.top + spacing.md,
            right: spacing.marginMobile,
            gap: spacing.sm,
          },
        ]}
      >
        {[...items].reverse().map((item) => (
          <Toast key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', alignItems: 'flex-end' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 240,
    maxWidth: 340,
    minHeight: 48,
  },
  message: { flex: 1 },
});
