import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useTheme, type Palette } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { DetailTabs } from "@/common/components/DetailTabs";
import { useTeacherLeaves } from "@/modules/teacher-leaves/hooks/useTeacherLeaves";
import { TeacherLeave, LeaveBalance, LEAVE_TYPES } from "@/modules/teachers/types";
import { holidayService } from "@/modules/holidays/services/holidayService";
import { Holiday } from "@/modules/holidays/types";
import { useHolidays } from "@/modules/holidays/hooks/useHolidays";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { DateField } from "@/common/components/DateField";
import { calendarLocaleForLanguage } from "@/i18n";
import { statusAccentToken } from "../utils/leaveColors";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type AvailColor = "success" | "warning" | "error";

function availColorToken(b: { is_unlimited: boolean; available_days: number }): AvailColor {
  if (b.is_unlimited) return "success";
  if (b.available_days <= 0) return "error";
  if (b.available_days <= 2) return "warning";
  return "success";
}

function fmtDate(iso: string, locale = "en-IN") {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateShort(iso: string, locale = "en-IN") {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short" });
}

// Deterministic palette accent for holiday avatars (token-pure, no hex).
const HOLIDAY_ACCENTS: (keyof Palette)[] = [
  "primary",
  "secondary",
  "tertiary",
  "success",
  "warning",
  "primaryContainer",
  "secondaryContainer",
  "tertiaryContainer",
];
function holidayAccent(name: string): keyof Palette {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return HOLIDAY_ACCENTS[h % HOLIDAY_ACCENTS.length];
}
function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ---------------------------------------------------------------------------
// Sub-tab data
// ---------------------------------------------------------------------------
const DATA_TABS = ["summary", "balance", "requests"] as const;
type DataTab = (typeof DATA_TABS)[number];

const STATUS_FILTER_VALUES = ["", "pending", "approved", "rejected", "cancelled"] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Balance Summary Card  (compact, horizontal)
// ---------------------------------------------------------------------------
function BalanceCard({ balance, onPress }: { balance: LeaveBalance; onPress: () => void }) {
  const { t } = useTranslation("teacherLeaves");
  const { palette, spacing, radius } = useTheme();
  const avail = balance.is_unlimited ? "∞" : balance.available_days.toFixed(1);
  const availColor = availColorToken(balance);
  const typeLabel = t(`leaveTypes.${balance.leave_type}`);

  return (
    <PressScale
      onPress={onPress}
      style={{
        width: 108,
        marginRight: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: palette.surfaceContainerLow,
        borderWidth: 1,
        borderColor: palette.outlineVariant,
        alignItems: "center",
        gap: spacing.xs,
      }}
    >
      <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1}>
        {typeLabel}
      </Text>
      <Text variant="headlineLg" color={availColor}>
        {avail}
      </Text>
      <Text variant="labelSm" color="onSurfaceVariant">
        {t("tracker.balanceCard.available")}
      </Text>
      {!balance.is_unlimited && (
        <Text variant="labelSm" color="warning">
          {t("tracker.balanceCard.bookedWithValue", { value: balance.pending_days.toFixed(1) })}
        </Text>
      )}
    </PressScale>
  );
}

