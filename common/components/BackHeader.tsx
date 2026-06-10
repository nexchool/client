import React from "react";
import { View } from "react-native";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";

/** Back + title header for nested section screens (back arrow → onBack, headline title). */
export function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.marginMobile,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        gap: spacing.sm,
      }}
    >
      <AppIcon name="arrow-back" size="lg" color="onSurface" onPress={onBack} accessibilityLabel="Back" />
      <Text variant="headlineLg" color="onSurface" style={{ flex: 1 }} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}
