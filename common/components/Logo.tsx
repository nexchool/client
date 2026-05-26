import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

// SVG markup inlined to avoid bundler/Metro config complexity around .svg imports.
// Source: client/assets/images/nexchool-logo.svg (mirror this if the asset is updated).
const LOGO_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="20" y="20" width="60" height="60" rx="12" fill="url(#grad)" />
  <path d="M35 50 L45 60 L65 40" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  <path d="M30 30 L70 30 M30 70 L70 70" stroke="white" stroke-width="2" stroke-opacity="0.3" />
</svg>`;

type Props = {
  size?: 'sm' | 'lg';
};

const DIMENSIONS = { sm: 32, lg: 96 } as const;

export function Logo({ size = 'lg' }: Props) {
  const dim = DIMENSIONS[size];
  return (
    <View style={{ width: dim, height: dim }}>
      <SvgXml xml={LOGO_XML} width={dim} height={dim} />
    </View>
  );
}
