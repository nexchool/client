import React from "react";
import { Text, StyleSheet, View } from "react-native";
import { Colors } from "@/common/constants/colors";
import { Layout } from "@/common/constants/spacing";

const PALETTE: Record<string, { bg: string; fg: string }> = {
  active: { bg: Colors.success + "22", fg: Colors.success },
  draft: { bg: Colors.warning + "22", fg: Colors.warning },
  finalized: { bg: Colors.textTertiary + "22", fg: Colors.textSecondary },
  inactive: { bg: Colors.textTertiary + "18", fg: Colors.textSecondary },
  archived: { bg: Colors.textTertiary + "18", fg: Colors.textSecondary },
  present: { bg: Colors.success + "22", fg: Colors.success },
  absent: { bg: Colors.error + "22", fg: Colors.error },
  late: { bg: Colors.warning + "22", fg: Colors.warning },
  excused: { bg: Colors.primary + "18", fg: Colors.primary },
  primary: { bg: Colors.primary + "18", fg: Colors.primary },
  assistant: { bg: Colors.textSecondary + "22", fg: Colors.text },
  default: { bg: Colors.backgroundSecondary, fg: Colors.textSecondary },
};

export function StatusChip({
  label,
  variant = "default",
}: {
  label: string;
  variant?: keyof typeof PALETTE;
}) {
  const p = PALETTE[variant] ?? PALETTE.default;
  return (
    <View style={[styles.wrap, { backgroundColor: p.bg }]}>
      <Text style={[styles.text, { color: p.fg }]} numberOfLines={1}>
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
    borderRadius: Layout.borderRadius.sm,
    maxWidth: "100%",
  },
  text: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
});
