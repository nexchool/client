import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, ScrollView, RefreshControl, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme, type Palette } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { BackHeader } from "@/common/components/BackHeader";
import { callPhone } from "@/common/utils/phone";
import { formatDateTime } from "@/common/utils/datetime";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import {
  useHostelGatepass,
  useApproveGatepass,
  useRejectGatepass,
  useGatepassCheckout,
  useGatepassCheckin,
} from "../hooks/useHostelAdmin";
import {
  gatepassStatusMeta,
  gatepassTypeMeta,
  PERM_GP_APPROVE,
  PERM_GP_GATEKEEPER,
} from "../utils/gatepass";

type IconName = React.ComponentProps<typeof AppIcon>["name"];

function ActionButton({
  label,
  icon,
  tone,
  onPress,
  disabled,
}: {
  label: string;
  icon: IconName;
  tone: keyof Palette;
  onPress: () => void;
  disabled: boolean;
}) {
  const { palette, spacing, radius } = useTheme();
  const onTone = tone === "error" ? "onError" : tone === "primary" ? "onPrimary" : "onSecondary";
  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        backgroundColor: palette[tone],
        borderRadius: radius.lg,
        paddingVertical: spacing.md,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <AppIcon name={icon} size="md" color={onTone as keyof Palette} />
      <Text variant="labelLg" color={onTone as keyof Palette}>
        {label}
      </Text>
    </PressScale>
  );
}

