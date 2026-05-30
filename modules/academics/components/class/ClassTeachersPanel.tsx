import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { classAcademicApi } from "../../api/classAcademicApi";
import { qk } from "../../hooks/queryKeys";
import type { ClassTeacherAssignment } from "../../types";
import { StatusChip } from "../StatusChip";
import { teacherService } from "@/modules/teachers/services/teacherService";
import type { Teacher } from "@/modules/teachers/types";

type Props = { classId: string; canManage: boolean };

export function ClassTeachersPanel({ classId, canManage }: Props) {
  const { t } = useTranslation("classes");
  const { palette, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const [rows, setRows] = useState<ClassTeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassTeacherAssignment | null>(null);
  const [tid, setTid] = useState("");
  const [role, setRole] = useState<"primary" | "assistant">("assistant");
  const [allowAtt, setAllowAtt] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await classAcademicApi.listClassTeachers(classId);
      setRows(r.items);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [classId]);

  const openCreate = async () => {
    setEditing(null);
    setTid("");
    setRole("assistant");
    setAllowAtt(false);
    try {
      setTeachers((await teacherService.getTeachers({ status: "active" })).items);
    } catch {
      setTeachers([]);
    }
    setOpen(true);
  };

  const openEdit = async (a: ClassTeacherAssignment) => {
    setEditing(a);
    setTid(a.teacher_id);
    setRole(a.role as "primary" | "assistant");
    setAllowAtt(a.allow_attendance_marking);
    try {
      setTeachers((await teacherService.getTeachers({ status: "active" })).items);
    } catch {
      setTeachers([]);
    }
    setOpen(true);
  };

  const save = async () => {
    if (!tid) {
      Alert.alert(t("detail.errorTitle"), t("panels.classTeachers.validation"));
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await classAcademicApi.patchClassTeacher(classId, editing.id, {
          teacher_id: tid,
          role,
          allow_attendance_marking: role === "primary" ? true : allowAtt,
        });
      } else {
        await classAcademicApi.createClassTeacher(classId, {
          teacher_id: tid,
          role,
          allow_attendance_marking: role === "primary" ? true : allowAtt,
        });
      }
      await qc.invalidateQueries({ queryKey: qk.classTeachers(classId) });
      setOpen(false);
      load();
    } catch (e) {
      Alert.alert(t("panels.classTeachers.errorTitle"), e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = (a: ClassTeacherAssignment) => {
    Alert.alert(t("panels.classTeachers.removeTitle"), t("panels.classTeachers.removeBody"), [
      { text: t("panels.classTeachers.cancel"), style: "cancel" },
      {
        text: t("panels.classTeachers.remove"),
        style: "destructive",
        onPress: async () => {
          try {
            await classAcademicApi.deleteClassTeacher(classId, a.id);
            await qc.invalidateQueries({ queryKey: qk.classTeachers(classId) });
            load();
          } catch (e) {
            Alert.alert(t("panels.classTeachers.errorTitle"), e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);
  };

  if (loading && rows.length === 0) {
    return (
      <View style={[styles.center, { padding: spacing.lg }]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  const primary = rows.find((r) => r.role === "primary" && r.is_active);

  return (
    <View>
      <View style={[styles.head, { marginBottom: spacing.sm }]}>
        <Text variant="bodySm" color="onSurfaceVariant" style={{ flex: 1, marginRight: spacing.sm }}>
          {t("panels.classTeachers.hint")}
        </Text>
        {canManage && (
          <PressScale style={styles.addBtn} onPress={openCreate}>
            <AppIcon name="add" size="sm" color="primary" />
            <Text variant="labelMd" color="primary">{t("panels.classTeachers.add")}</Text>
          </PressScale>
        )}
      </View>
      {primary && (
        <View
          style={[
            styles.primaryBanner,
            { backgroundColor: palette.surfaceContainerLow, padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.md },
          ]}
        >
          <AppIcon name="star" size="sm" color="warning" />
          <Text variant="bodySm" color="onSurface" style={{ flex: 1 }}>
            {t("panels.classTeachers.primaryBanner", {
              name: primary.teacher_name,
              suffix: primary.allow_attendance_marking ? t("panels.classTeachers.canMarkAttendance") : "",
            })}
          </Text>
        </View>
      )}
      {rows.length === 0 ? (
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ fontStyle: "italic" }}>
          {t("panels.classTeachers.empty")}
        </Text>
      ) : (
        rows.map((a) => (
          <View key={a.id} style={[styles.row, { paddingVertical: spacing.sm, borderBottomColor: palette.surfaceContainerHighest }]}>
            <View style={{ flex: 1 }}>
              <Text variant="labelLg" color="onSurface">{a.teacher_name}</Text>
              <Text variant="labelSm" color="onSurfaceVariant">{a.employee_id}</Text>
              <View style={styles.badges}>
                <StatusChip
                  label={a.role === "primary" ? t("panels.classTeachers.roleOptPrimary") : t("panels.classTeachers.roleOptAssistant")}
                  variant={a.role === "primary" ? "primary" : "assistant"}
                />
                <StatusChip
                  label={a.allow_attendance_marking ? t("panels.classTeachers.chipAttendanceOk") : t("panels.classTeachers.chipNoAttendance")}
                  variant={a.allow_attendance_marking ? "active" : "inactive"}
                />
                <StatusChip
                  label={a.is_active ? t("panels.classTeachers.statusActive") : t("panels.classTeachers.statusInactive")}
                  variant={a.is_active ? "active" : "inactive"}
                />
              </View>
            </View>
            {canManage && (
              <View style={styles.actions}>
                <AppIcon name="create-outline" size="lg" color="primary" onPress={() => openEdit(a)} />
                <AppIcon name="trash-outline" size="lg" color="error" onPress={() => remove(a)} />
              </View>
            )}
          </View>
        ))
      )}

      <Modal visible={open} animationType="slide" presentationStyle="formSheet">
        <ScrollView style={[styles.modal, { padding: spacing.lg, backgroundColor: palette.surface }]} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={[styles.modalHeader, { marginBottom: spacing.md }]}>
            <Text variant="headlineMd" color="onSurface">
              {editing ? t("panels.classTeachers.modalEdit") : t("panels.classTeachers.modalAdd")}
            </Text>
            <AppIcon name="close" size="lg" color="onSurface" onPress={() => setOpen(false)} />
          </View>
          <Text variant="labelLg" color="onSurface" style={{ marginTop: spacing.md }}>{t("panels.classTeachers.teacherLabel")}</Text>
          <View style={[styles.chips, { marginTop: spacing.xs }]}>
            {teachers.map((teacher) => {
              const on = tid === teacher.id;
              return (
                <PressScale
                  key={teacher.id}
                  style={[
                    styles.chip,
                    { borderRadius: radius.sm, borderColor: on ? palette.primary : palette.outlineVariant, backgroundColor: on ? palette.primaryContainer : "transparent" },
                  ]}
                  onPress={() => setTid(teacher.id)}
                >
                  <Text variant="bodySm" color={on ? "onPrimaryContainer" : "onSurface"} numberOfLines={1}>
                    {teacher.name}
                  </Text>
                </PressScale>
              );
            })}
          </View>
          <Text variant="labelLg" color="onSurface" style={{ marginTop: spacing.md }}>{t("panels.classTeachers.roleLabel")}</Text>
          <View style={[styles.rowRoles, { marginTop: spacing.sm }]}>
            {(["primary", "assistant"] as const).map((r) => {
              const on = role === r;
              return (
                <PressScale
                  key={r}
                  style={[
                    styles.roleBtn,
                    { borderRadius: radius.sm, borderColor: on ? palette.primary : palette.outlineVariant, backgroundColor: on ? palette.primaryContainer : "transparent" },
                  ]}
                  onPress={() => setRole(r)}
                >
                  <Text variant="bodySm" color={on ? "onPrimaryContainer" : "onSurface"}>
                    {r === "primary" ? t("panels.classTeachers.roleOptPrimary") : t("panels.classTeachers.roleOptAssistant")}
                  </Text>
                </PressScale>
              );
            })}
          </View>
          {role === "assistant" && (
            <PressScale style={[styles.toggleRow, { marginTop: spacing.lg }]} onPress={() => setAllowAtt(!allowAtt)}>
              <AppIcon name={allowAtt ? "checkbox" : "square-outline"} size="lg" color="primary" />
              <Text variant="bodyMd" color="onSurface">{t("panels.classTeachers.allowAttendanceMarking")}</Text>
            </PressScale>
          )}
          <PressScale
            style={[styles.primaryBtn, { backgroundColor: palette.primary, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.xl }]}
            onPress={save}
            disabled={saving}
          >
            <Text variant="labelLg" color="onPrimary">{saving ? t("panels.classTeachers.saving") : t("panels.classTeachers.save")}</Text>
          </PressScale>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center" },
  head: { flexDirection: "row", justifyContent: "space-between" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  primaryBanner: { flexDirection: "row", alignItems: "center", gap: 6 },
  row: { flexDirection: "row", borderBottomWidth: 1 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  actions: { flexDirection: "row", gap: 12 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 8, paddingVertical: 8, borderWidth: 1 },
  rowRoles: { flexDirection: "row", gap: 8 },
  roleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  primaryBtn: { alignItems: "center" },
});
