import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View, FlatList, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAttendance } from "../hooks/useAttendance";
import { useClasses } from "@/modules/classes/hooks/useClasses";
import { DatePicker } from '@/common/components/datepicker';
import { ClassItem } from "@/modules/classes/types";
import { holidayService } from "@/modules/holidays/services/holidayService";
import { Holiday } from "@/modules/holidays/types";
import { useTheme } from "@/common/theme";
import { AppIcon } from "@/common/components/AppIcon";
import { Text } from "@/common/components/Text";
import { PressScale } from "@/common/components/PressScale";
import { HomeKpiCard } from "@/modules/home/components/HomeKpiCard";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";

export default function AdminAttendanceScreen() {
  const { t } = useTranslation("attendance");
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();
  const { classAttendance, loading: attLoading, fetchClassAttendance } = useAttendance();
  const { classes, fetchClasses, loading: classesLoading } = useClasses();

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [holidayInfo, setHolidayInfo] = useState<Holiday | null>(null);

  // Check if selected date is a holiday
  const checkHoliday = useCallback(async (dateStr: string) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      setHolidayInfo(null);
      return;
    }
    try {
      const d = new Date(dateStr);
      const backendWeekday = (d.getDay() + 6) % 7;
      const [nonRecurring, recurring] = await Promise.all([
        holidayService.getHolidays({ start_date: dateStr, end_date: dateStr, include_recurring: false }),
        holidayService.getRecurring(),
      ]);
      if (nonRecurring.length > 0) {
        setHolidayInfo(nonRecurring[0]);
      } else {
        const match = recurring.find((r) => r.recurring_day_of_week === backendWeekday);
        setHolidayInfo(match ?? null);
      }
    } catch {
      setHolidayInfo(null);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    checkHoliday(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClassSelect = (cls: ClassItem) => {
    setSelectedClass(cls);
    fetchClassAttendance(cls.id, selectedDate);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    checkHoliday(date);
    if (selectedClass) {
      fetchClassAttendance(selectedClass.id, date);
    }
  };

  const statusColor = (status: string): "success" | "error" | "warning" | "onSurfaceVariant" => {
    switch (status) {
      case "present":
        return "success";
      case "absent":
        return "error";
      case "late":
        return "warning";
      default:
        return "onSurfaceVariant";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.marginMobile,
          paddingVertical: spacing.md,
          gap: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: radius.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? palette.surfaceContainer : "transparent",
          })}
        >
          <AppIcon name="arrow-back" size="lg" color="onSurface" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="headlineMd" color="onSurface">
            {t("admin.title")}
          </Text>
          <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: 2 }}>
            {new Date(selectedDate).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingBottom: spacing.xl * 2,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Picker */}
        <DatePicker
          label={t("admin.dateLabel")}
          value={selectedDate}
          onChange={handleDateChange}
          placeholder={t("admin.datePlaceholder")}
        />

        {/* Holiday Banner */}
        {holidayInfo && (
          <View
            style={[
              elevation.card,
              {
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                padding: spacing.md,
                backgroundColor: palette.errorContainer,
                borderRadius: radius.lg,
              },
            ]}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.md,
                backgroundColor: palette.surfaceContainerLowest,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon name="umbrella-outline" size="md" color="onErrorContainer" />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="labelMd" color="onErrorContainer">
                {holidayInfo.is_recurring
                  ? t("admin.weeklyOff", { day: holidayInfo.recurring_day_name ?? t("admin.offDay") })
                  : holidayInfo.name}
              </Text>
              <Text variant="labelSm" color="onErrorContainer" style={{ marginTop: 2 }}>
                {t("admin.holidayReadOnly")}
              </Text>
            </View>
          </View>
        )}

        {!selectedClass ? (
          <>
            {/* Class Selector */}
            <Text variant="overline" color="onSurfaceVariant" style={{ marginTop: spacing.sm }}>
              {t("admin.selectClass")}
            </Text>
            {classesLoading ? (
              <View style={{ gap: spacing.sm }}>
                <Skeleton width="100%" height={64} radius={radius.lg} />
                <Skeleton width="100%" height={64} radius={radius.lg} />
                <Skeleton width="100%" height={64} radius={radius.lg} />
              </View>
            ) : classes.length === 0 ? (
              <View
                style={[
                  elevation.card,
                  { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, overflow: "hidden" },
                ]}
              >
                <EmptyState
                  icon={<AppIcon name="school-outline" size="xl" color="onSurfaceVariant" />}
                  title={t("admin.emptyDate", { defaultValue: "No classes available" })}
                />
              </View>
            ) : (
              <View
                style={[
                  elevation.card,
                  { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, overflow: "hidden" },
                ]}
              >
                {classes.map((item, idx) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleClassSelect(item)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                      padding: spacing.md,
                      borderBottomWidth: idx < classes.length - 1 ? 1 : 0,
                      borderBottomColor: palette.surfaceContainerHigh,
                      backgroundColor: pressed ? palette.surfaceContainerLow : "transparent",
                    })}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: radius.md,
                        backgroundColor: palette.primaryContainer,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AppIcon name="school-outline" size="md" color="onPrimaryContainer" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="labelMd" color="onSurface" numberOfLines={1}>
                        {item.name} - {item.section}
                      </Text>
                      <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: 2 }}>
                        {item.academic_year}
                      </Text>
                    </View>
                    <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Selected Class Header */}
            <PressScale
              onPress={() => setSelectedClass(null)}
              style={[
                elevation.card,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  padding: spacing.md,
                  backgroundColor: palette.surfaceContainerLowest,
                  borderRadius: radius.lg,
                  gap: spacing.sm,
                },
              ]}
            >
              <AppIcon name="chevron-back" size="md" color="primary" />
              <View style={{ flex: 1 }}>
                <Text variant="labelMd" color="onSurface">
                  {selectedClass.name} - {selectedClass.section}
                </Text>
              </View>
              <Text variant="overline" color="primary">
                {t("admin.change")}
              </Text>
            </PressScale>

            {/* Summary KPIs */}
            {classAttendance && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                <View style={{ width: "48%" }}>
                  <HomeKpiCard
                    label={t("admin.total")}
                    value={String(classAttendance.total_students)}
                    accent="primary"
                    iconName="people-outline"
                    iconBgToken="primaryContainer"
                  />
                </View>
                <View style={{ width: "48%" }}>
                  <HomeKpiCard
                    label={t("admin.present")}
                    value={String(classAttendance.present_count)}
                    accent="success"
                    iconName="checkmark-circle-outline"
                    iconBgToken="secondaryContainer"
                  />
                </View>
                <View style={{ width: "48%" }}>
                  <HomeKpiCard
                    label={t("admin.absent")}
                    value={String(classAttendance.absent_count)}
                    accent="error"
                    iconName="close-circle-outline"
                    iconBgToken="errorContainer"
                  />
                </View>
                <View style={{ width: "48%" }}>
                  <HomeKpiCard
                    label={t("admin.late")}
                    value={String(classAttendance.late_count)}
                    accent="tertiary"
                    iconName="time-outline"
                    iconBgToken="tertiaryContainer"
                  />
                </View>
              </View>
            )}

            {/* Records */}
            {attLoading ? (
              <View style={{ gap: spacing.sm }}>
                <Skeleton width="100%" height={56} radius={radius.lg} />
                <Skeleton width="100%" height={56} radius={radius.lg} />
                <Skeleton width="100%" height={56} radius={radius.lg} />
                <Skeleton width="100%" height={56} radius={radius.lg} />
              </View>
            ) : (
              <View
                style={[
                  elevation.card,
                  { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, overflow: "hidden" },
                ]}
              >
                <FlatList
                  data={classAttendance?.attendance ?? []}
                  keyExtractor={(item) => item.student_id}
                  scrollEnabled={false}
                  renderItem={({ item, index }) => {
                    const records = classAttendance?.attendance ?? [];
                    const status = item.status ?? "unmarked";
                    const colorKey = statusColor(status);
                    return (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: spacing.md,
                          gap: spacing.md,
                          borderBottomWidth: index < records.length - 1 ? 1 : 0,
                          borderBottomColor: palette.surfaceContainerHigh,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: radius.full,
                            backgroundColor: palette.surfaceContainerHigh,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <AppIcon name="person-outline" size="sm" color="onSurfaceVariant" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="labelMd" color="onSurface" numberOfLines={1}>
                            {item.student_name}
                          </Text>
                          <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: 2 }}>
                            {item.admission_number}
                          </Text>
                        </View>
                        <Text variant="overline" color={colorKey}>
                          {item.marked
                            ? t(`status.${status}`, { defaultValue: status })
                            : t("admin.notMarked")}
                        </Text>
                      </View>
                    );
                  }}
                  ListEmptyComponent={
                    <EmptyState
                      icon={<AppIcon name="calendar-outline" size="xl" color="onSurfaceVariant" />}
                      title={t("admin.emptyDate")}
                    />
                  }
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
