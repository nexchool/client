import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/common/theme";
import type { Palette } from "@/common/theme";
import { Text } from "@/common/components/Text";

type ChipVariant =
  | "active"
  | "draft"
  | "finalized"
  | "inactive"
  | "archived"
  | "present"
  | "absent"
  | "late"
  | "excused"
  | "primary"
  | "assistant"
  | "default";

/** Maps a chip variant to a foreground palette token; background is the same token at low alpha. */
const VARIANT_FG: Record<ChipVariant, keyof Palette> = {
  active: "success",
  draft: "warning",
  finalized: "onSurfaceVariant",
  inactive: "onSurfaceVariant",
  archived: "onSurfaceVariant",
  present: "success",
  absent: "error",
  late: "warning",
  excused: "primary",
  primary: "primary",
  assistant: "onSurfaceVariant",
  default: "onSurfaceVariant",
};

export function StatusChip({
  label,
  variant = "default",
}: {
  label: string;
  variant?: ChipVariant;
}) {
  const { palette, radius } = useTheme();
  const fg = palette[VARIANT_FG[variant] ?? "onSurfaceVariant"];
  return (
    <View style={[styles.wrap, { backgroundColor: fg + "22", borderRadius: radius.sm }]}>
      <Text variant="labelSm" style={[styles.text, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: "100%",
  },
  text: { textTransform: "capitalize" },
});
