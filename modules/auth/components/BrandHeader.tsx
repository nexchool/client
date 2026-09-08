import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import Svg, { Circle as SvgCircle, Defs, Path as SvgPath, Pattern, Rect as SvgRect } from 'react-native-svg';
import { shade, tint, useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import type { PublishedBranding } from '@/modules/auth/hooks/usePublishedAuthMethods';

type Props = {
  branding: PublishedBranding | null;
  /** Whether the branding request has settled (success or failure). */
  loaded: boolean;
};

/**
 * The wavy seam's height, in the exact `viewBox="0 0 375 70"` coordinate
 * space the design spec hands over verbatim — the two paths below are pixel
 * ports of admin-web's `DefaultLoginLayout` mobile brand panel, not a
 * redrawing, so this has to match that viewBox exactly rather than round to
 * the app's own spacing scale.
 */
const WAVE_HEIGHT = 70;

/** Badge footprint — a 32pt image/icon area with a 4pt chip margin, for both the school-logo image and its graduation-cap fallback below. */
const BADGE_SIZE = 40;

/**
 * The school's logo, or a graduation-cap glyph — for a school with none, and
 * for one whose logo fails to load. Matches admin-web's `LogoMark` fallback
 * (lucide `GraduationCap`) rather than this app's own mark: a school with no
 * logo yet should read as "no logo on file", not as if it were branded
 * Nexchool. `FontAwesome5`'s `graduation-cap` is the closest glyph
 * `@expo/vector-icons` ships to that reference. Sits in a translucent chip so
 * a light logo (many schools export white-on-transparent marks) still reads
 * against the gradient behind it.
 */
function LogoBadge({ logoUrl }: { logoUrl: string | null }) {
  const { radius, iconSize } = useTheme();
  const [failed, setFailed] = useState(false);
  const badgeStyle = [
    styles.badge,
    { borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.15)' },
  ];

  if (!logoUrl || failed) {
    return (
      <View style={badgeStyle}>
        <FontAwesome5 name="graduation-cap" size={iconSize.md} color="white" />
      </View>
    );
  }

  return (
    <View style={badgeStyle}>
      <Image
        source={{ uri: logoUrl }}
        style={styles.badgeImage}
        resizeMode="contain"
        onError={() => setFailed(true)}
        accessibilityLabel="School logo"
      />
    </View>
  );
}

/**
 * School name with its last word set apart, echoing admin-web's
 * `DefaultLoginLayout` brand panel, where the accent word renders
 * `text-blue-300` — a colour visibly lighter *and* more saturated than the
 * plain-white head of the name, not merely faded. The head word is rendered
 * in a fixed white rather than `onPrimary` — the band gradient below is
 * always mixed dark (see `shade` usage in `BrandHeader`), specifically so a
 * light, mode-independent text colour stays legible across it; `onPrimary`
 * is designed to pair with the *exact* `primary` swatch, not a darkened
 * derivative of it, and a school whose own primary is already pale (a real
 * possibility once tenant colours are in play) would otherwise hand back
 * low-contrast text.
 *
 * The accent word used to be plain white at 72% opacity. Against a band this
 * dark, translucent white barely differs from opaque white — the two words
 * read as one flat colour, which is exactly the bug the owner's device
 * screenshot showed ("Default School" rendering fully white). `accentColor`
 * — a real tint of `palette.primary` computed in `BrandHeader`, not an
 * alpha trick — is what actually reproduces admin-web's distinct light-blue
 * effect while staying in this school's own hue.
 *
 * A one-word name has no "rest of the name" to split off, so it renders
 * plain instead of reaching past the end of the array.
 */
function BrandTitle({ name, accentColor }: { name: string; accentColor: string }) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return <>{name}</>;
  const last = parts[parts.length - 1];
  const head = parts.slice(0, -1).join(' ');
  return (
    <>
      {head}{' '}
      <Text variant="headlineLg" color="onPrimary" style={[styles.whiteText, { color: accentColor }]}>
        {last}
      </Text>
    </>
  );
}

/**
 * Decorative, non-interactive band flourishes — a dot-grid and two
 * thin-bordered circles bleeding off the edges, ported from admin-web's
 * `PanelDecor`. Plain white at low opacity rather than a theme token: these
 * sit on the guaranteed-dark gradient (see `BrandHeader`) regardless of
 * tenant colour or app mode, the same way admin-web's own decor is plain
 * white regardless of which school is signed into — only the gradient's hue
 * is meant to vary, not this chrome.
 */
function BandDecor() {
  const { spacing } = useTheme();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg
        style={{ position: 'absolute', top: spacing.lg, right: spacing.lg, width: 160, height: 112, opacity: 0.4 }}
      >
        <Defs>
          <Pattern id="brandDotGrid" patternUnits="userSpaceOnUse" width={16} height={16}>
            <SvgCircle cx={1} cy={1} r={1} fill="white" fillOpacity={0.35} />
          </Pattern>
        </Defs>
        <SvgRect x={0} y={0} width="100%" height="100%" fill="url(#brandDotGrid)" />
      </Svg>
      <View style={[styles.decorCircle, { width: 320, height: 320, borderRadius: 160, bottom: -96, right: -96 }]} />
      <View style={[styles.decorCircle, { width: 224, height: 224, borderRadius: 112, bottom: -40, right: 40 }]} />
    </View>
  );
}

