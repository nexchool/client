import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  SafeAreaView,
  FlatList,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useStudentFees,
  useAcademicYears,
  useClasses,
} from "@/modules/finance/hooks/useFinance";
import { useAcademicYearContext } from "@/modules/academics/context/AcademicYearContext";
import { calendarLocaleForLanguage } from "@/i18n";
import { ClassSelect } from "@/common/components/ClassSelect";
import { ProfileAvatar } from "@/common/components/ProfileAvatar";
import { useTheme } from "@/common/theme";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { formatCurrency } from "@/common/utils/formatCurrency";

function formatDate(s: string, locale: string) {
  try {
    return new Date(s).toLocaleDateString(locale);
  } catch {
    return s;
  }
}

const STATUS_VALUES = ["", "overdue", "unpaid", "partial", "paid"] as const;

function statusAccent(
  status: string,
  palette: ReturnType<typeof useTheme>["palette"]
): string {
  switch (status) {
    case "paid":
      return palette.success;
    case "partial":
      return palette.warning;
    case "overdue":
      return palette.error;
    default:
      return palette.onSurfaceVariant;
  }
}

function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation("finance");
  const { palette, typography, spacing, radius } = useTheme();
  const color = statusAccent(status, palette);
  return (
    <View
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: color,
        backgroundColor: `${color}15`,
      }}
    >
      <Text style={[typography.labelSm, { color }]}>
        {t(`studentFeeStatuses.${status}`, { defaultValue: status })}
      </Text>
    </View>
  );
}

/** Derive unique statuses from fee items. */
function getStatusesToDisplay(
  items: Array<{ amount?: number; paid_amount?: number }> | undefined,
  feeStatus: string
): string[] {
  if (!items?.length) return [feeStatus];
  const statuses = new Set<string>();
  for (const it of items) {
    const amt = it.amount ?? 0;
    const paid = it.paid_amount ?? 0;
    if (paid >= amt) statuses.add("paid");
    else if (paid > 0) statuses.add("partial");
    else statuses.add("unpaid");
  }
  if (feeStatus === "overdue") statuses.add("overdue");
  return statuses.size > 0 ? Array.from(statuses) : [feeStatus];
}

