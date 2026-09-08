import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/common/theme';
import { SchoolIllustration } from './SchoolIllustration';

type Props = {
  children: ReactNode;
};

/**
 * The floating sign-in card — the one piece of chrome every method (email,
 * mobile OTP, mobile PIN) sits inside, so switching methods on
 * `app/(auth)/login.tsx` swaps the card's contents rather than the card
 * itself. Rounded, hairline-bordered, softly shadowed, holding the
 * decorative illustration above whatever form is active — same shape as
 * admin-web's `<div className="... rounded-2xl border ... bg-white ...">`,
 * coloured from `palette.surfaceContainerLowest`/`outlineVariant` so it
 * still reads as "a card" against a dark page background.
 */
export function AuthCard({ children }: Props) {
  const { palette, radius, spacing, elevation } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: palette.outlineVariant,
          padding: spacing.xl,
        },
        elevation.card,
      ]}
    >
      <View style={{ alignItems: 'center' }}>
        <SchoolIllustration />
      </View>
      <View style={{ marginTop: spacing.md }}>{children}</View>
    </View>
  );
}
