import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { useTheme, Typography } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { DashboardKpiCard } from "@/modules/home/components/DashboardKpiCard";
import { useTeacherLeaves } from "../hooks/useTeacherLeaves";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { TeacherLeave, LeavePolicy } from "@/modules/teachers/types";
import { LeaveRequestRow } from "../components/LeaveRequestRow";
import { LeaveBalanceModal } from "../components/LeaveBalanceModal";
import { LeavePolicyModal } from "../components/LeavePolicyModal";

export default function TeacherLeavesScreen() {
  const { t } = useTranslation("teacherLeaves");
  const { palette, spacing, radius, elevation } = useTheme();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMS.TEACHER_LEAVE_MANAGE);

  const STATUS_FILTERS = useMemo(
    () => [
      { label: t("filters.all"), value: "" },
      { label: t("filters.pending"), value: "pending" },
      { label: t("filters.approved"), value: "approved" },
      { label: t("filters.rejected"), value: "rejected" },
      { label: t("filters.cancelled"), value: "cancelled" },
    ],
    [t]
  );

  const leaveTypeLabel = useCallback(
    (type: string) => t(`leaveTypes.${type}`, { defaultValue: type }),
    [t]
  );

  const {
    leaves,
    loading,
    error,
    fetchLeaves,
    approveLeave,
    rejectLeave,
    balances,
    balancesLoading,
    fetchTeacherBalances,
    adjustBalance,
    policies,
    policiesLoading,
    fetchPolicies,
    updatePolicy,
  } = useTeacherLeaves();

  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Balance modal state
  const [balanceModalTeacherId, setBalanceModalTeacherId] = useState<string | null>(null);
  const [balanceModalTeacherName, setBalanceModalTeacherName] = useState("");

  // Policy modal state
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicies, setEditingPolicies] = useState<
    Record<string, Partial<LeavePolicy>>
  >({});

  const load = useCallback(
    (filter?: string) => fetchLeaves(filter ? { status: filter } : undefined),
    [fetchLeaves]
  );

  useEffect(() => {
    load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredLeaves = searchQuery.trim()
    ? leaves.filter(
        (l) =>
          l.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.teacher_employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leaves;

  // Stats (counts shown above the list)
  const stats = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    return {
      pending: leaves.filter((l) => l.status === "pending").length,
      approvedMonth: leaves.filter(
        (l) => l.status === "approved" && (l.created_at ?? "").startsWith(thisMonth)
      ).length,
    };
  }, [leaves]);

  // ── Leave actions ──
  const handleApprove = (leave: TeacherLeave) => {
    const days =
      leave.working_days != null
        ? t("alerts.approveWorkingDays", { count: leave.working_days })
        : "";
    Alert.alert(
      t("alerts.approveTitle"),
      t("alerts.approveMessage", {
        name: leave.teacher_name ?? t("alerts.fallbackTeacher"),
        leaveType: leaveTypeLabel(leave.leave_type),
        days,
      }),
      [
        { text: t("alerts.cancel"), style: "cancel" },
        {
          text: t("alerts.approve"),
          onPress: async () => {
            try {
              await approveLeave(leave.id);
            } catch (e: unknown) {
              Alert.alert(t("alerts.errorTitle"), e instanceof Error ? e.message : t("alerts.approveFailed"));
            }
          },
        },
      ]
    );
  };

  const handleReject = (leave: TeacherLeave) => {
    Alert.alert(
      t("alerts.rejectTitle"),
      t("alerts.rejectMessage", {
        name: leave.teacher_name ?? t("alerts.fallbackTeacher"),
      }),
      [
        { text: t("alerts.cancel"), style: "cancel" },
        {
          text: t("alerts.reject"),
          style: "destructive",
          onPress: async () => {
            try {
              await rejectLeave(leave.id);
            } catch (e: unknown) {
              Alert.alert(t("alerts.errorTitle"), e instanceof Error ? e.message : t("alerts.rejectFailed"));
            }
          },
        },
      ]
    );
  };

  // ── Balance modal ──
  const openBalanceModal = async (leave: TeacherLeave) => {
    setBalanceModalTeacherId(leave.teacher_id);
    setBalanceModalTeacherName(leave.teacher_name ?? t("screen.fallbackTeacherName"));
    await fetchTeacherBalances(leave.teacher_id);
  };

  const closeBalanceModal = () => {
    setBalanceModalTeacherId(null);
    setBalanceModalTeacherName("");
  };

  const handleAdjustBalance = async (leaveType: string, days: number, notes: string) => {
    if (!balanceModalTeacherId) return;
    await adjustBalance(balanceModalTeacherId, leaveType, {
      allocated_days: days,
      notes,
    });
    Alert.alert(
      t("alerts.updatedTitle"),
      t("alerts.balanceUpdated", { type: leaveTypeLabel(leaveType), days })
    );
  };

  // ── Policy modal ──
  const openPolicyModal = async () => {
    setShowPolicyModal(true);
    await fetchPolicies();
  };

  const handlePolicyFieldChange = (
    leaveType: string,
    field: string,
    value: boolean | number
  ) => {
    setEditingPolicies((prev) => ({
      ...prev,
      [leaveType]: { ...(prev[leaveType] ?? {}), [field]: value },
    }));
  };

  const handleSavePolicy = async (leaveType: string) => {
    const edits = editingPolicies[leaveType];
    if (!edits || Object.keys(edits).length === 0) return;
    await updatePolicy(leaveType, edits);
    setEditingPolicies((prev) => {
      const next = { ...prev };
      delete next[leaveType];
      return next;
    });
    Alert.alert(
      t("alerts.savedTitle"),
      t("alerts.policySaved", { type: leaveTypeLabel(leaveType) })
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: spacing.lg },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
      gap: spacing.md,
    },
    emptyContainer: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
      gap: spacing.md,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.marginMobile,
      gap: spacing.sm,
    },
    policyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.DEFAULT,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      backgroundColor: palette.surfaceContainerLow,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: spacing.marginMobile,
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: palette.surfaceContainerLowest,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      gap: spacing.sm,
    },
    searchInput: {
      flex: 1,
      paddingVertical: spacing.sm,
      color: palette.onSurface,
      ...Typography.bodyMd,
    },
    kpiRow: {
      flexDirection: "row",
      gap: spacing.md,
      paddingHorizontal: spacing.marginMobile,
      marginTop: spacing.md,
    },
    filterBarContent: {
      paddingHorizontal: spacing.marginMobile,
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      backgroundColor: palette.surfaceContainerLowest,
      minHeight: 44,
      justifyContent: "center",
    },
    filterChipActive: {
      borderColor: palette.primary,
      backgroundColor: palette.primaryContainer,
    },
    listCard: {
      flex: 1,
      marginHorizontal: spacing.marginMobile,
      marginBottom: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: palette.surfaceContainerLowest,
    },
    retryBtn: {
      backgroundColor: palette.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      borderRadius: radius.DEFAULT,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="display" color="onSurface" style={{ flex: 1 }}>
          {t("screen.title")}
        </Text>
        {canManage ? (
          <PressScale style={styles.policyBtn} onPress={openPolicyModal}>
            <AppIcon name="settings-outline" size="sm" color="primary" />
            <Text variant="labelMd" color="primary">
              {t("screen.policy")}
            </Text>
          </PressScale>
        ) : null}
        <AppIcon
          name="refresh-outline"
          size="lg"
          color="primary"
          onPress={() => load(statusFilter)}
          accessibilityLabel={t("screen.retry")}
        />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <AppIcon name="search-outline" size="md" color="onSurfaceVariant" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("screen.searchPlaceholder")}
          placeholderTextColor={palette.onSurfaceVariant}
        />
        {searchQuery.length > 0 ? (
          <AppIcon
            name="close-circle"
            size="md"
            color="onSurfaceVariant"
            onPress={() => setSearchQuery("")}
          />
        ) : null}
      </View>

      {/* KPI cards (Pending / Approved this month) */}
      <View style={styles.kpiRow}>
        <DashboardKpiCard
          label={t("filters.pending")}
          value={String(stats.pending)}
          accentColor="warning"
          iconName="time-outline"
          iconChipBg="surfaceContainerHigh"
          iconChipFg="warning"
        />
        <DashboardKpiCard
          label={t("filters.approved")}
          value={String(stats.approvedMonth)}
          accentColor="success"
          iconName="checkmark-circle-outline"
          iconChipBg="surfaceContainerHigh"
          iconChipFg="success"
        />
      </View>

      {/* Status filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.filterBarContent}
      >
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          return (
            <PressScale
              key={f.value}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(f.value)}
            >
              <Text variant="labelMd" color={active ? "onPrimaryContainer" : "onSurfaceVariant"}>
                {f.label}
              </Text>
            </PressScale>
          );
        })}
      </ScrollView>

      {/* Content */}
      {error ? (
        <View style={styles.center}>
          <AppIcon name="alert-circle-outline" size="hero" color="error" />
          <Text variant="bodyMd" color="error" style={{ textAlign: "center" }}>
            {error}
          </Text>
          <PressScale style={styles.retryBtn} onPress={() => load(statusFilter)}>
            <Text variant="labelMd" color="onPrimary">
              {t("screen.retry")}
            </Text>
          </PressScale>
        </View>
      ) : (
        <View style={[styles.listCard, elevation.card]}>
          {!loading ? (
            <Text variant="labelMd" color="onSurfaceVariant" style={{ paddingHorizontal: spacing.xs, paddingBottom: spacing.sm }}>
              {t("screen.countLine", {
                count: filteredLeaves.length,
                unit:
                  filteredLeaves.length === 1
                    ? t("screen.request")
                    : t("screen.requests"),
                suffix: searchQuery ? t("screen.matchingSearchSuffix") : "",
              })}
            </Text>
          ) : null}
          <FlatList
            data={filteredLeaves}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <LeaveRequestRow
                leave={item}
                canManage={canManage}
                onApprove={handleApprove}
                onReject={handleReject}
                onOpenBalance={openBalanceModal}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              filteredLeaves.length === 0 ? styles.emptyContainer : { paddingBottom: spacing.lg }
            }
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => load(statusFilter)}
                colors={[palette.primary]}
                tintColor={palette.primary}
              />
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.center}>
                  <AppIcon name="document-text-outline" size="hero" color="outlineVariant" />
                  <Text variant="bodyMd" color="onSurfaceVariant" style={{ textAlign: "center" }}>
                    {searchQuery ? t("screen.emptySearch") : t("screen.emptyNone")}
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      )}

      {/* Teacher Balance Modal */}
      {balanceModalTeacherId ? (
        <LeaveBalanceModal
          visible={!!balanceModalTeacherId}
          teacherName={balanceModalTeacherName}
          balances={balances}
          balancesLoading={balancesLoading}
          onAdjust={handleAdjustBalance}
          onClose={closeBalanceModal}
        />
      ) : null}

      {/* Policy Modal */}
      <LeavePolicyModal
        visible={showPolicyModal}
        policies={policies}
        policiesLoading={policiesLoading}
        onUpdate={handlePolicyFieldChange}
        onSave={handleSavePolicy}
        onClose={() => setShowPolicyModal(false)}
        editingPolicies={editingPolicies}
      />
    </View>
  );
}
