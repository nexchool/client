import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { Logo } from '@/common/components/Logo';
import type { PublishedBranding } from '@/modules/auth/hooks/usePublishedAuthMethods';

type Props = {
  branding: PublishedBranding | null;
  /** Whether the branding request has settled (success or failure). */
  loaded: boolean;
};

/**
 * The school's logo, or the app's own mark — for a school with none, and for
 * one whose logo fails to load. Same footprint (`Logo`'s "lg" size) either
 * way, so neither case shifts the name below it.
 */
function BrandLogo({ logoUrl }: { logoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!logoUrl || failed) return <Logo size="lg" />;
  return (
    <Image
      source={{ uri: logoUrl }}
      style={styles.logoImage}
      resizeMode="contain"
      onError={() => setFailed(true)}
      accessibilityLabel="School logo"
    />
  );
}

/**
 * School name with its last word set apart, echoing admin-web's
 * `DefaultLoginLayout` brand panel — ported here as an accent of opacity
 * rather than a second hue, because the surrounding band is already drawn in
 * this school's own primary colour and a hardcoded accent hue could land
 * anywhere against it. A one-word name has no "rest of the name" to split
 * off, so it renders plain instead of reaching past the end of the array.
 */
function BrandTitle({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return <>{name}</>;
  const last = parts[parts.length - 1];
  const head = parts.slice(0, -1).join(' ');
  return (
    <>
      {head}{' '}
      <Text variant="headlineLg" color="onPrimary" style={styles.accentWord}>
        {last}
      </Text>
    </>
  );
}

/**
 * The mobile stand-in for admin-web's split-screen brand panel. There is no
 * second column on a 390pt-wide phone, so the panel becomes a band above the
 * form instead — same identity (logo, accented name, tagline), adapted
 * layout rather than a shrunk copy of the desktop one.
 *
 * Degrades honestly rather than guessing: until the branding request has
 * settled, and if it settles with nothing (offline, a school with no policy
 * row), this renders the same plain centred mark every other `(auth)` screen
 * opens with — not a placeholder name, which would look like a bug the first
 * time someone noticed it said "School".
 */
export function BrandHeader({ branding, loaded }: Props) {
  const { palette, spacing, radius } = useTheme();
  const name = branding?.name;

  if (!loaded || !name) {
    return (
      <View style={styles.plainHeader}>
        <Logo size="lg" />
      </View>
    );
  }

  const tagline = branding?.tagline;

  return (
    <View
      style={[
        styles.band,
        {
          backgroundColor: palette.primary,
          borderBottomLeftRadius: radius.xl,
          borderBottomRightRadius: radius.xl,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
        },
      ]}
    >
      <BrandLogo logoUrl={branding?.logoUrl ?? null} />
      <Text
        variant="headlineLg"
        color="onPrimary"
        style={styles.title}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        <BrandTitle name={name} />
      </Text>
      {tagline ? (
        <Text variant="bodySm" color="onPrimary" style={styles.tagline} numberOfLines={1}>
          {tagline}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plainHeader: { alignItems: 'center', paddingTop: 32 },
  band: { alignItems: 'center', paddingTop: 40 },
  logoImage: { width: 96, height: 96, borderRadius: 20 },
  title: { textAlign: 'center', marginTop: 16 },
  tagline: { textAlign: 'center', marginTop: 4, opacity: 0.85 },
  accentWord: { opacity: 0.72 },
});