// ---------------------------------------------------------------------------
// Balance Detail Row  (Balance tab)
// ---------------------------------------------------------------------------
function BalanceDetailRow({ b }: { b: LeaveBalance }) {
  const { t } = useTranslation("teacherLeaves");
  const { palette, spacing } = useTheme();
  const avail = b.is_unlimited ? "∞" : b.available_days.toFixed(1);
  const availColor = availColorToken(b);
  const typeLabel = t(`leaveTypes.${b.leave_type}`);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.marginMobile,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.outlineVariant,
        gap: spacing.md,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="labelLg" color="onSurface">
          {t("tracker.balanceDetail.leaveSuffix", { type: typeLabel })}
        </Text>
        {b.is_unlimited ? (
          <Text variant="bodySm" color="success">
            {t("tracker.balanceDetail.unlimited")}
          </Text>
        ) : (
          <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: 2 }}>
            {t("tracker.balanceDetail.allocatedLine", {
              total: b.allocated_days + b.carried_forward_days,
              year: b.academic_year,
            })}
          </Text>
        )}
        {b.carried_forward_days > 0 && (
          <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: 2, fontStyle: "italic" }}>
            {t("tracker.balanceDetail.carriedForward", { days: b.carried_forward_days })}
          </Text>
        )}
      </View>
      {!b.is_unlimited && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <View style={{ alignItems: "center", width: 54 }}>
            <Text variant="titleSm" color={availColor}>
              {avail}
            </Text>
            <Text variant="labelSm" color="onSurfaceVariant">
              {t("tracker.balanceDetail.available")}
            </Text>
          </View>
          <View style={{ width: 1, height: 28, backgroundColor: palette.outlineVariant }} />
          <View style={{ alignItems: "center", width: 54 }}>
            <Text variant="titleSm" color="warning">
              {b.pending_days.toFixed(1)}
            </Text>
            <Text variant="labelSm" color="onSurfaceVariant">
              {t("tracker.balanceDetail.pending")}
            </Text>
          </View>
          <View style={{ width: 1, height: 28, backgroundColor: palette.outlineVariant }} />
          <View style={{ alignItems: "center", width: 54 }}>
            <Text variant="titleSm" color="error">
              {b.used_days.toFixed(1)}
            </Text>
            <Text variant="labelSm" color="onSurfaceVariant">
              {t("tracker.balanceDetail.used")}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Leave Request Row
// ---------------------------------------------------------------------------
function LeaveRow({ item, onCancel }: { item: TeacherLeave; onCancel?: () => void }) {
  const { t, i18n } = useTranslation("teacherLeaves");
  const { palette, spacing } = useTheme();
  const dateLoc = calendarLocaleForLanguage(i18n.language ?? "en");
  const days = item.working_days ?? 1;
  const sameDay = item.start_date === item.end_date;
  const dateStr = sameDay
    ? fmtDate(item.start_date, dateLoc)
    : `${fmtDateShort(item.start_date, dateLoc)} – ${fmtDateShort(item.end_date, dateLoc)}`;
  const typeLabel = t(`leaveTypes.${item.leave_type}`);
  const statusAccent = statusAccentToken(item.status);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.marginMobile,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.outlineVariant,
        gap: spacing.sm,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text variant="labelLg" color="onSurface">
            {t("tracker.leaveRow.leaveSuffix", { type: typeLabel })}
          </Text>
          <Text variant="labelSm" color="onSurfaceVariant">
            {days} {days === 1 ? t("tracker.leaveRow.day") : t("tracker.leaveRow.days")}
          </Text>
        </View>
        <Text variant="labelSm" color="onSurfaceVariant">
          {dateStr}
        </Text>
        <Text variant="labelSm" color={statusAccent}>
          {t(`status.${item.status}`)}
        </Text>
      </View>
      {item.status === "pending" && onCancel && (
        <AppIcon
          name="close-circle-outline"
          size="lg"
          color="onSurfaceVariant"
          onPress={onCancel}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Holiday Row
// ---------------------------------------------------------------------------
function HolidayRow({ h }: { h: Holiday }) {
  const { t, i18n } = useTranslation("teacherLeaves");
  const { palette, spacing, radius } = useTheme();
  const dateLoc = calendarLocaleForLanguage(i18n.language ?? "en");
  const accent = holidayAccent(h.name);
  const abbr = initials(h.name);
  const dateLabel = h.is_recurring
    ? (h.recurring_day_name ?? t("tracker.holidayRow.weeklyOff"))
    : h.is_single_day
    ? fmtDate(h.start_date!, dateLoc)
    : `${fmtDate(h.start_date!, dateLoc)} – ${fmtDate(h.end_date!, dateLoc)}`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        marginHorizontal: spacing.marginMobile,
        marginBottom: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: palette.surfaceContainerLowest,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.outlineVariant,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: palette[accent],
        }}
      >
        <Text variant="labelSm" color="onPrimary">
          {abbr}
        </Text>
      </View>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text variant="labelLg" color="onSurface" numberOfLines={2}>
          {h.name}
        </Text>
        <Text variant="bodySm" color="onSurfaceVariant">
          {dateLabel}
        </Text>
        <View
          style={{
            alignSelf: "flex-start",
            marginTop: spacing.xs,
            paddingHorizontal: spacing.sm,
            paddingVertical: 3,
            borderRadius: radius.DEFAULT,
            backgroundColor: palette.surfaceContainerLow,
          }}
        >
          <Text variant="labelSm" color="onSurfaceVariant">
            {t(`holidayForm.types.${h.holiday_type}`)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Apply Leave Modal
// ---------------------------------------------------------------------------
interface ApplyModalProps {
  visible: boolean;
  balances: LeaveBalance[];
  onClose: () => void;
  onSubmit: (dto: {
    start_date: string;
    end_date: string;
    leave_type: string;
    reason?: string;
  }) => Promise<void>;
}

function ApplyModal({ visible, balances, onClose, onSubmit }: ApplyModalProps) {
  const { t } = useTranslation("teacherLeaves");
  const { palette, spacing, radius, typography } = useTheme();
  const { bodyMd: bodyMdType } = typography;
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveType, setLeaveType] = useState("casual");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [holidayWarn, setHolidayWarn] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [balErr, setBalErr] = useState<string | null>(null);
  const [estDays, setEstDays] = useState<number | null>(null);

  const getBal = (lt: string) => balances.find((b) => b.leave_type === lt);

  const checkBal = useCallback(
    (lt: string, days: number | null) => {
      const bal = balances.find((b) => b.leave_type === lt);
      if (!bal || bal.is_unlimited || days === null) {
        setBalErr(null);
        return;
      }
      if (!bal.allow_negative && bal.available_days < days) {
        setBalErr(
          t("tracker.applyModal.balErr", {
            available: bal.available_days.toFixed(1),
            needed: typeof days === "number" ? days.toFixed(1) : String(days),
          })
        );
      } else {
        setBalErr(null);
      }
    },
    [balances, t]
  );

  const checkHols = useCallback(
    async (start: string, end: string) => {
      if (!DATE_RE.test(start) || !DATE_RE.test(end) || end < start) {
        setHolidayWarn(null);
        setEstDays(null);
        return;
      }
      setChecking(true);
      try {
        const sd = new Date(start),
          ed = new Date(end);
        const [nonRec, rec] = await Promise.all([
          holidayService.getHolidays({ start_date: start, end_date: end, include_recurring: false }),
          holidayService.getRecurring(),
        ]);
        const seen = new Set<number>();
        const recHits: Holiday[] = [];
        const cur = new Date(sd);
        while (cur <= ed) {
          const dw = (cur.getDay() + 6) % 7;
          const m = rec.find((r) => r.recurring_day_of_week === dw);
          if (m && !seen.has(dw)) {
            seen.add(dw);
            recHits.push(m);
          }
          cur.setDate(cur.getDate() + 1);
        }
        const total = Math.round((ed.getTime() - sd.getTime()) / 86400000) + 1;
        const hDates = new Set<string>();
        let hCount = 0;
        for (const h of nonRec) {
          if (!h.start_date) continue;
          const hs = new Date(Math.max(new Date(h.start_date).getTime(), sd.getTime()));
          const he = new Date(Math.min(new Date(h.end_date || h.start_date).getTime(), ed.getTime()));
          const c = new Date(hs);
          while (c <= he) {
            const ds = c.toISOString().split("T")[0];
            if (!hDates.has(ds)) {
              hDates.add(ds);
              hCount++;
            }
            c.setDate(c.getDate() + 1);
          }
        }
        for (const r of recHits) {
          const rc = new Date(sd);
          while (rc <= ed) {
            const dw = (rc.getDay() + 6) % 7;
            const ds = rc.toISOString().split("T")[0];
            if (dw === r.recurring_day_of_week && !hDates.has(ds)) {
              hDates.add(ds);
              hCount++;
            }
            rc.setDate(rc.getDate() + 1);
          }
        }
        const working = total - hCount;
        setEstDays(working);
        checkBal(leaveType, working);
        if ([...nonRec, ...recHits].length === 0) {
          setHolidayWarn(null);
          return;
        }
        if (working === 0) setHolidayWarn(t("tracker.applyModal.holidayWarnAll"));
        else setHolidayWarn(t("tracker.applyModal.holidayWarnPartial", { excluded: hCount, working }));
      } catch {
        setHolidayWarn(null);
      } finally {
        setChecking(false);
      }
    },
    [leaveType, checkBal, t]
  );

  const reset = () => {
    setLeaveStart("");
    setLeaveEnd("");
    setLeaveType("casual");
    setReason("");
    setHolidayWarn(null);
    setBalErr(null);
    setEstDays(null);
  };

  const onStart = (v: string) => {
    setLeaveStart(v);
    if (leaveEnd) checkHols(v, leaveEnd);
  };
  const onEnd = (v: string) => {
    setLeaveEnd(v);
    if (leaveStart) checkHols(leaveStart, v);
  };
  const onType = (lt: string) => {
    setLeaveType(lt);
    checkBal(lt, estDays);
  };

  const selBal = getBal(leaveType);
  const blocked = submitting || checking || !!balErr;

  const handleSubmit = async () => {
    if (!leaveStart || !leaveEnd) {
      Alert.alert(t("tracker.applyModal.alertRequiredTitle"), t("tracker.applyModal.alertRequiredBody"));
      return;
    }
    if (!DATE_RE.test(leaveStart) || !DATE_RE.test(leaveEnd)) {
      Alert.alert(t("tracker.applyModal.alertFormatTitle"), t("tracker.applyModal.alertFormatBody"));
      return;
    }
    if (leaveEnd < leaveStart) {
      Alert.alert(t("tracker.applyModal.alertInvalidTitle"), t("tracker.applyModal.alertInvalidBody"));
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ start_date: leaveStart, end_date: leaveEnd, leave_type: leaveType, reason });
      reset();
      onClose();
    } catch (e: unknown) {
      Alert.alert(
        t("tracker.applyModal.alertErrorTitle"),
        e instanceof Error ? e.message : t("tracker.applyModal.alertErrorSubmit")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const am = StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.surface },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.marginMobile,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: palette.outlineVariant,
    },
    body: { padding: spacing.marginMobile, paddingBottom: spacing.xl },
    typeChip: {
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      backgroundColor: palette.surfaceContainerLow,
      marginRight: spacing.sm,
      minWidth: 72,
      gap: 3,
    },
    typeChipActive: { borderColor: palette.primary, backgroundColor: palette.primaryContainer },
    typeChipLow: { borderColor: palette.error },
    balBanner: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.sm,
      borderRadius: radius.DEFAULT,
      borderWidth: 1,
      marginBottom: spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      borderRadius: radius.DEFAULT,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...bodyMdType,
      color: palette.onSurface,
      backgroundColor: palette.surfaceContainerLow,
    },
    dateRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.xs },
    arrow: { paddingBottom: 11 },
    infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm },
    warnBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
      marginTop: spacing.sm,
      padding: spacing.sm,
      backgroundColor: palette.surfaceContainerLow,
      borderRadius: radius.DEFAULT,
      borderWidth: 1,
      borderColor: palette.warning,
    },
    errBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
      marginTop: spacing.sm,
      padding: spacing.sm,
      backgroundColor: palette.errorContainer,
      borderRadius: radius.DEFAULT,
      borderWidth: 1,
      borderColor: palette.error,
    },
    submitBtn: {
      backgroundColor: palette.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: "center",
      marginTop: spacing.xl,
    },
    label: { marginBottom: spacing.sm, marginTop: spacing.md },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onDismiss={reset}>
      <SafeAreaView style={am.container}>
        <View style={am.header}>
          <AppIcon name="close" size="lg" color="onSurface" onPress={() => { reset(); onClose(); }} />
          <Text variant="headlineMd" color="onSurface">
            {t("tracker.applyModal.title")}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={am.body} showsVerticalScrollIndicator={false}>
          {/* Leave Type */}
          <Text variant="overline" color="onSurfaceVariant" style={am.label}>
            {t("tracker.applyModal.leaveType")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            {LEAVE_TYPES.map((lt) => {
              const bal = getBal(lt);
              const active = leaveType === lt;
              const avail = bal ? (bal.is_unlimited ? "∞" : `${bal.available_days.toFixed(1)}d`) : null;
              const low = bal && !bal.is_unlimited && bal.available_days <= 0;
              const balColor: AvailColor = bal ? availColorToken(bal) : "success";
              return (
                <PressScale
                  key={lt}
                  style={[am.typeChip, active && am.typeChipActive, low && am.typeChipLow]}
                  onPress={() => onType(lt)}
                >
                  <Text variant="bodySm" color={active ? "onPrimaryContainer" : "onSurface"}>
                    {t(`leaveTypes.${lt}`)}
                  </Text>
                  {avail ? (
                    <Text variant="labelSm" color={balColor}>
                      {avail}
                    </Text>
                  ) : null}
                </PressScale>
              );
            })}
          </ScrollView>

          {/* Balance banner */}
          {selBal && !selBal.is_unlimited && (
            <View
              style={[
                am.balBanner,
                {
                  backgroundColor: palette.surfaceContainerLow,
                  borderColor: palette[availColorToken(selBal)],
                },
              ]}
            >
              <Text variant="labelSm" color="onSurface">
                <Text variant="labelSm" color={availColorToken(selBal)}>
                  {selBal.available_days.toFixed(1)}
                </Text>
                {t("tracker.applyModal.availSuffix")}
                <Text variant="labelSm" color="warning">
                  {selBal.pending_days.toFixed(1)}
                </Text>
                {t("tracker.applyModal.pendSuffix")}
                <Text variant="labelSm" color="error">
                  {selBal.used_days.toFixed(1)}
                </Text>
                {t("tracker.applyModal.usedSuffix")}
              </Text>
            </View>
          )}

          {/* Dates */}
          <View style={am.dateRow}>
            <View style={{ flex: 1 }}>
              <DateField
                label={t("tracker.applyModal.startDate")}
                value={leaveStart}
                onChange={onStart}
                placeholder={t("tracker.applyModal.datePlaceholder")}
                useOverlayInsideModal
              />
            </View>
            <View style={am.arrow}>
              <AppIcon name="arrow-forward" size="sm" color="onSurfaceVariant" />
            </View>
            <View style={{ flex: 1 }}>
              <DateField
                label={t("tracker.applyModal.endDate")}
                value={leaveEnd}
                onChange={onEnd}
                placeholder={t("tracker.applyModal.datePlaceholder")}
                useOverlayInsideModal
              />
            </View>
          </View>

          {/* Warnings */}
          {checking && (
            <View style={am.infoRow}>
              <ActivityIndicator size="small" color={palette.onSurfaceVariant} />
              <Text variant="labelSm" color="onSurfaceVariant">
                {t("tracker.applyModal.checkingHolidays")}
              </Text>
            </View>
          )}
          {!checking && holidayWarn && (
            <View style={am.warnBox}>
              <AppIcon name="information-circle-outline" size="sm" color="warning" />
              <Text variant="labelSm" color="onSurface" style={{ flex: 1 }}>
                {holidayWarn}
              </Text>
            </View>
          )}
          {balErr && (
            <View style={am.errBox}>
              <AppIcon name="alert-circle-outline" size="sm" color="error" />
              <Text variant="labelSm" color="error" style={{ flex: 1 }}>
                {balErr}
              </Text>
            </View>
          )}

          {/* Reason */}
          <Text variant="overline" color="onSurfaceVariant" style={am.label}>
            {t("tracker.applyModal.reason")}{" "}
            {selBal?.requires_reason ? (
              <Text variant="overline" color="error">
                {t("tracker.applyModal.reasonRequiredStar")}
              </Text>
            ) : (
              t("tracker.applyModal.reasonOptional")
            )}
          </Text>
          <TextInput
            style={[am.input, { height: 80, textAlignVertical: "top", paddingTop: spacing.sm }]}
            value={reason}
            onChangeText={setReason}
            placeholder={t("tracker.applyModal.placeholderReason")}
            placeholderTextColor={palette.onSurfaceVariant}
            multiline
          />

          <PressScale style={[am.submitBtn, blocked && { opacity: 0.45 }]} onPress={handleSubmit} disabled={blocked}>
            {submitting ? (
              <ActivityIndicator color={palette.onPrimary} />
            ) : (
              <Text variant="labelLg" color="onPrimary">
                {balErr ? t("tracker.applyModal.submitInsufficient") : t("tracker.applyModal.submitRequest")}
              </Text>
            )}
          </PressScale>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function MyTeacherLeavesScreen() {
  const { t } = useTranslation("teacherLeaves");
  const { palette, spacing, radius, elevation } = useTheme();
  const { permissions: rawPerms } = usePermissions();
  // Use raw permissions (not hierarchical) — admins have system.manage which would otherwise
  // expand to grant teacher.leave.apply, wrongly showing them the leave-application flow.
  const canApplyLeave =
    rawPerms.includes(PERMS.TEACHER_LEAVE_APPLY) &&
    !rawPerms.includes(PERMS.SYSTEM_MANAGE) &&
    !rawPerms.includes(PERMS.USER_MANAGE) &&
    !rawPerms.includes(PERMS.TEACHER_LEAVE_MANAGE);

  const {
    leaves,
    loading,
    error,
    fetchMyLeaves,
    createLeave,
    cancelLeave,
    balances,
    balancesLoading,
    fetchMyBalances,
  } = useTeacherLeaves();

  const {
    holidays: hookHolidays,
    recurringHolidays: hookRecurring,
    loading: holLoading,
    fetchHolidays: hookFetchHolidays,
    fetchRecurring: hookFetchRecurring,
  } = useHolidays();

  // Top-level: My Data | Holidays — admins land directly on Holidays
  const [topTab, setTopTab] = useState<"mydata" | "holidays">(canApplyLeave ? "mydata" : "holidays");
  useEffect(() => {
    if (!canApplyLeave) setTopTab("holidays");
  }, [canApplyLeave]);

  // My Data sub-tab
  const [dataTab, setDataTab] = useState<DataTab>("summary");

  // Requests filter
  const [statusFilter, setStatusFilter] = useState("");

  // Holidays
  const [holYear, setHolYear] = useState(new Date().getFullYear());

  // Combine + filter weekly_off for display
  const holidays = [...hookHolidays, ...hookRecurring].filter((h) => h.holiday_type !== "weekly_off");

  // Modals
  const [showApply, setShowApply] = useState(false);
  const [selectedBal, setSelectedBal] = useState<LeaveBalance | null>(null);

  // ── Loaders ──
  const loadLeaves = useCallback(
    (f?: string) => fetchMyLeaves(f ? { status: f } : undefined),
    [fetchMyLeaves]
  );

  useEffect(() => {
    if (canApplyLeave) loadLeaves(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, canApplyLeave]);
  useEffect(() => {
    if (canApplyLeave) fetchMyBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canApplyLeave]);

  const loadHolidays = useCallback(
    (year: number) => {
      hookFetchHolidays({ start_date: `${year}-01-01`, end_date: `${year}-12-31` });
      hookFetchRecurring();
    },
    [hookFetchHolidays, hookFetchRecurring]
  );

  useEffect(() => {
    if (topTab === "holidays") loadHolidays(holYear);
  }, [topTab, holYear, loadHolidays]);

  const handleCancel = (leave: TeacherLeave) => {
    Alert.alert(t("tracker.alerts.cancelLeaveTitle"), t("tracker.alerts.cancelLeaveBody"), [
      { text: t("tracker.alerts.no"), style: "cancel" },
      {
        text: t("tracker.alerts.yesCancel"),
        style: "destructive",
        onPress: async () => {
          try {
            await cancelLeave(leave.id);
            await fetchMyBalances();
          } catch (e: unknown) {
            Alert.alert(t("tracker.alerts.error"), e instanceof Error ? e.message : t("tracker.alerts.cancelFailed"));
          }
        },
      },
    ]);
  };

  const handleSubmit = async (dto: {
    start_date: string;
    end_date: string;
    leave_type: string;
    reason?: string;
  }) => {
    const result = await createLeave(dto);
    await fetchMyBalances();
    const warn = (result as { warning?: string })?.warning;
    if (warn) setTimeout(() => Alert.alert(t("tracker.alerts.applied"), warn), 350);
  };

  const filtered = statusFilter ? leaves.filter((l) => l.status === statusFilter) : leaves;
  const pendingCount = leaves.filter((l) => l.status === "pending").length;
  const approvedCount = leaves.filter((l) => l.status === "approved").length;
  const rejectedCount = leaves.filter((l) => l.status === "rejected").length;
  const recentLeaves = leaves.slice(0, 10);

  const holYearLabel = t("tracker.yearRange", { year: holYear });

  const emptyRequestsMessage = statusFilter
    ? t("tracker.emptyRequestsWithFilter", { status: t(`filters.${statusFilter}`) })
    : t("tracker.emptyRequestsNoFilter");

  const s = StyleSheet.create({
    container: { flex: 1, paddingTop: spacing.lg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.marginMobile,
      gap: spacing.sm,
    },
    applyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: palette.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
    },
    statsCard: {
      flexDirection: "row",
      marginHorizontal: spacing.marginMobile,
      marginTop: spacing.md,
      backgroundColor: palette.surfaceContainerLowest,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      overflow: "hidden",
    },
    statCol: { flex: 1, alignItems: "center", paddingVertical: spacing.md, gap: spacing.xs },
    statSep: { width: 1, backgroundColor: palette.outlineVariant },
    sectionTitle: {
      paddingHorizontal: spacing.marginMobile,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    loadRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.marginMobile,
    },
    balHeader: {
      paddingHorizontal: spacing.marginMobile,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: palette.outlineVariant,
      backgroundColor: palette.surfaceContainerLow,
      gap: spacing.xs,
    },
    filterBarPad: {
      paddingHorizontal: spacing.marginMobile,
      paddingVertical: spacing.sm,
      alignItems: "center",
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      backgroundColor: palette.surfaceContainerLowest,
      minHeight: 44,
      justifyContent: "center",
    },
    chipActive: { backgroundColor: palette.primaryContainer, borderColor: palette.primary },
    holIntro: {
      paddingHorizontal: spacing.marginMobile,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      gap: spacing.xs,
    },
    yearNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.marginMobile,
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.marginMobile,
      marginBottom: spacing.sm,
      backgroundColor: palette.surfaceContainerLow,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.outlineVariant,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
      gap: spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
      gap: spacing.md,
    },
    emptyBlock: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.md },
    holEmptyIcon: {
      width: 56,
      height: 56,
      borderRadius: radius.full,
      backgroundColor: palette.surfaceContainerLow,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.outlineVariant,
    },
    primaryPillBtn: {
      backgroundColor: palette.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
    },
    retryBtn: {
      backgroundColor: palette.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      borderRadius: radius.DEFAULT,
    },
    fab: {
      position: "absolute",
      right: spacing.marginMobile,
      bottom: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: radius.full,
      backgroundColor: palette.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    bsOverlay: { flex: 1, backgroundColor: palette.inverseSurface + "66", justifyContent: "flex-end" },
    bsSheet: {
      backgroundColor: palette.surfaceContainerLowest,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.marginMobile,
      paddingBottom: spacing.xl,
    },
    bsHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: palette.outlineVariant,
      alignSelf: "center",
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    bsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: palette.outlineVariant,
    },
    bsApplyBtn: {
      marginTop: spacing.lg,
      backgroundColor: palette.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      alignItems: "center",
    },
  });

  return (
    <View style={s.container}>
      {/* ══ HEADER ══ */}
      <View style={s.header}>
        <Text variant="display" color="onSurface" style={{ flex: 1 }}>
          {t("tracker.title")}
        </Text>
        {topTab === "mydata" && canApplyLeave ? (
          <PressScale style={s.applyBtn} onPress={() => setShowApply(true)}>
            <AppIcon name="add" size="md" color="onPrimary" />
            <Text variant="labelMd" color="onPrimary">
              {t("tracker.apply")}
            </Text>
          </PressScale>
        ) : null}
      </View>

      {/* ══ TOP TOGGLE My Data | Holidays ══ */}
      {canApplyLeave && (
        <View style={{ paddingHorizontal: spacing.marginMobile, marginTop: spacing.md }}>
          <DetailTabs
            tabs={[
              { key: "mydata", label: t("tracker.myData") },
              { key: "holidays", label: t("tracker.holidays") },
            ]}
            active={topTab}
            onChange={(k) => setTopTab(k as "mydata" | "holidays")}
          />
        </View>
      )}

      {/* ══ MY DATA ══ */}
      {topTab === "mydata" && (
        <View style={{ flex: 1 }}>
          {/* Sub-tabs */}
          <View style={{ paddingHorizontal: spacing.marginMobile }}>
            <DetailTabs
              tabs={DATA_TABS.map((dt) => ({
                key: dt,
                label:
                  dt === "requests" && pendingCount > 0
                    ? `${t(`tracker.dataTabs.${dt}`)} (${pendingCount})`
                    : t(`tracker.dataTabs.${dt}`),
              }))}
              active={dataTab}
              onChange={(k) => setDataTab(k as DataTab)}
            />
          </View>

          {/* ─ Summary ─ */}
          {dataTab === "summary" && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={loading || balancesLoading}
                  onRefresh={() => {
                    loadLeaves();
                    fetchMyBalances();
                  }}
                  colors={[palette.primary]}
                  tintColor={palette.primary}
                />
              }
            >
              {/* Quick stats */}
              <View style={s.statsCard}>
                <View style={s.statCol}>
                  <Text variant="headlineLg" color="success">
                    {approvedCount}
                  </Text>
                  <Text variant="labelSm" color="onSurfaceVariant">
                    {t("tracker.statApproved")}
                  </Text>
                </View>
                <View style={s.statSep} />
                <View style={s.statCol}>
                  <Text variant="headlineLg" color="warning">
                    {pendingCount}
                  </Text>
                  <Text variant="labelSm" color="onSurfaceVariant">
                    {t("tracker.statPending")}
                  </Text>
                </View>
                <View style={s.statSep} />
                <View style={s.statCol}>
                  <Text variant="headlineLg" color="error">
                    {rejectedCount}
                  </Text>
                  <Text variant="labelSm" color="onSurfaceVariant">
                    {t("tracker.statRejected")}
                  </Text>
                </View>
              </View>

              {/* Balance cards */}
              {balancesLoading ? (
                <View style={s.loadRow}>
                  <ActivityIndicator size="small" color={palette.onSurfaceVariant} />
                  <Text variant="bodySm" color="onSurfaceVariant">
                    {t("tracker.loadingBalance")}
                  </Text>
                </View>
              ) : balances.length > 0 ? (
                <View>
                  <Text variant="overline" color="onSurfaceVariant" style={s.sectionTitle}>
                    {t("tracker.sectionLeaveBalance")}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.sm }}
                  >
                    {balances.map((b) => (
                      <BalanceCard key={b.leave_type} balance={b} onPress={() => setSelectedBal(b)} />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* Recent requests */}
              <Text variant="overline" color="onSurfaceVariant" style={s.sectionTitle}>
                {t("tracker.sectionRecentRequests")}
              </Text>
              {recentLeaves.length === 0 && !loading ? (
                <View style={s.emptyBlock}>
                  <AppIcon name="document-text-outline" size="hero" color="outlineVariant" />
                  <Text variant="bodyMd" color="onSurfaceVariant">
                    {t("tracker.emptyNoRequestsYet")}
                  </Text>
                  <PressScale style={s.primaryPillBtn} onPress={() => setShowApply(true)}>
                    <Text variant="labelMd" color="onPrimary">
                      {t("tracker.emptyApplyForLeave")}
                    </Text>
                  </PressScale>
                </View>
              ) : (
                recentLeaves.map((item) => (
                  <LeaveRow
                    key={item.id}
                    item={item}
                    onCancel={item.status === "pending" ? () => handleCancel(item) : undefined}
                  />
                ))
              )}
              <View style={{ height: 80 }} />
            </ScrollView>
          )}

          {/* ─ Balance ─ */}
          {dataTab === "balance" && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={balancesLoading}
                  onRefresh={fetchMyBalances}
                  colors={[palette.primary]}
                  tintColor={palette.primary}
                />
              }
            >
              {balancesLoading ? (
                <View style={s.center}>
                  <ActivityIndicator color={palette.primary} />
                </View>
              ) : balances.length === 0 ? (
                <View style={s.center}>
                  <AppIcon name="wallet-outline" size="hero" color="outlineVariant" />
                  <Text variant="bodyMd" color="onSurfaceVariant">
                    {t("tracker.emptyNoBalanceData")}
                  </Text>
                </View>
              ) : (
                <>
                  <View style={s.balHeader}>
                    <Text variant="labelLg" color="onSurface">
                      {t("tracker.balAnnualTitle")}
                    </Text>
                    <Text variant="labelSm" color="onSurfaceVariant">
                      {t("tracker.balAcademicYear", { year: balances[0]?.academic_year ?? "—" })}
                    </Text>
                  </View>
                  {balances.map((b) => (
                    <BalanceDetailRow key={b.leave_type} b={b} />
                  ))}
                  <View style={{ height: 80 }} />
                </>
              )}
            </ScrollView>
          )}

          {/* ─ Requests ─ */}
          {dataTab === "requests" && (
            <View style={{ flex: 1 }}>
              {/* Filter chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0 }}
                contentContainerStyle={s.filterBarPad}
              >
                {STATUS_FILTER_VALUES.map((fv) => {
                  const active = statusFilter === fv;
                  return (
                    <PressScale
                      key={fv || "all"}
                      style={[s.chip, active && s.chipActive]}
                      onPress={() => setStatusFilter(fv)}
                    >
                      <Text variant="labelMd" color={active ? "onPrimaryContainer" : "onSurfaceVariant"}>
                        {t(`filters.${fv || "all"}`)}
                      </Text>
                    </PressScale>
                  );
                })}
              </ScrollView>

              {error ? (
                <View style={s.center}>
                  <AppIcon name="alert-circle-outline" size="hero" color="error" />
                  <Text variant="bodyMd" color="onSurfaceVariant">
                    {error}
                  </Text>
                  <PressScale style={s.retryBtn} onPress={() => loadLeaves(statusFilter)}>
                    <Text variant="labelMd" color="onPrimary">
                      {t("tracker.retry")}
                    </Text>
                  </PressScale>
                </View>
              ) : (
                <FlatList
                  data={filtered}
                  keyExtractor={(i) => i.id}
                  renderItem={({ item }) => (
                    <LeaveRow
                      item={item}
                      onCancel={item.status === "pending" ? () => handleCancel(item) : undefined}
                    />
                  )}
                  refreshControl={
                    <RefreshControl
                      refreshing={loading}
                      onRefresh={() => loadLeaves(statusFilter)}
                      colors={[palette.primary]}
                      tintColor={palette.primary}
                    />
                  }
                  contentContainerStyle={filtered.length === 0 ? s.emptyContainer : { paddingBottom: spacing.lg }}
                  ListEmptyComponent={
                    !loading ? (
                      <View style={s.center}>
                        <AppIcon name="document-text-outline" size="hero" color="outlineVariant" />
                        <Text variant="bodyMd" color="onSurfaceVariant">
                          {emptyRequestsMessage}
                        </Text>
                      </View>
                    ) : null
                  }
                />
              )}
            </View>
          )}
        </View>
      )}

      {/* ══ HOLIDAYS ══ */}
      {topTab === "holidays" && (
        <View style={{ flex: 1 }}>
          <View style={s.holIntro}>
            <Text variant="labelMd" color="onSurfaceVariant">
              {t("tracker.holidaysReadOnlyTitle")}
            </Text>
            <Text variant="bodySm" color="onSurfaceVariant">
              {t("tracker.holidaysReadOnlySub")}
            </Text>
          </View>
          <View style={s.yearNav}>
            <AppIcon name="chevron-back" size="lg" color="onSurfaceVariant" onPress={() => setHolYear((y) => y - 1)} />
            <Text variant="labelMd" color="onSurface">
              {holYearLabel}
            </Text>
            <AppIcon name="chevron-forward" size="lg" color="onSurfaceVariant" onPress={() => setHolYear((y) => y + 1)} />
          </View>

          {holLoading ? (
            <View style={s.center}>
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : (
            <FlatList
              data={holidays}
              keyExtractor={(h) => h.id}
              renderItem={({ item }) => <HolidayRow h={item} />}
              refreshControl={
                <RefreshControl
                  refreshing={holLoading}
                  onRefresh={() => loadHolidays(holYear)}
                  colors={[palette.primary]}
                  tintColor={palette.primary}
                />
              }
              contentContainerStyle={holidays.length === 0 ? s.emptyContainer : { paddingBottom: spacing.xl }}
              ListEmptyComponent={
                <View style={s.center}>
                  <View style={s.holEmptyIcon}>
                    <AppIcon name="calendar-outline" size="lg" color="onSurfaceVariant" />
                  </View>
                  <Text variant="bodyMd" color="onSurfaceVariant">
                    {t("tracker.emptyHolidaysYear", { year: holYear })}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {topTab === "mydata" && canApplyLeave ? (
        <PressScale style={[s.fab, elevation.card]} onPress={() => setShowApply(true)}>
          <AppIcon name="add" size="xl" color="onPrimary" />
        </PressScale>
      ) : null}

      {/* ══ APPLY MODAL ══ */}
      <ApplyModal
        visible={showApply}
        balances={balances}
        onClose={() => setShowApply(false)}
        onSubmit={handleSubmit}
      />

      {/* ══ BALANCE DETAIL SHEET ══ */}
      <Modal visible={!!selectedBal} animationType="slide" transparent onDismiss={() => setSelectedBal(null)}>
        <View style={s.bsOverlay}>
          <PressScale style={{ flex: 1 }} onPress={() => setSelectedBal(null)}>
            <View style={{ flex: 1 }} />
          </PressScale>
          {selectedBal && (
            <View style={s.bsSheet}>
              <View style={s.bsHandle} />
              <Text variant="headlineMd" color="onSurface">
                {t("tracker.balanceSheet.leaveSuffix", {
                  type: t(`leaveTypes.${selectedBal.leave_type}`),
                })}
              </Text>
              <Text variant="labelSm" color="onSurfaceVariant" style={{ marginBottom: spacing.md, marginTop: 2 }}>
                {selectedBal.academic_year}
              </Text>

              {selectedBal.is_unlimited ? (
                <View style={s.bsRow}>
                  <Text variant="bodyMd" color="onSurfaceVariant">
                    {t("tracker.balanceSheet.balance")}
                  </Text>
                  <Text variant="titleSm" color="success">
                    {t("tracker.balanceSheet.unlimited")}
                  </Text>
                </View>
              ) : (
                <>
                  {(
                    [
                      {
                        labelKey: "tracker.balanceSheet.balance",
                        val: selectedBal.available_days.toFixed(1),
                        color: availColorToken(selectedBal),
                      },
                      {
                        labelKey: "tracker.balanceSheet.booked",
                        val: selectedBal.pending_days.toFixed(1),
                        color: "warning" as const,
                      },
                      {
                        labelKey: "tracker.balanceSheet.used",
                        val: selectedBal.used_days.toFixed(1),
                        color: "error" as const,
                      },
                      {
                        labelKey: "tracker.balanceSheet.total",
                        val: `${selectedBal.allocated_days + selectedBal.carried_forward_days}`,
                        color: "onSurface" as const,
                      },
                    ] as const
                  ).map((row) => (
                    <View key={row.labelKey} style={s.bsRow}>
                      <Text variant="bodyMd" color="onSurfaceVariant">
                        {t(row.labelKey)}
                      </Text>
                      <Text variant="titleSm" color={row.color}>
                        {row.val}
                      </Text>
                    </View>
                  ))}
                  {selectedBal.carried_forward_days > 0 && (
                    <View style={s.bsRow}>
                      <Text variant="bodyMd" color="onSurfaceVariant">
                        {t("tracker.balanceSheet.carriedForward")}
                      </Text>
                      <Text variant="titleSm" color="onSurfaceVariant">
                        +{selectedBal.carried_forward_days}
                      </Text>
                    </View>
                  )}
                </>
              )}

              <PressScale
                style={s.bsApplyBtn}
                onPress={() => {
                  setSelectedBal(null);
                  setTimeout(() => setShowApply(true), 250);
                }}
              >
                <Text variant="labelLg" color="onPrimary">
                  {t("tracker.balanceSheet.applyLeave")}
                </Text>
              </PressScale>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
