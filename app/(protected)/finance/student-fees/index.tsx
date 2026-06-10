import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  RefreshControl,
  TextInput,
  FlatList,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import {
  useStudentFees,
  useAcademicYears,
  useClasses,
} from "@/modules/finance/hooks/useFinance";
import { useAcademicYearContext } from "@/modules/academics/context/AcademicYearContext";
import { calendarLocaleForLanguage } from "@/i18n";
import { ClassSelect } from "@/common/components/ClassSelect";
import { ProfileAvatar } from "@/common/components/ProfileAvatar";
import { useTheme, type Palette } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { formatCurrency } from "@/common/utils/formatCurrency";
import { useDebounce } from "@/common/hooks/useDebounce";

function formatDate(s: string, locale: string) {
  try {
    return new Date(s).toLocaleDateString(locale);
  } catch {
    return s;
  }
}

const STATUS_VALUES = ["", "overdue", "unpaid", "partial", "paid"] as const;

/** Maps a (derived) student-fee status to its accent palette token. */
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

function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation("finance");
  const { palette, spacing, radius } = useTheme();
  const color = palette[statusAccentToken(status)];
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
      <Text variant="labelSm" style={{ color }}>
        {t(`studentFeeStatuses.${status}`, { defaultValue: status })}
      </Text>
    </View>
  );
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
  const { t, i18n } = useTranslation("finance");
  const locale = calendarLocaleForLanguage(i18n.language ?? "en");
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();
  const { selectedAcademicYearId: contextYearId } = useAcademicYearContext();
  const [academicYearId, setAcademicYearId] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  // Debounce so the list doesn't refetch on every keystroke.
  const debouncedSearch = useDebounce(search, 350);

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
    search: debouncedSearch.trim() || undefined,
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
            <Text variant="labelMd" color="onSurface" numberOfLines={1}>
              {sf.student_name ?? "—"}
            </Text>
            <Text
              variant="labelSm"
              color="onSurfaceVariant"
              numberOfLines={1}
              style={{ marginTop: 2 }}
            >
              {t("studentFeesList.feeDueLine", {
                structure: sf.fee_structure_name ?? "—",
                date: formatDate(sf.due_date, locale),
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
            <StatusPill key={s} status={s} />
          ))}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
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
        <AppIcon
          name="arrow-back"
          size="lg"
          color="onSurface"
          onPress={() => router.back()}
          accessibilityLabel="Back"
        />
        <Text variant="headlineLg" color="onSurface" style={{ flex: 1 }}>
          {t("studentFeesList.title", { defaultValue: "Fee structure" })}
        </Text>
      </View>

      {/* KPI summary */}
      {!error ? (
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
            <Text variant="labelSm" color="onSurfaceVariant">
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
            <Text variant="labelSm" color="onSurfaceVariant">
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
        <AppIcon name="search" size="md" color="onSurfaceVariant" />
        <TextInput
          style={{
            flex: 1,
            color: palette.onSurface,
            paddingVertical: spacing.sm,
            marginLeft: spacing.sm,
          }}
          value={search}
          onChangeText={setSearch}
          placeholder={t("studentFeesList.searchPlaceholder")}
          placeholderTextColor={palette.onSurfaceVariant}
        />
        {search.length > 0 ? (
          <AppIcon
            name="close-circle"
            size="md"
            color="onSurfaceVariant"
            onPress={() => setSearch("")}
            accessibilityLabel="Clear search"
          />
        ) : null}
      </View>

      {/* Filters */}
      <View
        style={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.md,
          gap: spacing.sm,
        }}
      >
        <Text variant="labelSm" color="onSurfaceVariant">
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
          variant="labelSm"
          color="onSurfaceVariant"
          style={{ marginTop: spacing.xs }}
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
          variant="labelSm"
          color="onSurfaceVariant"
          style={{ marginTop: spacing.xs }}
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
          contentContainerStyle={{
            paddingHorizontal: spacing.marginMobile,
            paddingTop: spacing.md,
            paddingBottom: spacing.xl * 2,
          }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={
                <AppIcon
                  name={search ? "search-outline" : "wallet-outline"}
                  size="xl"
                  color="onSurfaceVariant"
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
    </View>
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
  const { palette, spacing, radius } = useTheme();
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
      <Text variant="labelSm" color={active ? "onPrimary" : "onSurface"}>
        {label}
      </Text>
    </Pressable>
  );
}
