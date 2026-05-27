import React from 'react';
import { View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '@/common/theme';

type Props = { source: string };

export function MarkdownView({ source }: Props) {
  const { palette, spacing } = useTheme();

  const styles = {
    body: { color: palette.onSurface, fontSize: 15, lineHeight: 22 },
    heading1: {
      color: palette.onSurface,
      fontSize: 22,
      fontWeight: '700' as const,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    heading2: {
      color: palette.onSurface,
      fontSize: 19,
      fontWeight: '600' as const,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    heading3: {
      color: palette.onSurface,
      fontSize: 17,
      fontWeight: '600' as const,
      marginTop: spacing.sm,
      marginBottom: 4,
    },
    strong: { fontWeight: '700' as const, color: palette.onSurface },
    em: { fontStyle: 'italic' as const, color: palette.onSurface },
    link: { color: palette.primary, textDecorationLine: 'underline' as const },
    bullet_list: { marginVertical: spacing.sm },
    ordered_list: { marginVertical: spacing.sm },
    paragraph: { color: palette.onSurface, marginTop: 0, marginBottom: spacing.sm },
  };

  return (
    <View>
      <Markdown style={styles}>{source || ''}</Markdown>
    </View>
  );
}