export function HostelGatepassDetailScreen() {
  const { t } = useTranslation("hostel");
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette, spacing, radius, elevation } = useTheme();
  const { hasPermission } = usePermissions();
  const { data, isLoading, error, refetch, isRefetching } = useHostelGatepass(id);

  const approve = useApproveGatepass();
  const reject = useRejectGatepass();
  const checkout = useGatepassCheckout();
  const checkin = useGatepassCheckin();
  const [busy, setBusy] = useState(false);

  const cardStyle = [
    elevation.card,
    { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.lg },
  ];
  const rowBorder = (last: boolean) => ({
    borderBottomWidth: last ? 0 : 1,
    borderBottomColor: palette.surfaceContainerHigh,
  });

  if (error || (!data && !isLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <BackHeader title={t("gatepass.detailTitle", { defaultValue: "Gate pass" })} onBack={() => router.back()} />
        <EmptyState
          icon={<AppIcon name="alert-circle-outline" size="xl" color="onSurfaceVariant" />}
          title={t("common.failedToLoad", { defaultValue: "Failed to load" })}
          description={t("gatepass.notFound", { defaultValue: "This gate pass could not be loaded." })}
        />
      </View>
    );
  }

  const gp = data?.gatepass;
  const audit = data?.audit_trail ?? [];

  const run = (fn: () => Promise<unknown>, confirmMsg: string, destructive = false) => {
    Alert.alert(
      t("gatepass.confirmTitle", { defaultValue: "Confirm" }),
      confirmMsg,
      [
        { text: t("common.cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("common.confirm", { defaultValue: "Confirm" }),
          style: destructive ? "destructive" : "default",
          onPress: async () => {
            try {
              setBusy(true);
              await fn();
            } catch (e) {
              Alert.alert(
                t("common.actionFailed", { defaultValue: "Action failed" }),
                e instanceof Error ? e.message : t("common.tryAgain", { defaultValue: "Try again" })
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const canApprove = hasPermission(PERM_GP_APPROVE);
  const canGate = hasPermission(PERM_GP_GATEKEEPER);
  const meta = gp ? gatepassStatusMeta(gp.status) : null;

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <BackHeader
        title={gp?.student_name ?? t("gatepass.detailTitle", { defaultValue: "Gate pass" })}
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.lg, paddingBottom: spacing.xl * 2 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !data ? (
          <>
            <Skeleton width="100%" height={120} radius={radius.xl} />
            <Skeleton width="100%" height={160} radius={radius.xl} />
          </>
        ) : gp && meta ? (
          <>
            {/* Status + type */}
            <View style={cardStyle}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text variant="labelSm" color="onSurfaceVariant">
                    {t(gatepassTypeMeta(gp.type).key, { defaultValue: gatepassTypeMeta(gp.type).fallback })}
                  </Text>
                  <Text variant="headlineLg" color={meta.tone}>
                    {t(meta.key, { defaultValue: meta.fallback })}
                  </Text>
                </View>
                <AppIcon name="exit-outline" size="xl" color={meta.tone} />
              </View>
              {gp.admission_number ? (
                <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
                  #{gp.admission_number}
                </Text>
              ) : null}
            </View>

            {/* Actions */}
            {gp.status === "pending" && canApprove ? (
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <ActionButton
                  label={t("gatepass.reject", { defaultValue: "Reject" })}
                  icon="close"
                  tone="error"
                  disabled={busy}
                  onPress={() =>
                    run(
                      () => reject.mutateAsync({ id: gp.id }),
                      t("gatepass.confirmReject", { defaultValue: "Reject this gate pass?" }),
                      true
                    )
                  }
                />
                <ActionButton
                  label={t("gatepass.approve", { defaultValue: "Approve" })}
                  icon="checkmark"
                  tone="primary"
                  disabled={busy}
                  onPress={() =>
                    run(
                      () => approve.mutateAsync(gp.id),
                      t("gatepass.confirmApprove", { defaultValue: "Approve this gate pass?" })
                    )
                  }
                />
              </View>
            ) : null}
            {gp.status === "approved" && canGate ? (
              <ActionButton
                label={t("gatepass.checkout", { defaultValue: "Check out at gate" })}
                icon="walk-outline"
                tone="primary"
                disabled={busy}
                onPress={() =>
                  run(
                    () => checkout.mutateAsync(gp.id),
                    t("gatepass.confirmCheckout", { defaultValue: "Mark this student as checked out?" })
                  )
                }
              />
            ) : null}
            {(gp.status === "active" || gp.status === "overdue") && canGate ? (
              <ActionButton
                label={t("gatepass.checkin", { defaultValue: "Check in at gate" })}
                icon="enter-outline"
                tone="primary"
                disabled={busy}
                onPress={() =>
                  run(
                    () => checkin.mutateAsync(gp.id),
                    t("gatepass.confirmCheckin", { defaultValue: "Mark this student as returned?" })
                  )
                }
              />
            ) : null}

            {/* Details */}
            <View style={cardStyle}>
              <DetailRow icon="time-outline" label={t("gatepass.departure", { defaultValue: "Departure" })} value={formatDateTime(gp.departure_datetime)} />
              <DetailRow icon="time-outline" label={t("gatepass.expectedReturn", { defaultValue: "Return by" })} value={formatDateTime(gp.expected_return_datetime)} />
              {gp.actual_out_at ? (
                <DetailRow icon="walk-outline" label={t("gatepass.actualOut", { defaultValue: "Left at" })} value={formatDateTime(gp.actual_out_at)} />
              ) : null}
              {gp.actual_in_at ? (
                <DetailRow icon="enter-outline" label={t("gatepass.actualIn", { defaultValue: "Returned" })} value={formatDateTime(gp.actual_in_at)} />
              ) : null}
              <DetailRow icon="chatbubble-outline" label={t("gatepass.reason", { defaultValue: "Reason" })} value={gp.reason} last={!gp.parent_phone} />
              {gp.parent_phone ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm }}>
                  <AppIcon name="call-outline" size="md" color="onSurfaceVariant" />
                  <Text variant="bodySm" color="onSurfaceVariant" style={{ width: 96 }}>
                    {t("gatepass.parentPhone", { defaultValue: "Parent" })}
                  </Text>
                  <Text variant="bodyMd" color="onSurface" style={{ flex: 1 }}>
                    {gp.parent_phone}
                  </Text>
                  <PressScale
                    onPress={() => callPhone(gp.parent_phone)}
                    style={{ padding: spacing.xs, backgroundColor: palette.primaryContainer, borderRadius: radius.full }}
                  >
                    <AppIcon name="call" size="sm" color="onPrimaryContainer" />
                  </PressScale>
                </View>
              ) : null}
            </View>

            {/* Audit trail */}
            {audit.length > 0 ? (
              <View style={cardStyle}>
                <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
                  {t("gatepass.history", { defaultValue: "History" })}
                </Text>
                {audit.map((a, idx) => (
                  <View key={a.id} style={{ paddingVertical: spacing.sm, ...rowBorder(idx === audit.length - 1) }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text variant="labelMd" color="onSurface">{a.action}</Text>
                      <Text variant="labelSm" color="onSurfaceVariant">{formatDateTime(a.created_at)}</Text>
                    </View>
                    <Text variant="labelSm" color="onSurfaceVariant">
                      {a.actor_type}
                      {a.notes ? ` · ${a.notes}` : ""}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  last,
}: {
  icon: IconName;
  label: string;
  value?: string | null;
  last?: boolean;
}) {
  const { palette, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: palette.surfaceContainerHigh,
      }}
    >
      <AppIcon name={icon} size="md" color="onSurfaceVariant" />
      <Text variant="bodySm" color="onSurfaceVariant" style={{ width: 96 }}>
        {label}
      </Text>
      <Text variant="bodyMd" color="onSurface" style={{ flex: 1 }} numberOfLines={2}>
        {value || "—"}
      </Text>
    </View>
  );
}
