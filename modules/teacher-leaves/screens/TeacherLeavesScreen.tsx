import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/common/theme";
import { useTeacherLeaves } from "../hooks/useTeacherLeaves";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { TeacherLeave, LeavePolicy } from "@/modules/teachers/types";
import { LeaveRequestRow } from "../components/LeaveRequestRow";
import { LeaveBalanceModal } from "../components/LeaveBalanceModal";
import { LeavePolicyModal } from "../components/LeavePolicyModal";

export default function TeacherLeavesScreen() {
  const { t } = useTranslation("teacherLeaves");
  const { palette, spacing, radius, typography, elevation } = useTheme();
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

  // -------------------------------------------------------------------------
  // Stats (counts shown above the list)
  // -------------------------------------------------------------------------
  const stats = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    return {
      pending: leaves.filter((l) => l.status === "pending").length,
      approvedMonth: leaves.filter(
        (l) => l.status === "approved" && (l.created_at ?? "").startsWith(thisMonth)
      ).length,
      rejectedMonth: leaves.filter(
        (l) => l.status === "rejected" && (l.created_at ?? "").startsWith(thisMonth)
      ).length,
    };
  }, [leaves]);

  // -------------------------------------------------------------------------
  // Leave actions
  // -------------------------------------------------------------------------

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
            } catch (e: any) {
              Alert.alert(
                t("alerts.errorTitle"),
                e.message || t("alerts.approveFailed")
              );
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
            } catch (e: any) {
              Alert.alert(
                t("alerts.errorTitle"),
                e.message || t("alerts.rejectFailed")
              );
            }
          },
        },
      ]
    );
  };

  // -------------------------------------------------------------------------
  // Balance modal
  // -------------------------------------------------------------------------

  const openBalanceModal = async (leave: TeacherLeave) => {
    setBalanceModalTeacherId(leave.teacher_id);
    setBalanceModalTeacherName(leave.teacher_name ?? t("screen.fallbackTeacherName"));
    await fetchTeacherBalances(leave.teacher_id);
  };

  const closeBalanceModal = () => {
    setBalanceModalTeacherId(null);
    setBalanceModalTeacherName("");
  };

  const handleAdjustBalance = async (
    leaveType: string,
    days: number,
    notes: string
  ) => {
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

  // -------------------------------------------------------------------------
  // Policy modal
  // -------------------------------------------------------------------------

  const openPolicyModal = async () => {
    setShowPolicyModal(true);
    await fetchPolicies();
  };

  const handlePolicyFieldChange = (
    leaveType: string,
    field: string,
    value: any
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

  // -------------------------------------------------------------------------
  // Styles
  // -------------------------------------------------------------------------
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.surfaceContainerLow },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
    },
    emptyContainer: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerTitle: { ...typography.display, flex: 1, color: palette.onSurface },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    policyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.primary + "40",
      backgroundColor: palette.primaryContainer + "20",
    },
    policyBtnText: {
      ...typography.labelMd,
      color: palette.primary,
      fontWeight: "600",
    },
    refreshBtn: { padding: spacing.sm },

    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: palette.surfaceContainerLowest,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    searchIcon: { marginRight: spacing.sm },
    searchInput: {
      flex: 1,
      paddingVertical: spacing.sm,
      ...typography.bodyMd,
      color: palette.onSurface,
    },

    statsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    statChip: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: palette.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      alignItems: "center",
    },
    statChipValue: { ...typography.headlineMd, color: palette.onSurface },
    statChipLabel: {
      ...typography.labelSm,
      color: palette.onSurfaceVariant,
      marginTop: 2,
      textAlign: "center",
    },

    filterBar: { maxHeight: 48 },
    filterBarContent: {
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      gap: spacing.sm,
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      backgroundColor: palette.surfaceContainerLowest,
    },
    filterChipActive: {
      borderColor: palette.primary,
      backgroundColor: palette.primaryContainer + "30",
    },
    filterChipText: {
      ...typography.labelMd,
      color: palette.onSurfaceVariant,
      fontWeight: "500",
    },
    filterChipTextActive: { color: palette.primary, fontWeight: "600" },

    listCard: {
      flex: 1,
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: palette.surfaceContainerLowest,
      ...elevation.card,
    },
    countText: {
      ...typography.labelMd,
      color: palette.onSurfaceVariant,
      paddingHorizontal: 4,
      paddingBottom: spacing.sm,
    },

    errorText: {
      ...typography.bodyMd,
      color: palette.error,
      textAlign: "center",
      marginTop: spacing.md,
    },
    retryBtn: {
      marginTop: spacing.lg,
      backgroundColor: palette.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    retryBtnText: { ...typography.labelMd, color: palette.onPrimary, fontWeight: "600" },
    emptyText: {
      ...typography.bodyMd,
      color: palette.onSurfaceVariant,
      marginTop: spacing.md,
      textAlign: "center",
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("screen.title")}</Text>
        <View style={styles.headerActions}>
          {canManage && (
            <TouchableOpacity style={styles.policyBtn} onPress={openPolicyModal}>
              <Ionicons name="settings-outline" size={18} color={palette.primary} />
              <Text style={styles.policyBtnText}>{t("screen.policy")}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => load(statusFilter)}
          >
            <Ionicons name="refresh-outline" size={22} color={palette.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={palette.onSurfaceVariant}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("screen.searchPlaceholder")}
          placeholderTextColor={palette.onSurfaceVariant}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={18}
              color={palette.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={[styles.statChipValue, { color: palette.warning }]}>
            {stats.pending}
          </Text>
          <Text style={styles.statChipLabel}>{t("filters.pending")}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={[styles.statChipValue, { color: palette.success }]}>
            {stats.approvedMonth}
          </Text>
          <Text style={styles.statChipLabel}>{t("filters.approved")}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={[styles.statChipValue, { color: palette.error }]}>
            {stats.rejectedMonth}
          </Text>
          <Text style={styles.statChipLabel}>{t("filters.rejected")}</Text>
        </View>
      </View>

      {/* Status filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              statusFilter === f.value && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(f.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === f.value && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={palette.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => load(statusFilter)}
          >
            <Text style={styles.retryBtnText}>{t("screen.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listCard}>
          {!loading && (
            <Text style={styles.countText}>
              {t("screen.countLine", {
                count: filteredLeaves.length,
                unit:
                  filteredLeaves.length === 1
                    ? t("screen.request")
                    : t("screen.requests"),
                suffix: searchQuery ? t("screen.matchingSearchSuffix") : "",
              })}
            </Text>
          )}
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
            contentContainerStyle={
              filteredLeaves.length === 0 ? styles.emptyContainer : undefined
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
                  <Ionicons
                    name="document-text-outline"
                    size={56}
                    color={palette.outlineVariant}
                  />
                  <Text style={styles.emptyText}>
                    {searchQuery ? t("screen.emptySearch") : t("screen.emptyNone")}
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      )}

      {/* Teacher Balance Modal */}
      {balanceModalTeacherId && (
        <LeaveBalanceModal
          visible={!!balanceModalTeacherId}
          teacherName={balanceModalTeacherName}
          balances={balances}
          balancesLoading={balancesLoading}
          onAdjust={handleAdjustBalance}
          onClose={closeBalanceModal}
        />
      )}

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
    </SafeAreaView>
  );
}
