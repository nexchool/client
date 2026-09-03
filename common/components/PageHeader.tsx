import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';

type Props = {
  title: string;
  /** Optional second line under the title. */
  subtitle?: string;
  /** When given, a back chevron is shown before the title. */
  onBack?: () => void;
  /** Accessible label for the back control. */
  backLabel?: string;
  /** Trailing control — an action button, a count, a menu. */
  right?: ReactNode;
  /** Hairline rule under the header. Default true. */
  divider?: boolean;
  /**
   * Drop the horizontal inset, for a header rendered inside a container that
   * already applies one (ScreenContainer, or a padded form view). Without it
   * the two insets stack and the title sits further in than the fields below.
   */
  noHorizontalPadding?: boolean;
};

/**
 * The page title, in the one place every screen gets it from.
 *
 * Screens used to build this row themselves, and no two agreed: padding was
 * `md` top and bottom on the student and teacher lists, `sm` over `md` on
 * holidays, and something else again on settings — so the title sat at a
 * different height on every screen you navigated to.
 *
 * **The top padding is zero on purpose.** AppHeader already ends in
 * `spacing.md`, and a screen adding its own on top of that is where the wide
 * empty band under the app bar came from — two components each paying for the
 * same gap. The bar owns the space above the title; this owns the space below.
 *
 * The back control is a chevron rather than a full arrow: it points the way
 * out without competing with the title for weight, and it is what the platform
 * itself uses.
 */
export function PageHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  right,
  divider = true,
  noHorizontalPadding = false,
}: Props) {
  const { palette, spacing } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: noHorizontalPadding ? 0 : spacing.marginMobile,
          paddingBottom: spacing.md,
          gap: spacing.sm,
          ...(divider
            ? {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: palette.outlineVariant,
              }
            : null),
        },
      ]}
    >
      {onBack ? (
        <AppIcon
          name="chevron-back"
          size="lg"
          color="onSurface"
          onPress={onBack}
          accessibilityLabel={backLabel ?? 'Back'}
        />
      ) : null}
      <View style={styles.titles}>
        <Text variant="headlineLg" color="onSurface" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodyMd" color="onSurfaceVariant" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  titles: { flex: 1 },
});
