import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { classService } from "@/modules/classes/services/classService";
import { attendanceV2Api } from "@/modules/academics/api/attendanceV2Api";
import type { AttendanceSessionV2 } from "@/modules/academics/types";
import { Student } from "@/modules/students/types";
import { StatusChip } from "@/modules/academics/components/StatusChip";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import * as PERMS from "@/modules/permissions/constants/permissions";

type Status = "present" | "absent" | "late" | "excused";

const ORDER: Status[] = ["present", "absent", "late", "excused"];

export default function AttendanceSessionScreen() {
  const { t } = useTranslation("attendance");
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { classId, className, date: dateParam } = useLocalSearchParams<{
    classId: string;
    className?: string;
    date?: string;
  }>();

  const [date, setDate] = useState(dateParam ?? new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [session, setSession] = useState<AttendanceSessionV2 | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canManageFinalized = hasPermission(PERMS.ATTENDANCE_MANAGE);
  const readOnly =
    session?.status === "finalized" && !canManageFinalized;

  useEffect(() => {
    if (!classId) return;
    (async () => {
      setLoading(true);
      try {
        const detail = await classService.getClassDetail(classId);
        setStudents(detail.students ?? []);
        let res = await attendanceV2Api.getClassSession(classId, date);
        if (!res.session) {
          const created = await attendanceV2Api.createClassSession(classId, { session_date: date });
          setSession(created.session);
          res = await attendanceV2Api.getClassSession(classId, date);
        } else {
          setSession(res.session);
        }
        const m: Record<string, Status> = {};
        for (const r of res.records ?? []) {
          if (ORDER.includes(r.status as Status)) m[r.student_id] = r.status as Status;
        }
        for (const st of detail.students ?? []) {
          if (m[st.id] === undefined) m[st.id] = "present";
        }
        setStatusMap(m);
      } catch (e: any) {
        Alert.alert(t("session.errorTitle"), e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [classId, date]);

  const cycle = (sid: string) => {
    if (readOnly) return;
    setStatusMap((prev) => {
      const cur = prev[sid] ?? "present";
      const ix = ORDER.indexOf(cur);
      const next = ORDER[(ix + 1) % ORDER.length];
      return { ...prev, [sid]: next };
    });
  };

  const setAll = (st: Status) => {
    if (readOnly) return;
    const m: Record<string, Status> = {};
    students.forEach((s) => {
      m[s.id] = st;
    });
    setStatusMap(m);
  };

  const saveDraft = async () => {
    if (!session || readOnly) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({
        student_id: s.id,
        status: statusMap[s.id] ?? "present",
      }));
      await attendanceV2Api.upsertSessionRecords(session.id, records);
      Alert.alert(t("session.savedTitle"), t("session.savedDraft"));
    } catch (e: any) {
      Alert.alert(t("session.errorTitle"), e.message);
    } finally {
      setSaving(false);
    }
  };

  const finalize = async () => {
    if (!session || readOnly) return;
    Alert.alert(t("session.finalizeTitle"), t("session.finalizeBody"), [
      { text: t("session.cancel"), style: "cancel" },
      {
        text: t("session.finalize"),
        onPress: async () => {
          setSaving(true);
          try {
            const records = students.map((s) => ({
              student_id: s.id,
              status: statusMap[s.id] ?? "present",
            }));
            await attendanceV2Api.upsertSessionRecords(session.id, records);
            const r = await attendanceV2Api.finalizeSession(session.id);
            setSession(r.session);
            Alert.alert(t("session.doneTitle"), t("session.finalizedMsg"));
          } catch (e: any) {
            Alert.alert(t("session.errorTitle"), e.message);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const label = useMemo(() => className ?? t("session.classFallback"), [className, t]);

  if (!classId) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.muted}>{t("session.missingClass")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.dateTxt}>{date}</Text>
        {session && (
          <StatusChip
            label={t(`status.${session.status}`, { defaultValue: session.status })}
            variant={session.status === "finalized" ? "finalized" : "draft"}
          />
        )}
        {readOnly && <Text style={styles.ro}>{t("session.readOnly")}</Text>}
      </View>

      <View style={styles.bulk}>
        <TouchableOpacity style={styles.bulkBtn} onPress={() => setAll("present")} disabled={readOnly}>
          <Text style={styles.bulkTxt}>{t("session.allPresent")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkBtn} onPress={() => setAll("absent")} disabled={readOnly}>
          <Text style={styles.bulkTxt}>{t("session.allAbsent")}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {students.map((s) => {
            const st = statusMap[s.id] ?? "present";
            return (
              <TouchableOpacity
                key={s.id}
                style={styles.row}
                onPress={() => cycle(s.id)}
                disabled={readOnly}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.stName}>{s.name}</Text>
                  <Text style={styles.stMeta}>{s.admission_number}</Text>
                </View>
                <View style={[styles.pill, { borderColor: colorFor(st) }]}>
                  <Text style={[styles.pillTxt, { color: colorFor(st) }]}>
                    {t(`status.${st}`, { defaultValue: st })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {!readOnly && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondary} onPress={saveDraft} disabled={saving}>
            <Text style={styles.secondaryTxt}>{saving ? "…" : t("session.saveDraft")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primary} onPress={finalize} disabled={saving}>
            <Text style={styles.primaryTxt}>{t("session.finalize")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function colorFor(s: Status): string {
  switch (s) {
    case "present":
      return Colors.success;
    case "absent":
      return Colors.error;
    case "late":
      return Colors.warning;
    default:
      return Colors.primary;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  back: { padding: Spacing.sm },
  title: { flex: 1, fontSize: 18, fontWeight: "700" },
  meta: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  dateTxt: { fontSize: 15, fontWeight: "600" },
  ro: { fontSize: 12, color: Colors.warning },
  bulk: { flexDirection: "row", gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  bulkBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  bulkTxt: { fontSize: 13, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  stName: { fontSize: 16, fontWeight: "600" },
  stMeta: { fontSize: 12, color: Colors.textSecondary },
  pill: {
    borderWidth: 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Layout.borderRadius.md,
    minWidth: 88,
    alignItems: "center",
  },
  pillTxt: { fontWeight: "800", textTransform: "capitalize" },
  footer: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  secondary: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: "center",
  },
  secondaryTxt: { color: Colors.primary, fontWeight: "700" },
  primary: { flex: 1, padding: Spacing.md, borderRadius: Layout.borderRadius.md, backgroundColor: Colors.primary, alignItems: "center" },
  primaryTxt: { color: "#fff", fontWeight: "700" },
  muted: { padding: Spacing.lg, color: Colors.textSecondary },
});