/**
 * The curved seam between the band and the page below — verbatim from the
 * design spec's two paths, `viewBox="0 0 375 70"` with
 * `preserveAspectRatio="none"` so it stretches to the device width exactly
 * like the reference. The fill path uses `palette.surface` (the page
 * background token) rather than a literal, so the seam still joins cleanly
 * onto whatever the page background is in dark mode.
 */
function BandWave({ pageBackground }: { pageBackground: string }) {
  return (
    <Svg
      width="100%"
      height={WAVE_HEIGHT}
      viewBox="0 0 375 70"
      preserveAspectRatio="none"
      style={{ position: 'absolute', bottom: -1, left: 0 }}
    >
      <SvgPath
        d="M0 28 C70 2 140 2 210 26 C275 48 320 48 375 24"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={2.5}
      />
      <SvgPath
        d="M0 40 C70 14 140 14 210 38 C275 60 320 60 375 36 L375 70 L0 70 Z"
        fill={pageBackground}
      />
    </Svg>
  );
}

/**
 * The mobile stand-in for admin-web's split-screen brand panel: a gradient
 * band with a wavy bottom edge, ported structurally (dot-grid, bleeding
 * circles, the exact wave paths) but recoloured from this school's own
 * `palette.primary` — a tenant colour when the school has one
 * (`modules/branding/useTenantTheme.ts`), the app's default otherwise —
 * instead of admin-web's hardcoded blues.
 *
 * The three stops used to be `shade(primary, 0.72/0.42/0.12)` — never once
 * touching the raw `primary` swatch. `shade` scales every channel by the
 * same factor, so it does not shift hue, but at a 0.72 darken factor the
 * *value* (in HSV terms) drops so low that a violet like this app's default
 * `#4648d4` reads to the eye as navy, not violet — the band ended up
 * matching admin-web's hardcoded navy by accident, while the Sign in button
 * a few inches below it (`AuthPrimaryButton`, `[primary, shade(primary,
 * 0.18)]`) rendered the real, brighter primary. Two different-looking blues
 * on one screen.
 *
 * The fix keeps the same three-stop shape but centres it on `primary`
 * itself instead of shading away from it: `shade(primary, 0.45)` (dark,
 * still >4.5:1 against white — see the contrast note below) → `primary`
 * (mid) → `primaryContainer` (light — the design system's own lighter
 * variant of `primary`, `#6063ee`, rather than an invented tint amount).
 * Every stop is now either `primary` or a token/derivation of it, so the
 * band and the button read as one family for any tenant colour, not just
 * the default.
 *
 * Degrades honestly rather than guessing: the band and logo mark render
 * unconditionally (this is the shell, not borrowed identity), but the name
 * only appears once the branding request has settled with one — not a
 * placeholder, which would look like a bug the first time someone noticed it
 * said "School".
 */
export function BrandHeader({ branding, loaded }: Props) {
  const { palette, spacing } = useTheme();
  const name = branding?.name;
  const hasIdentity = loaded && !!name;

  const primary = palette.primary;
  // The logo/name row sits near the top of the band, which is the start of
  // this diagonal gradient (`start={{x:0.25,y:0}}`) — i.e. gradientColors[0].
  // That is the one stop white text depends on for contrast, so it is
  // computed to clear WCAG AA (4.5:1) with real margin: shade(primary, 0.45)
  // against white is ~12.75:1 for the app's default primary (#4648d4 →
  // #272875), and shade only rescales channels uniformly so this stays
  // exactly on-hue with `primary` rather than desaturating toward grey.
  const gradientColors: [string, string, string] = [shade(primary, 0.45), primary, palette.primaryContainer];
  // Light tint of `primary` for the school name's accented last word — see
  // `BrandTitle`'s doc comment for why this replaced a plain-white-at-opacity
  // trick. tint(primary, 0.5) keeps ~5.5:1 contrast against the band's dark
  // stop above while reading as a distinct light lavender, not white.
  const accentColor = tint(primary, 0.5);

  return (
    <View style={styles.clip}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.5, 1]}
        // Approximates admin-web's 150deg direction (mostly down, tilted
        // toward the right) in expo-linear-gradient's 0-1 start/end space.
        start={{ x: 0.25, y: 0 }}
        end={{ x: 0.75, y: 1 }}
      >
        <BandDecor />
        <View
          style={[
            styles.row,
            {
              justifyContent: hasIdentity ? 'flex-start' : 'center',
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.lg,
              // Clears the wave (fixed height, see WAVE_HEIGHT) plus a little
              // breathing room, so the curve never crosses the logo/title row.
              paddingBottom: spacing.xl + WAVE_HEIGHT,
            },
          ]}
        >
          <LogoBadge logoUrl={branding?.logoUrl ?? null} />
          {hasIdentity ? (
            <Text
              variant="headlineLg"
              color="onPrimary"
              style={[styles.whiteText, styles.title]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              <BrandTitle name={name as string} accentColor={accentColor} />
            </Text>
          ) : null}
        </View>
        <BandWave pageBackground={palette.surface} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    padding: 4,
  },
  badgeImage: { width: '100%', height: '100%' },
  decorCircle: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  title: { flexShrink: 1 },
  // Overrides the Text component's palette-driven color — see BrandTitle's doc comment for why.
  whiteText: { color: 'white' },
});
