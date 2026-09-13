import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, RefreshControl, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useStudentFees, useClasses } from "@/modules/finance/hooks/useFinance";
import { useAcademicYearContext } from "@/modules/academics/context/AcademicYearContext";
import { ProfileAvatar } from "@/common/components/ProfileAvatar";
import { useTheme, type Palette } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { PageHeader } from "@/common/components/PageHeader";
import { StatusPill } from "@/common/components/StatusPill";
import { SearchFilterBar } from "@/common/components/SearchFilterBar";
import {
  StudentFeeFiltersSheet,
  EMPTY_STUDENT_FEE_FILTERS,
  countActiveStudentFeeFilters,
  type StudentFeeFilters,
} from "@/modules/finance/components/StudentFeeFiltersSheet";
import { formatCurrency } from "@/common/utils/formatCurrency";
import { useDebounce } from "@/common/hooks/useDebounce";
import { formatDate } from "@/common/utils/datetime";


/**
 * Maps a (derived) student-fee status to its accent palette token.
 *
 * The vocabulary stays here — a fee is unpaid or partial, an invoice is
 * pending, a payment is refunded, and those are three different lists that
 * merely share an appearance. `StatusPill` owns the appearance.
 */
function statusAccentToken(status: string): keyof Palette {
  switch (status) {
    case "paid":
      return "success";
    case "partial":
      return "secondary";
    case "overdue":
      return "error";
    default:
      return "onSurfaceVariant";
  }
}

