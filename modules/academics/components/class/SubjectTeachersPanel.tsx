import React, { useEffect, useMemo, useState } from "react";
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
import type { ClassSubjectOffering, SubjectTeacherAssignment } from "../../types";
import { StatusChip } from "../StatusChip";
import { teacherService } from "@/modules/teachers/services/teacherService";
import type { Teacher } from "@/modules/teachers/types";

type Props = { classId: string; canManage: boolean };

export function SubjectTeachersPanel({ classId, canManage }: Props) {
  const { t } = useTranslation("classes");
  const qc = useQueryClient();
  const [offerings, setOfferings] = useState<ClassSubjectOffering[]>([]);
  const [assignments, setAssignments] = useState<SubjectTeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectTeacherAssignment | null>(null);
  const [csId, setCsId] = useState("");
  const [tid, setTid] = useState("");
  const [role, setRole] = useState<"primary" | "assistant" | "guest">("primary");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [o, a] = await Promise.all([
        classAcademicApi.listClassSubjects(classId),
        classAcademicApi.listSubjectTeachers(classId),
      ]);
      setOfferings(o.items.filter((x) => x.status === "active"));
      setAssignments(a.items);
    } catch {
      setOfferings([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [classId]);

  const subjectName = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of offerings) m.set(o.id, o.subject_name ?? o.subject_id);
    return m;
  }, [offerings]);

  const roleLabel = (r: string) =>
    r === "primary"
      ? t("panels.subjectTeachers.rolePrimary")
      : r === "assistant"
        ? t("panels.subjectTeachers.roleAssistant")
        : t("panels.subjectTeachers.roleGuest");

  const openCreate = async () => {
    setEditing(null);
    setCsId(offerings[0]?.id ?? "");
    setTid("");
    setRole("primary");
    try {
      const t = await teacherService.getTeachers({ status: "active" });
      setTeachers(t);
    } catch {
      setTeachers([]);
    }
    setModalOpen(true);
  };

  const openEdit = async (row: SubjectTeacherAssignment) => {
    setEditing(row);
    setCsId(row.class_subject_id);
    setTid(row.teacher_id);
    setRole(row.role as "primary" | "assistant" | "guest");
    try {
      const t = await teacherService.getTeachers({ status: "active" });
      setTeachers(t);
    } catch {
      setTeachers([]);
    }
    setModalOpen(true);
  };

  const save = async () => {
    if (!csId || !tid) {
      Alert.alert(t("detail.errorTitle"), t("panels.subjectTeachers.validation"));
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await classAcademicApi.patchSubjectTeacher(classId, editing.id, {
          teacher_id: tid,
          role,
          is_active: true,
        });
      } else {
        await classAcademicApi.createSubjectTeacher(classId, {
          class_subject_id: csId,
          teacher_id: tid,
          role,
        });
      }
      await qc.invalidateQueries({ queryKey: qk.subjectTeachers(classId) });
      await qc.invalidateQueries({ queryKey: qk.classSubjects(classId) });
      setModalOpen(false);
      load();
    } catch (e: any) {
      Alert.alert(t("panels.subjectTeachers.errorTitle"), e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = (row: SubjectTeacherAssignment) => {
    Alert.alert(t("panels.subjectTeachers.removeTitle"), t("panels.subjectTeachers.removeBody"), [
      { text: t("panels.subjectTeachers.cancel"), style: "cancel" },
      {
        text: t("panels.subjectTeachers.remove"),
        style: "destructive",
        onPress: async () => {
          try {
            await classAcademicApi.deleteSubjectTeacher(classId, row.id);
            await qc.invalidateQueries({ queryKey: qk.subjectTeachers(classId) });
            load();
          } catch (e: any) {
            Alert.alert(t("panels.subjectTeachers.errorTitle"), e.message);
          }
        },
      },
    ]);
  };

  if (loading && assignments.length === 0 && offerings.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.hint}>{t("panels.subjectTeachers.hint")}</Text>
        {canManage && (
          <TouchableOpacity style={styles.addBtn} onPress={openCreate} disabled={offerings.length === 0}>
            <Ionicons name="add" size={18} color={offerings.length ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.addTxt, offerings.length === 0 && { color: Colors.textTertiary }]}>
              {t("panels.subjectTeachers.assign")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {assignments.length === 0 ? (
        <Text style={styles.empty}>{t("panels.subjectTeachers.empty")}</Text>
      ) : (
        assignments.map((a) => (
          <View key={a.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subj}>
                {subjectName.get(a.class_subject_id) ?? t("panels.subjectTeachers.subjectFallback")}
              </Text>
              <Text style={styles.teacher}>{a.teacher_name ?? a.teacher_id}</Text>
              <View style={styles.badges}>
                <StatusChip label={roleLabel(a.role)} variant={a.role === "primary" ? "primary" : "assistant"} />
                <StatusChip
                  label={a.is_active ? t("panels.subjectTeachers.statusActive") : t("panels.subjectTeachers.statusInactive")}
                  variant={a.is_active ? "active" : "inactive"}
                />
              </View>
              {(a.effective_from || a.effective_to) && (
                <Text style={styles.dates}>
                  {a.effective_from?.slice(0, 10) ?? "…"} → {a.effective_to?.slice(0, 10) ?? "…"}
                </Text>
              )}
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

      <Modal visible={modalOpen} animationType="slide" presentationStyle="formSheet">
        <ScrollView style={styles.modal} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editing ? t("panels.subjectTeachers.modalEdit") : t("panels.subjectTeachers.modalAssign")}
            </Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>{t("panels.subjectTeachers.classSubjectLabel")}</Text>
          <View style={styles.chips}>
            {offerings.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={[styles.chip, csId === o.id && styles.chipOn]}
                onPress={() => setCsId(o.id)}
              >
                <Text style={[styles.chipTxt, csId === o.id && styles.chipTxtOn]}>{o.subject_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>{t("panels.subjectTeachers.teacherLabel")}</Text>
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
          <Text style={styles.label}>{t("panels.subjectTeachers.roleLabel")}</Text>
          <View style={styles.rowRoles}>
            {(["primary", "assistant", "guest"] as const).map((r) => (
              <TouchableOpacity key={r} style={[styles.roleBtn, role === r && styles.roleBtnOn]} onPress={() => setRole(r)}>
                <Text style={[styles.roleTxt, role === r && styles.roleTxtOn]}>{roleLabel(r)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={save} disabled={saving}>
            <Text style={styles.primaryBtnTxt}>{saving ? t("panels.subjectTeachers.saving") : t("panels.subjectTeachers.save")}</Text>
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
  empty: { fontSize: 14, color: Colors.textSecondary, fontStyle: "italic" },
  row: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  subj: { fontSize: 15, fontWeight: "700", color: Colors.text },
  teacher: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  dates: { fontSize: 11, color: Colors.textTertiary, marginTop: 4 },
  actions: { flexDirection: "row", gap: 12, alignItems: "center" },
  modal: { flex: 1, padding: Spacing.lg, backgroundColor: Colors.background },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.md },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "600", marginTop: Spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginTop: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxWidth: "100%",
  },
  chipOn: { borderColor: Colors.primary, backgroundColor: Colors.primary + "12" },
  chipTxt: { fontSize: 13, color: Colors.text },
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
  roleTxt: { fontSize: 13, color: Colors.text },
  roleTxtOn: { color: Colors.primary, fontWeight: "700" },
  primaryBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  primaryBtnTxt: { color: "#fff", fontWeight: "700" },
});
