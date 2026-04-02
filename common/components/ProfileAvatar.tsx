import React from "react";
import { View, Text, Image, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";

export type ProfileAvatarProps = {
  uri?: string | null;
  /** Display size in logical pixels (width & height). */
  size?: number;
  /** Used for initial letter fallback when no uri and no iconName. */
  name?: string | null;
  /** When no uri, show this icon instead of an initial (e.g. role icon on home). */
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  placeholderBg?: string;
  style?: ViewStyle;
};

/**
 * Circular avatar: remote image when `uri` is set, otherwise icon or first letter of `name`.
 */
export function ProfileAvatar({
  uri,
  size = 48,
  name,
  iconName,
  iconColor = Colors.textSecondary,
  placeholderBg = Colors.backgroundSecondary,
  style,
}: ProfileAvatarProps) {
  const r = size / 2;
  const trimmed = uri?.trim();
  const hasUri = Boolean(trimmed);
  const initial = (name?.trim() || "?").charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: hasUri ? undefined : placeholderBg,
        },
        style,
      ]}
    >
      {hasUri ? (
        <Image
          source={{ uri: trimmed! }}
          style={{ width: size, height: size, borderRadius: r }}
          resizeMode="cover"
        />
      ) : iconName ? (
        <Ionicons name={iconName} size={Math.round(size * 0.52)} color={iconColor} />
      ) : (
        <Text style={[styles.initial, { fontSize: Math.max(12, size * 0.38), color: iconColor }]}>
          {initial}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontWeight: "700",
  },
});
