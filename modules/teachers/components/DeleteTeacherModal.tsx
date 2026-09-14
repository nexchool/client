import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { ContentMaxWidth, useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Button } from '@/common/components/Button';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * The Delete Teacher confirmation, redesigned to the approved look: a red
 * trash glyph in a soft-red circle, and a bordered Cancel beside a solid red
 * Delete.
 *
 * A purpose-built modal rather than a change to `common/components/Dialog.tsx`
 * (the `useDialog().confirm()` used by every other confirmation in the app,
 * `TeacherDetailScreen`'s own delete-availability-slot included) — this way
 * the redesign touches nothing outside this one screen. It borrows Dialog's
 * own overlay colour/opacity, entrance animation, card radius/elevation and
 * typography tokens so it still reads as the same app.
 */
export function DeleteTeacherModal({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: Props) {
  const { palette, spacing, radius, elevation } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View
          entering={FadeIn.duration(150)}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11, 28, 48, 0.45)' }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onCancel}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </Animated.View>

        <Animated.View
          entering={ZoomIn.springify().damping(18).mass(0.6)}
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[
            styles.card,
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
              gap: spacing.md,
            },
          ]}
        >
          <View
            style={[
              styles.iconWell,
              { backgroundColor: palette.errorContainer, borderRadius: radius.full },
            ]}
          >
            <AppIcon name="trash-outline" size="lg" color="error" />
          </View>

          <View style={{ gap: spacing.xs }}>
            <Text variant="headlineMd" color="onSurface">
              {title}
            </Text>
            <Text variant="bodyMd" color="onSurfaceVariant">
              {message}
            </Text>
          </View>

          <View style={[styles.actionsRow, { gap: spacing.sm, marginTop: spacing.xs }]}>
            <View style={styles.action}>
              <Button
                variant="ghost"
                fullWidth
                onPress={onCancel}
                style={{
                  backgroundColor: palette.surfaceContainerLowest,
                  borderWidth: 1,
                  borderColor: palette.outlineVariant,
                }}
              >
                {cancelLabel}
              </Button>
            </View>
            <View style={styles.action}>
              <Button variant="destructive" fullWidth onPress={onConfirm}>
                {confirmLabel}
              </Button>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: ContentMaxWidth },
  iconWell: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  actionsRow: { flexDirection: 'row' },
  action: { flex: 1 },
});
