import React, { useMemo } from 'react';
import { Text, type AppTextProps } from '@/common/components/Text';
import { EmphasisTextStyle } from '@/common/theme';

/** Escape a user-typed term so it is matched literally, not as a pattern. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type Props = Omit<AppTextProps, 'children'> & {
  text: string;
  /** The term to emphasise. Matched case-insensitively, anywhere in the text. */
  highlight?: string;
};

/**
 * A result line with the matched part picked out.
 *
 * Worth the work on admission numbers above all: "NDS/2026/0001" tells you
 * nothing about why it came back for "0001" until the matching run is the part
 * your eye lands on. Weight rather than colour does the emphasis, so it still
 * reads at a glance for anyone who cannot separate the two.
 *
 * The match is emphasised with `EmphasisTextStyle`, which swaps the font
 * family. Setting `fontWeight` here does nothing: every role in the type scale
 * names a concrete Inter face and RN will not synthesise a heavier one from
 * it. The first version of this set `fontWeight: '700'` and rendered matches
 * identically to the text around them.
 */
export function HighlightedText({ text, highlight, ...textProps }: Props) {
  const parts = useMemo(() => {
    const term = highlight?.trim();
    if (!term) return null;
    const pattern = new RegExp(`(${escapeRegExp(term)})`, 'ig');
    const split = text.split(pattern).filter((piece) => piece !== '');
    // No match, or the whole string is the match — nothing to pick out.
    if (split.length <= 1) return null;
    return split;
  }, [text, highlight]);

  if (!parts) {
    return <Text {...textProps}>{text}</Text>;
  }

  const term = highlight!.trim().toLowerCase();
  return (
    <Text {...textProps}>
      {parts.map((piece, index) =>
        piece.toLowerCase() === term ? (
          <Text
            key={index}
            {...textProps}
            style={[textProps.style, EmphasisTextStyle]}
          >
            {piece}
          </Text>
        ) : (
          piece
        )
      )}
    </Text>
  );
}
