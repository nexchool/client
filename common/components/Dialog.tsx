import React, { type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { ContentMaxWidth, useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Button } from '@/common/components/Button';

/**
 * What the dialog is about, which decides its icon and accent.
 *
 * Tone is not decoration: "danger" is the difference between a person reading
 * the sentence and a person tapping through it, and it is the only signal that
 * survives someone who does not read the body text at all.
 */
export type DialogTone = 'default' | 'danger' | 'warning' | 'success';

export type DialogAction = {
  label: string;
  onPress: () => void;
  /** Defaults to `primary` for the last action, `ghost` for the others. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  tone?: DialogTone;
  /** Replaces the tone's icon. Pass `null` for no icon at all. */
  icon?: ReactNode | null;
  /** Bespoke body, rendered under the description. */
  children?: ReactNode;
  /** In order. The last one is the affirmative and gets the filled button. */
  actions?: DialogAction[];
  /**
   * Whether the backdrop and the Android back button dismiss it. Default true.
   * Turn it off only when there is genuinely no safe default answer — a
   * dialog nobody can escape is how an app becomes unusable.
   */
  dismissible?: boolean;
};

const TONE_ICON: Record<DialogTone, { name: string; color: 'primary' | 'error' | 'warning' | 'success'; container: 'primaryContainer' | 'errorContainer' | 'surfaceContainerHigh' }> = {
  default: { name: 'information-circle', color: 'primary', container: 'primaryContainer' },
  danger: { name: 'alert-circle', color: 'error', container: 'errorContainer' },
  warning: { name: 'warning', color: 'warning', container: 'surfaceContainerHigh' },
  success: { name: 'checkmark-circle', color: 'success', container: 'surfaceContainerHigh' },
};

/**
 * The app's dialog: one surface, one set of decisions about type, spacing and
 * tone, for every question the app needs to ask.
 *
 * It replaces `Alert.alert` for anything that is genuinely a decision. It is
 * deliberately *not* the answer for announcements — "Saved", "Could not
 * connect" — which have nothing to decide and belong in a Toast, where they do
 * not stop the person to collect a tap.
 *
 * Unmounting is driven straight off `visible` and the fade is the Modal's own.
 * Nothing here waits on an animation callback to take the Modal down: that is
 * exactly how the navigation drawer once left an invisible window over the
 * whole app, swallowing every touch until it was relaunched.
 */
export function Dialog({
  visible,
  onClose,
  title,
  description,
  tone = 'default',
  icon,
  children,
  actions,
  dismissible = true,
}: Props) {
  const { palette, spacing, radius, elevation } = useTheme();
  const toneIcon = TONE_ICON[tone];
  const dismiss = dismissible ? onClose : () => {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View
          entering={FadeIn.duration(150)}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11, 28, 48, 0.45)' }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismiss}
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
          {icon === null ? null : (
            <View
              style={[
                styles.iconWell,
                {
                  backgroundColor: palette[toneIcon.container],
                  borderRadius: radius.full,
                },
              ]}
            >
              {icon ?? (
                <AppIcon name={toneIcon.name as never} size="lg" color={toneIcon.color} />
              )}
            </View>
          )}

          <View style={{ gap: spacing.xs }}>
            <Text variant="headlineMd" color="onSurface">
              {title}
            </Text>
            {description ? (
              <Text variant="bodyMd" color="onSurfaceVariant">
                {description}
              </Text>
            ) : null}
          </View>

          {children}

          {actions && actions.length > 0 ? (
            <View
              style={[
                // Side by side reads as a pair of alternatives, which is what
                // two actions are. A third will not fit at any font scale
                // worth supporting, so more than two stack.
                actions.length > 2 ? styles.actionsColumn : styles.actionsRow,
                { gap: spacing.sm, marginTop: spacing.xs },
              ]}
            >
              {actions.map((action, index) => (
                <View key={action.label} style={actions.length > 2 ? undefined : styles.action}>
                  <Button
                    onPress={action.onPress}
                    variant={
                      action.variant ??
                      (index === actions.length - 1
                        ? tone === 'danger'
                          ? 'destructive'
                          : 'primary'
                        : 'ghost')
                    }
                    loading={action.loading}
                    disabled={action.disabled}
                    fullWidth
                  >
                    {action.label}
                  </Button>
                </View>
              ))}
            </View>
          ) : null}
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
  actionsColumn: { flexDirection: 'column-reverse' },
  action: { flex: 1 },
});
