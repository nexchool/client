import React from "react";
import { View, ScrollView, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { PageHeader } from "@/common/components/PageHeader";

const SUPPORT_EMAIL = "hello@nexchool.in";

export default function HelpSupportScreen() {
  const { t } = useTranslation("profile");
  const router = useRouter();
  const { palette, spacing, radius, touchTarget } = useTheme();

  const openEmail = () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      t("helpSupport.emailSubject"),
    )}`;
    void Linking.openURL(url);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <PageHeader
        title={t("helpSupport.screenTitle")}
        onBack={() => router.back()}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          variant="bodyMd"
          color="onSurfaceVariant"
          style={{ marginBottom: spacing.lg }}
        >
          {t("helpSupport.lead")}
        </Text>

        <PressScale
          onPress={openEmail}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: palette.surfaceContainerLow,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <View
            style={{
              width: touchTarget.min + spacing.sm,
              height: touchTarget.min + spacing.sm,
              borderRadius: radius.md,
              backgroundColor: palette.surface,
              alignItems: "center",
              justifyContent: "center",
              marginRight: spacing.md,
            }}
          >
            <AppIcon name="mail-outline" size="lg" color="primary" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodySm" color="onSurfaceVariant" style={{ marginBottom: 2 }}>
              {t("helpSupport.emailLabel")}
            </Text>
            <Text variant="labelLg" color="primary">
              {SUPPORT_EMAIL}
            </Text>
          </View>
          <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
        </PressScale>

        <Text
          variant="bodySm"
          color="onSurfaceVariant"
          style={{ fontStyle: "italic" }}
        >
          {t("helpSupport.footerNote")}
        </Text>
      </ScrollView>
    </View>
  );
}
