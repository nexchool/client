/**
 * Cross-platform elevation helpers. iOS uses shadow* props, Android uses
 * elevation. Each helper returns a ViewStyle ready to spread into a View.
 */

import { Platform, type ViewStyle } from 'react-native';

export function cardShadow(color: string = '#0b1c30'): ViewStyle {
  if (Platform.OS === 'android') {
    return { elevation: 2 };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  };
}

export function modalShadow(color: string = '#0b1c30'): ViewStyle {
  if (Platform.OS === 'android') {
    return { elevation: 8 };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  };
}

export function focusRing(primaryHex: string): ViewStyle {
  // Subtle outer glow used on focused input wrappers.
  if (Platform.OS === 'android') {
    return { elevation: 0 }; // Android falls back to border-only emphasis
  }
  return {
    shadowColor: primaryHex,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  };
}
