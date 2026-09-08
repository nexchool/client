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

/**
 * The sign-in card's shadow — a card that has to read as floating above the
 * page (unlike every list/detail card `cardShadow` serves, which sit flush
 * against a background of the same surface tint). Deliberately its own
 * function rather than a `cardShadow` tweak: `cardShadow` is spread across
 * dozens of screens (finance, attendance, students, ...) that were never
 * part of this pass, and darkening/enlarging it there would be an unrelated,
 * unreviewed visual change to all of them. `color` is the same dark-tint
 * parameter `cardShadow`/`modalShadow` take — callers pass a dark tone (a
 * shaded primary, or `onSurface`) so the glow stays in-hue rather than a flat
 * grey.
 */
export function floatingShadow(color: string = '#0b1c30'): ViewStyle {
  if (Platform.OS === 'android') {
    return { elevation: 6 };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
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
