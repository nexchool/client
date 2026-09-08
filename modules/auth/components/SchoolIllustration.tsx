import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { useTheme, shade, tint } from '@/common/theme';

type Props = {
  /** Square footprint in px. Default 88, matching the card's own rhythm. */
  size?: number;
};

/**
 * Flat, self-contained school illustration shown atop the sign-in card.
 * Decorative only — geometry ported verbatim from admin-web's
 * `DefaultLoginLayout`/`SchoolIllustration` (the reference this screen is
 * matching), recoloured from this school's own `palette.primary` instead of
 * admin-web's hardcoded blues. `shade`/`tint` only ever move that one token,
 * so a tenant's own colour (or the app default, when there is none) carries
 * through to every shape rather than being overridden by a second hardcoded
 * hue. The cloud ellipses stay plain white — they read as clouds against any
 * hue, the same way they do in the admin-web original.
 */
export function SchoolIllustration({ size = 88 }: Props) {
  const { palette } = useTheme();
  const primary = palette.primary;

  const sky = tint(primary, 0.86);
  const roofBase = tint(primary, 0.55);
  const tower = tint(primary, 0.72);
  const accent = primary;
  const flagpole = shade(primary, 0.35);

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" accessible={false}>
      <Circle cx={60} cy={52} r={40} fill={sky} />
      <Ellipse cx={42} cy={34} rx={9} ry={5} fill="white" fillOpacity={0.85} />
      <Ellipse cx={82} cy={30} rx={7} ry={4} fill="white" fillOpacity={0.85} />
      <Rect x={38} y={52} width={44} height={30} rx={2} fill={roofBase} />
      <Rect x={52} y={40} width={16} height={42} rx={1} fill={tower} />
      <Path d="M52 40a8 8 0 0 1 16 0z" fill={accent} />
      <Rect x={59.2} y={26} width={1.6} height={11} fill={flagpole} />
      <Path d="M60.8 27h8l-2 2.5 2 2.5h-8z" fill={accent} />
      <Rect x={55.5} y={66} width={9} height={16} rx={4.5} fill={accent} />
      <Rect x={42} y={58} width={6} height={6} rx={1} fill={accent} />
      <Rect x={72} y={58} width={6} height={6} rx={1} fill={accent} />
      <Rect x={30} y={82} width={60} height={4} rx={2} fill={roofBase} />
    </Svg>
  );
}
