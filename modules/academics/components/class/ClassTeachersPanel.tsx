import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { classAcademicApi } from "../../api/classAcademicApi";
import { qk } from "../../hooks/queryKeys";
import type { ClassTeacherAssignment } from "../../types";
import { StatusChip } from "../StatusChip";
import { teacherService } from "@/modules/teachers/services/teacherService";
import type { Teacher } from "@/modules/teachers/types";

type Props = { classId: string; canManage: boolean };

export function ClassTeachersPanel({ classId, canManage }: Props) {
  const { t } = useTranslation("classes");
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
      setTeachers(await teacherService.getTeachers({ status: "active" }));
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
      setTeachers(await teacherService.getTeachers({ status: "active" }));
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
    } catch (e: any) {
      Alert.alert(t("panels.classTeachers.errorTitle"), e.message);
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
          } catch (e: any) {
            Alert.alert(t("panels.classTeachers.errorTitle"), e.message);
          }
        },
      },
    ]);
  };

  if (loading && rows.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const primary = rows.find((r) => r.role === "primary" && r.is_active);

  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.hint}>{t("panels.classTeachers.hint")}</Text>
        {canManage && (
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={18} color={Colors.primary} />
            <Text style={styles.addTxt}>{t("panels.classTeachers.add")}</Text>
          </TouchableOpacity>
        )}
      </View>
      {primary && (
        <View style={styles.primaryBanner}>
          <Ionicons name="star" size={16} color={Colors.warning} />
          <Text style={styles.primaryTxt}>
            {t("panels.classTeachers.primaryBanner", {
              name: primary.teacher_name,
              suffix: primary.allow_attendance_marking ? t("panels.classTeachers.canMarkAttendance") : "",
            })}
          </Text>
        </View>
      )}
      {rows.length === 0 ? (
        <Text style={styles.empty}>{t("panels.classTeachers.empty")}</Text>
      ) : (
        rows.map((a) => (
          <View key={a.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{a.teacher_name}</Text>
              <Text style={styles.meta}>{a.employee_id}</Text>
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
                <TouchableOpacity onPress={() => openEdit(a)}>
                  <Ionicons name="create-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(a)}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}

      <Modal visible={open} animationType="slide" presentationStyle="formSheet">
        <ScrollView style={styles.modal} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editing ? t("panels.classTeachers.modalEdit") : t("panels.classTeachers.modalAdd")}
            </Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>{t("panels.classTeachers.teacherLabel")}</Text>
          <View style={styles.chips}>
            {teachers.map((teacher) => (
              <TouchableOpacity
                key={teacher.id}
                style={[styles.chip, tid === teacher.id && styles.chipOn]}
                onPress={() => setTid(teacher.id)}
              >
                <Text style={[styles.chipTxt, tid === teacher.id && styles.chipTxtOn]} numberOfLines={1}>
                  {teacher.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>{t("panels.classTeachers.roleLabel")}</Text>
          <View style={styles.rowRoles}>
            {(["primary", "assistant"] as const).map((r) => (
              <TouchableOpacity key={r} style={[styles.roleBtn, role === r && styles.roleBtnOn]} onPress={() => setRole(r)}>
                <Text style={[styles.roleTxt, role === r && styles.roleTxtOn]}>
                  {r === "primary" ? t("panels.classTeachers.roleOptPrimary") : t("panels.classTeachers.roleOptAssistant")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {role === "assistant" && (
            <TouchableOpacity style={styles.toggleRow} onPress={() => setAllowAtt(!allowAtt)}>
              <Ionicons name={allowAtt ? "checkbox" : "square-outline"} size={22} color={Colors.primary} />
              <Text style={styles.toggleTxt}>{t("panels.classTeachers.allowAttendanceMarking")}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.primaryBtn} onPress={save} disabled={saving}>
            <Text style={styles.primaryBtnTxt}>{saving ? t("panels.classTeachers.saving") : t("panels.classTeachers.save")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { padding: Spacing.lg, alignItems: "center" },
  head: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.sm },
  hint: { flex: 1, fontSize: 13, color: Colors.textSecondary, marginRight: Spacing.sm },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  addTxt: { color: Colors.primary, fontWeight: "600" },
  primaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.warning + "18",
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Spacing.md,
  },
  primaryTxt: { fontSize: 13, color: Colors.text, flex: 1 },
  empty: { fontSize: 14, color: Colors.textSecondary, fontStyle: "italic" },
  row: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  name: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, color: Colors.textSecondary },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  actions: { flexDirection: "row", gap: 12 },
  modal: { flex: 1, padding: Spacing.lg, backgroundColor: Colors.background },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.md },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "600", marginTop: Spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipOn: { borderColor: Colors.primary, backgroundColor: Colors.primary + "12" },
  chipTxt: { fontSize: 13 },
  chipTxtOn: { color: Colors.primary, fontWeight: "700" },
  rowRoles: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  roleBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  roleBtnOn: { borderColor: Colors.primary, backgroundColor: Colors.primary + "12" },
  roleTxt: { fontSize: 13 },
  roleTxtOn: { color: Colors.primary, fontWeight: "700" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: Spacing.lg },
  toggleTxt: { fontSize: 14 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  primaryBtnTxt: { color: "#fff", fontWeight: "700" },
});