export default function StudentFeesPage() {
  const { t, i18n } = useTranslation("finance");
  const locale = calendarLocaleForLanguage(i18n.language ?? "en");
  const router = useRouter();
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const { selectedAcademicYearId: contextYearId } = useAcademicYearContext();
  const [academicYearId, setAcademicYearId] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: academicYears = [] } = useAcademicYears(false);
  const { data: classes = [] } = useClasses();

  useEffect(() => {
    if (contextYearId)
      setAcademicYearId((prev) => (prev === "" ? contextYearId : prev));
  }, [contextYearId]);

  const {
    data: studentFees = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useStudentFees({
    academic_year_id: academicYearId || undefined,
    class_id: classId || undefined,
    status: status || undefined,
    search: search.trim() || undefined,
    include_items: true,
  });

  const classOptions = useMemo(
    () =>
      classes.map((c) => ({
        id: c.id,
        label: c.section ? `${c.name}-${c.section}` : c.name ?? c.id,
        name: c.name,
        section: c.section,
      })),
    [classes]
  );

  // Totals KPIs
  const totals = useMemo(() => {
    let total = 0;
    let paid = 0;
    for (const sf of studentFees) {
      total += sf.total_amount ?? 0;
      paid += sf.paid_amount ?? 0;
    }
    return { total, paid };
  }, [studentFees]);

  const renderFeeItem = ({ item: sf }: { item: (typeof studentFees)[0] }) => {
    const total = sf.total_amount ?? 0;
    const paid = sf.paid_amount ?? 0;
    const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
    const isOverdue = sf.status === "overdue";
    return (
      <Pressable
        onPress={() =>
          router.push(`/(protected)/finance/student-fees/${sf.id}` as any)
        }
        style={({ pressed }) => [
          elevation.card,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: radius.xl,
            padding: spacing.md,
            marginBottom: spacing.md,
            borderLeftWidth: isOverdue ? 4 : 0,
            borderLeftColor: palette.error,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <ProfileAvatar
            uri={sf.student_profile_picture}
            size={44}
            name={sf.student_name ?? undefined}
            iconColor={palette.primary}
            placeholderBg={palette.primaryContainer}
            style={{ marginRight: spacing.md }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[typography.labelMd, { color: palette.onSurface }]}
              numberOfLines={1}
            >
              {sf.student_name ?? "—"}
            </Text>
            <Text
              style={[
                typography.labelSm,
                { color: palette.onSurfaceVariant, marginTop: 2 },
              ]}
              numberOfLines={1}
            >
              {t("studentFeesList.feeDueLine", {
                structure: sf.fee_structure_name ?? "—",
                date: formatDate(sf.due_date, locale),
              })}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={palette.onSurfaceVariant}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: spacing.md,
            gap: spacing.sm,
          }}
        >
          <Text style={[typography.headlineMd, { color: palette.onSurface }]}>
            {formatCurrency(total)}
          </Text>
          <Text
            style={[
              typography.labelSm,
              { color: palette.success },
            ]}
          >
            {t("studentFeesList.paidLine", {
              amount: formatCurrency(paid),
            })}
          </Text>
        </View>

        {/* progress bar */}
        <View
          style={{
            height: 6,
            backgroundColor: palette.surfaceContainerHigh,
            borderRadius: radius.full,
            marginTop: spacing.sm,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${pct}%`,
              height: "100%",
              backgroundColor: pct >= 100 ? palette.success : palette.primary,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.xs,
            marginTop: spacing.sm,
          }}
        >
          {getStatusesToDisplay(sf.items, sf.status).map((s) => (
            <StatusPill key={s} status={s} />
          ))}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: palette.surface }}
    >
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
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={{ padding: spacing.xs }}
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color={palette.onSurface}
          />
        </TouchableOpacity>
        <Text
          style={[typography.headlineLg, { color: palette.onSurface, flex: 1 }]}
        >
          {t("studentFeesList.title", { defaultValue: "Fee structure" })}
        </Text>
      </View>

      {/* KPI summary */}
      {!error && (
        <View
          style={{
            flexDirection: "row",
            gap: spacing.md,
            paddingHorizontal: spacing.marginMobile,
            marginTop: spacing.sm,
          }}
        >
          <View
            style={[
              elevation.card,
              {
                flex: 1,
                backgroundColor: palette.surfaceContainerLowest,
                borderRadius: radius.lg,
                padding: spacing.md,
              },
            ]}
          >
            <Text
              style={[typography.labelSm, { color: palette.onSurfaceVariant }]}
            >
              {t("studentFeesList.totalFees", { defaultValue: "Total fees" })}
            </Text>
            <Text
              style={[typography.headlineMd, { color: palette.onSurface, marginTop: 2 }]}
              numberOfLines={1}
            >
              {formatCurrency(totals.total)}
            </Text>
          </View>
          <View
            style={[
              elevation.card,
              {
                flex: 1,
                backgroundColor: palette.surfaceContainerLowest,
                borderRadius: radius.lg,
                padding: spacing.md,
              },
            ]}
          >
            <Text
              style={[typography.labelSm, { color: palette.onSurfaceVariant }]}
            >
              {t("studentFeesList.paidTotal", { defaultValue: "Paid" })}
            </Text>
            <Text
              style={[typography.headlineMd, { color: palette.success, marginTop: 2 }]}
              numberOfLines={1}
            >
              {formatCurrency(totals.paid)}
            </Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: palette.surfaceContainerLow,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          marginHorizontal: spacing.marginMobile,
          marginTop: spacing.md,
        }}
      >
        <Ionicons
          name="search"
          size={20}
          color={palette.onSurfaceVariant}
          style={{ marginRight: spacing.sm }}
        />
        <TextInput
          style={[
            typography.bodyMd,
            { flex: 1, color: palette.onSurface, paddingVertical: spacing.sm },
          ]}
          value={search}
          onChangeText={setSearch}
          placeholder={t("studentFeesList.searchPlaceholder")}
          placeholderTextColor={palette.onSurfaceVariant}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons
              name="close-circle"
              size={20}
              color={palette.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View
        style={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.md,
          gap: spacing.sm,
        }}
      >
        <Text
          style={[typography.labelSm, { color: palette.onSurfaceVariant }]}
        >
          {t("studentFeesList.academicYear")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          <Chip
            active={!academicYearId}
            label={t("common.all")}
            onPress={() => setAcademicYearId("")}
          />
          {academicYears.map((ay) => (
            <Chip
              key={ay.id}
              active={academicYearId === ay.id}
              label={ay.name}
              onPress={() =>
                setAcademicYearId(academicYearId === ay.id ? "" : ay.id)
              }
            />
          ))}
        </ScrollView>

        <Text
          style={[typography.labelSm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}
        >
          {t("studentFeesList.class")}
        </Text>
        <ClassSelect
          value={classId || null}
          onChange={(id) => setClassId(id ?? "")}
          options={classOptions}
          allowEmpty
          emptyLabel={t("common.all")}
        />

        <Text
          style={[typography.labelSm, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}
        >
          {t("studentFeesList.status")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {STATUS_VALUES.map((fv) => (
            <Chip
              key={fv || "all"}
              active={status === fv}
              label={t(`feeFilters.${fv || "all"}`)}
              onPress={() => setStatus(fv)}
            />
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View
          style={{
            padding: spacing.lg,
            alignItems: "center",
          }}
        >
          <Text style={[typography.bodyMd, { color: palette.error }]}>
            {error instanceof Error ? error.message : t("common.failedToLoad")}
          </Text>
        </View>
      ) : isLoading && studentFees.length === 0 ? (
        <View
          style={{
            padding: spacing.marginMobile,
            gap: spacing.md,
          }}
        >
          <Skeleton width="100%" height={112} radius={radius.xl} />
          <Skeleton width="100%" height={112} radius={radius.xl} />
          <Skeleton width="100%" height={112} radius={radius.xl} />
        </View>
      ) : (
        <FlatList
          data={studentFees}
          keyExtractor={(item) => item.id}
          renderItem={renderFeeItem}
          contentContainerStyle={{
            padding: spacing.marginMobile,
            paddingBottom: spacing.xl * 2,
          }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={
                <Ionicons
                  name={search ? "search-outline" : "wallet-outline"}
                  size={36}
                  color={palette.onSurfaceVariant}
                />
              }
              title={
                search
                  ? t("studentFeesList.emptySearch")
                  : t("studentFeesList.emptyNoFees")
              }
              description={
                search
                  ? t("studentFeesList.emptySearchHint")
                  : t("studentFeesList.emptyNoFeesHint")
              }
              action={
                !search
                  ? {
                      label: t("studentFeesList.goToStructures"),
                      onPress: () =>
                        router.push("/(protected)/finance/structures" as any),
                    }
                  : undefined
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function Chip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const { palette, spacing, radius, typography } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        backgroundColor: active ? palette.primary : palette.surfaceContainerLow,
        borderWidth: 1,
        borderColor: active ? palette.primary : palette.outlineVariant,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={[
          typography.labelSm,
          { color: active ? palette.onPrimary : palette.onSurface },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({});
