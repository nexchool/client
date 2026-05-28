import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/common/theme';
import type { TypeRole } from '@/common/theme';

type ColorKey = keyof ReturnType<typeof useTheme>['palette'];

export interface AppTextProps extends RNTextProps {
  /** Typography role from the scale. Default 'bodyMd'. */
  variant?: TypeRole;
  /** Palette color key. Default 'onSurface'. */
  color?: ColorKey;
}

export function Text({ variant = 'bodyMd', color = 'onSurface', style, ...rest }: AppTextProps) {
  const { typography, palette } = useTheme();
  return <RNText style={[typography[variant], { color: palette[color] }, style]} {...rest} />;
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
