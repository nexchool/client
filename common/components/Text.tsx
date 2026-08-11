import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/common/theme';
import { FontScaleCap, type TypeRole } from '@/common/theme';

type ColorKey = keyof ReturnType<typeof useTheme>['palette'];

export interface AppTextProps extends RNTextProps {
  /** Typography role from the scale. Default 'bodyMd'. */
  variant?: TypeRole;
  /** Palette color key. Default 'onSurface'. */
  color?: ColorKey;
}

/**
 * Every string in the app goes through here, which is why the font-scale cap
 * lives here rather than being remembered at 600 call sites.
 *
 * A parent who has set Larger Text on their phone means it, so their setting
 * is honoured — up to the point where a row stops holding its contents. iOS
 * goes to 3.1x and Android to 2x; at either, a 12pt label inside a 32pt chip
 * simply disappears. The cap per role is the multiplier that role's line still
 * fits at, so text grows as far as the layout allows and then stops.
 *
 * Pass `maxFontSizeMultiplier` to override — a long block of prose with room
 * to reflow can take more than a table cell can.
 */
export function Text({
  variant = 'bodyMd',
  color = 'onSurface',
  style,
  maxFontSizeMultiplier,
  ...rest
}: AppTextProps) {
  const { typography, palette } = useTheme();
  return (
    <RNText
      style={[typography[variant], { color: palette[color] }, style]}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? FontScaleCap[variant]}
      {...rest}
    />
  );
}

export function Heading(props: Omit<AppTextProps, 'variant'> & { variant?: Extract<TypeRole, 'display' | 'headlineLg' | 'headlineMd' | 'titleSm'> }) {
  const { variant, ...rest } = props;
  return <Text variant={variant ?? 'headlineMd'} {...rest} />;
}

export function Body(props: Omit<AppTextProps, 'variant'> & { variant?: Extract<TypeRole, 'bodyLg' | 'bodyMd' | 'bodySm'> }) {
  const { variant, ...rest } = props;
  return <Text variant={variant ?? 'bodyMd'} {...rest} />;
}

export function Caption(props: Omit<AppTextProps, 'variant'> & { variant?: Extract<TypeRole, 'labelMd' | 'labelSm' | 'overline'> }) {
  const { variant, ...rest } = props;
  return <Text variant={variant ?? 'labelSm'} {...rest} />;
}