/** Derive unique statuses from fee items. */
function getStatusesToDisplay(
  items: { amount?: number; paid_amount?: number }[] | undefined,
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
  const { t } = useTranslation("finance");
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();
  // The year comes from the app-wide switcher in the header and nowhere else.
  // This screen used to carry its own chip rail as well, so a school with two
  // year controls on one screen had no way to tell which one was in force.
  const { selectedAcademicYearId } = useAcademicYearContext();
  const [filters, setFilters] = useState<StudentFeeFilters>(EMPTY_STUDENT_FEE_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Debounce so the list doesn't refetch on every keystroke.
  const debouncedSearch = useDebounce(search, 350);
  const activeFilterCount = countActiveStudentFeeFilters(filters);

  const { data: classes = [] } = useClasses();

  const {
    data: studentFees = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useStudentFees({
    academic_year_id: selectedAcademicYearId || undefined,
    class_id: filters.classId || undefined,
    status: filters.status || undefined,
    search: debouncedSearch.trim() || undefined,
    include_items: true,
  });

  const classOptions = useMemo(
    () =>
      classes.map((c) => ({
        id: c.id,
        label:
          c.display_name ??
          (c.section ? `${c.name ?? ""}-${c.section}` : c.name ?? c.id),
      })),
    [classes]
  );

  const classLabel = useMemo(
    () => classOptions.find((c) => c.id === filters.classId)?.label ?? filters.classId,
    [classOptions, filters.classId]
  );

  // What is applied, in the words the sheet used to set it.
  const appliedPills = useMemo(() => {
    const pills: { key: string; label: string; onRemove: () => void }[] = [];
    if (filters.classId) {
      pills.push({
        key: "class",
        label: `${t("filters.classLabel", { defaultValue: "Class" })}: ${classLabel}`,
        onRemove: () => setFilters((prev) => ({ ...prev, classId: null })),
      });
    }
    if (filters.status) {
      pills.push({
        key: "status",
        label: `${t("filters.statusLabel", { defaultValue: "Status" })}: ${t(
          `feeFilters.${filters.status}`,
          { defaultValue: filters.status }
        )}`,
        onRemove: () => setFilters((prev) => ({ ...prev, status: "" })),
      });
    }
    return pills;
  }, [filters.classId, filters.status, classLabel, t]);

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
          router.push(`/(protected)/finance/student-fees/${sf.id}` as never)
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
            <Text variant="titleSm" color="onSurface" numberOfLines={1}>
              {sf.student_name ?? "—"}
            </Text>
            <Text
              variant="bodySm"
              color="onSurfaceVariant"
              numberOfLines={1}
              style={{ marginTop: 2 }}
            >
              {t("studentFeesList.feeDueLine", {
                structure: sf.fee_structure_name ?? "—",
                date: formatDate(sf.due_date),
              })}
            </Text>
          </View>
          <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: spacing.md,
            gap: spacing.sm,
          }}
        >
          <Text variant="headlineMd" color="onSurface">
            {formatCurrency(total)}
          </Text>
          <Text variant="labelSm" color="success">
            {t("studentFeesList.paidLine", { amount: formatCurrency(paid) })}
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
            <StatusPill
              key={s}
              tone={statusAccentToken(s)}
              label={t(`studentFeeStatuses.${s}`, { defaultValue: s })}
            />
          ))}
        </View>
      </Pressable>
    );
  };

  // The toolbar and the totals ride inside the list rather than above it.
  // Pinned, they took roughly two-fifths of the screen before the first row
  // and never gave it back — on a screen whose whole job is rows.
  const listHeader = (
    <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
      {!error ? (
        <View style={{ flexDirection: "row", gap: spacing.md }}>
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
            <Text variant="overline" color="onSurfaceVariant">
              {t("studentFeesList.totalFees", { defaultValue: "Total fees" })}
            </Text>
            <Text
              variant="headlineMd"
              color="onSurface"
              numberOfLines={1}
              style={{ marginTop: 2 }}
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
            <Text variant="overline" color="onSurfaceVariant">
              {t("studentFeesList.paidTotal", { defaultValue: "Paid" })}
            </Text>
            <Text
              variant="headlineMd"
              color="success"
              numberOfLines={1}
              style={{ marginTop: 2 }}
            >
              {formatCurrency(totals.paid)}
            </Text>
          </View>
        </View>
      ) : null}

      <SearchFilterBar
        value={search}
        onChangeText={setSearch}
        placeholder={t("studentFeesList.searchPlaceholder")}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={activeFilterCount}
        pills={appliedPills}
        onClearAll={() => setFilters(EMPTY_STUDENT_FEE_FILTERS)}
        clearAllLabel={t("filters.clearAll", { defaultValue: "Clear all" })}
        filtersLabel={t("filters.title", { defaultValue: "Filters" })}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <PageHeader
        title={t("studentFeesList.title", { defaultValue: "Fee structure" })}
        onBack={() => router.back()}
      />

      {error ? (
        <View style={{ padding: spacing.lg, alignItems: "center" }}>
          <Text variant="bodyMd" color="error">
            {error instanceof Error ? error.message : t("common.failedToLoad")}
          </Text>
        </View>
      ) : isLoading && studentFees.length === 0 ? (
        <View style={{ padding: spacing.marginMobile, gap: spacing.md }}>
          <Skeleton width="100%" height={112} radius={radius.xl} />
          <Skeleton width="100%" height={112} radius={radius.xl} />
          <Skeleton width="100%" height={112} radius={radius.xl} />
        </View>
      ) : (
        <FlatList
          data={studentFees}
          keyExtractor={(item) => item.id}
          renderItem={renderFeeItem}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{
            paddingHorizontal: spacing.marginMobile,
            paddingTop: spacing.md,
            paddingBottom: spacing.scrollBottom,
          }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              icon={
                <AppIcon
                  name={search || activeFilterCount > 0 ? "search-outline" : "wallet-outline"}
                  size="xl"
                  color="onSurfaceVariant"
                />
              }
              title={
                search || activeFilterCount > 0
                  ? t("studentFeesList.emptySearch")
                  : t("studentFeesList.emptyNoFees")
              }
              description={
                search || activeFilterCount > 0
                  ? t("studentFeesList.emptySearchHint")
                  : t("studentFeesList.emptyNoFeesHint")
              }
              action={
                !search && activeFilterCount === 0
                  ? {
                      label: t("studentFeesList.goToStructures"),
                      onPress: () =>
                        router.push(
                          "/(protected)/finance/structures" as never
                        ),
                    }
                  : undefined
              }
            />
          }
        />
      )}

      <StudentFeeFiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        classes={classOptions}
      />
    </View>
  );
}
