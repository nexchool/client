import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAttendance } from "../hooks/useAttendance";
import { useClasses } from "@/modules/classes/hooks/useClasses";
import { DateField } from "@/common/components/DateField";
import { ClassItem } from "@/modules/classes/types";
import { holidayService } from "@/modules/holidays/services/holidayService";
import { Holiday } from "@/modules/holidays/types";
import { useTheme } from "@/common/theme";
import { HomeKpiCard } from "@/modules/home/components/HomeKpiCard";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";

export default function AdminAttendanceScreen() {
  const { t } = useTranslation("attendance");
  const router = useRouter();
  const { palette, spacing, radius, typography, elevation } = useTheme();
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

  const statusColor = (status: string) => {
    switch (status) {
      case "present":
        return palette.success;
      case "absent":
        return palette.error;
      case "late":
        return palette.warning;
      default:
        return palette.onSurfaceVariant;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }}>
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
          <Ionicons name="arrow-back" size={22} color={palette.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[typography.headlineMd, { color: palette.onSurface }]}>
            {t("admin.title")}
          </Text>
          <Text
            style={[
              typography.labelSm,
              { color: palette.onSurfaceVariant, marginTop: 2, textTransform: "none", letterSpacing: 0 },
            ]}
          >
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
        <DateField
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
              <Ionicons name="umbrella-outline" size={20} color={palette.onErrorContainer} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelMd, { color: palette.onErrorContainer, fontFamily: "Inter_600SemiBold" }]}>
                {holidayInfo.is_recurring
                  ? t("admin.weeklyOff", { day: holidayInfo.recurring_day_name ?? t("admin.offDay") })
                  : holidayInfo.name}
              </Text>
              <Text style={[typography.labelSm, { color: palette.onErrorContainer, textTransform: "none", letterSpacing: 0, marginTop: 2 }]}>
                {t("admin.holidayReadOnly")}
              </Text>
            </View>
          </View>
        )}

        {!selectedClass ? (
          <>
            {/* Class Selector */}
            <Text
              style={[
                typography.labelSm,
                {
                  color: palette.onSurfaceVariant,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginTop: spacing.sm,
                },
              ]}
            >
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
                  icon={<Ionicons name="school-outline" size={36} color={palette.onSurfaceVariant} />}
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
                      <Ionicons name="school-outline" size={18} color={palette.onPrimaryContainer} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.labelMd, { color: palette.onSurface }]} numberOfLines={1}>
                        {item.name} - {item.section}
                      </Text>
                      <Text
                        style={[
                          typography.labelSm,
                          { color: palette.onSurfaceVariant, textTransform: "none", letterSpacing: 0, marginTop: 2 },
                        ]}
                      >
                        {item.academic_year}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={palette.onSurfaceVariant} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Selected Class Header */}
            <Pressable
              onPress={() => setSelectedClass(null)}
              style={({ pressed }) => [
                elevation.card,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  padding: spacing.md,
                  backgroundColor: pressed ? palette.surfaceContainerLow : palette.surfaceContainerLowest,
                  borderRadius: radius.lg,
                  gap: spacing.sm,
                },
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={palette.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.labelMd, { color: palette.onSurface }]}>
                  {selectedClass.name} - {selectedClass.section}
                </Text>
              </View>
              <Text
                style={[
                  typography.labelSm,
                  { color: palette.primary, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 1 },
                ]}
              >
                {t("admin.change")}
              </Text>
            </Pressable>

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
                    const c = statusColor(status);
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
                          <Ionicons name="person-outline" size={16} color={palette.onSurfaceVariant} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.labelMd, { color: palette.onSurface }]} numberOfLines={1}>
                            {item.student_name}
                          </Text>
                          <Text
                            style={[
                              typography.labelSm,
                              { color: palette.onSurfaceVariant, textTransform: "none", letterSpacing: 0, marginTop: 2 },
                            ]}
                          >
                            {item.admission_number}
                          </Text>
                        </View>
                        <Text
                          style={[
                            typography.labelSm,
                            {
                              color: c,
                              fontFamily: "Inter_600SemiBold",
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            },
                          ]}
                        >
                          {item.marked
                            ? t(`status.${status}`, { defaultValue: status })
                            : t("admin.notMarked")}
                        </Text>
                      </View>
                    );
                  }}
                  ListEmptyComponent={
                    <EmptyState
                      icon={<Ionicons name="calendar-outline" size={36} color={palette.onSurfaceVariant} />}
                      title={t("admin.emptyDate")}
                    />
                  }
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
