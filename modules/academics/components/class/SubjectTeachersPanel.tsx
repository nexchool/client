import React, { useEffect, useMemo, useState } from "react";
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
import type { ClassSubjectOffering, SubjectTeacherAssignment } from "../../types";
import { StatusChip } from "../StatusChip";
import { teacherService } from "@/modules/teachers/services/teacherService";
import type { Teacher } from "@/modules/teachers/types";

type Props = { classId: string; canManage: boolean };

export function SubjectTeachersPanel({ classId, canManage }: Props) {
  const { t } = useTranslation("classes");
  const { palette, spacing, radius } = useTheme();
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
      const res = await teacherService.getTeachers({ status: "active" });
      setTeachers(res.items);
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
      const res = await teacherService.getTeachers({ status: "active" });
      setTeachers(res.items);
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
    } catch (e) {
      Alert.alert(t("panels.subjectTeachers.errorTitle"), e instanceof Error ? e.message : String(e));
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
          } catch (e) {
            Alert.alert(t("panels.subjectTeachers.errorTitle"), e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);
  };

  if (loading && assignments.length === 0 && offerings.length === 0) {
    return (
      <View style={[styles.center, { padding: spacing.lg }]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View>
      <View style={[styles.head, { marginBottom: spacing.sm }]}>
        <Text variant="bodySm" color="onSurfaceVariant" style={{ flex: 1, marginRight: spacing.sm }}>
          {t("panels.subjectTeachers.hint")}
        </Text>
        {canManage && (
          <PressScale style={styles.addBtn} onPress={openCreate} disabled={offerings.length === 0}>
            <AppIcon name="add" size="sm" color={offerings.length ? "primary" : "outline"} />
            <Text variant="labelMd" color={offerings.length ? "primary" : "outline"}>
              {t("panels.subjectTeachers.assign")}
            </Text>
          </PressScale>
        )}
      </View>
      {assignments.length === 0 ? (
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ fontStyle: "italic" }}>
          {t("panels.subjectTeachers.empty")}
        </Text>
      ) : (
        assignments.map((a) => (
          <View key={a.id} style={[styles.row, { paddingVertical: spacing.sm, borderBottomColor: palette.surfaceContainerHighest }]}>
            <View style={{ flex: 1 }}>
              <Text variant="labelLg" color="onSurface">
                {subjectName.get(a.class_subject_id) ?? t("panels.subjectTeachers.subjectFallback")}
              </Text>
              <Text variant="bodySm" color="onSurfaceVariant" style={{ marginTop: 2 }}>{a.teacher_name ?? a.teacher_id}</Text>
              <View style={styles.badges}>
                <StatusChip label={roleLabel(a.role)} variant={a.role === "primary" ? "primary" : "assistant"} />
                <StatusChip
                  label={a.is_active ? t("panels.subjectTeachers.statusActive") : t("panels.subjectTeachers.statusInactive")}
                  variant={a.is_active ? "active" : "inactive"}
                />
              </View>
              {(a.effective_from || a.effective_to) && (
                <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: 4 }}>
                  {a.effective_from?.slice(0, 10) ?? "…"} → {a.effective_to?.slice(0, 10) ?? "…"}
                </Text>
              )}
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

      <Modal visible={modalOpen} animationType="slide" presentationStyle="formSheet">
        <ScrollView style={[styles.modal, { padding: spacing.lg, backgroundColor: palette.surface }]} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={[styles.modalHeader, { marginBottom: spacing.md }]}>
            <Text variant="headlineMd" color="onSurface">
              {editing ? t("panels.subjectTeachers.modalEdit") : t("panels.subjectTeachers.modalAssign")}
            </Text>
            <AppIcon name="close" size="lg" color="onSurface" onPress={() => setModalOpen(false)} />
          </View>
          <Text variant="labelLg" color="onSurface" style={{ marginTop: spacing.md }}>{t("panels.subjectTeachers.classSubjectLabel")}</Text>
          <View style={[styles.chips, { marginTop: spacing.xs }]}>
            {offerings.map((o) => {
              const on = csId === o.id;
              return (
                <PressScale
                  key={o.id}
                  style={[styles.chip, { borderRadius: radius.sm, borderColor: on ? palette.primary : palette.outlineVariant, backgroundColor: on ? palette.primaryContainer : "transparent" }]}
                  onPress={() => setCsId(o.id)}
                >
                  <Text variant="bodySm" color={on ? "onPrimaryContainer" : "onSurface"}>{o.subject_name}</Text>
                </PressScale>
              );
            })}
          </View>
          <Text variant="labelLg" color="onSurface" style={{ marginTop: spacing.md }}>{t("panels.subjectTeachers.teacherLabel")}</Text>
          <View style={[styles.chips, { marginTop: spacing.xs }]}>
            {teachers.map((teacher) => {
              const on = tid === teacher.id;
              return (
                <PressScale
                  key={teacher.id}
                  style={[styles.chip, { borderRadius: radius.sm, borderColor: on ? palette.primary : palette.outlineVariant, backgroundColor: on ? palette.primaryContainer : "transparent" }]}
                  onPress={() => setTid(teacher.id)}
                >
                  <Text variant="bodySm" color={on ? "onPrimaryContainer" : "onSurface"} numberOfLines={1}>
                    {teacher.name}
                  </Text>
                </PressScale>
              );
            })}
          </View>
          <Text variant="labelLg" color="onSurface" style={{ marginTop: spacing.md }}>{t("panels.subjectTeachers.roleLabel")}</Text>
          <View style={[styles.rowRoles, { marginTop: spacing.sm }]}>
            {(["primary", "assistant", "guest"] as const).map((r) => {
              const on = role === r;
              return (
                <PressScale
                  key={r}
                  style={[styles.roleBtn, { borderRadius: radius.sm, borderColor: on ? palette.primary : palette.outlineVariant, backgroundColor: on ? palette.primaryContainer : "transparent" }]}
                  onPress={() => setRole(r)}
                >
                  <Text variant="bodySm" color={on ? "onPrimaryContainer" : "onSurface"}>{roleLabel(r)}</Text>
                </PressScale>
              );
            })}
          </View>
          <PressScale
            style={[styles.primaryBtn, { backgroundColor: palette.primary, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.xl }]}
            onPress={save}
            disabled={saving}
          >
            <Text variant="labelLg" color="onPrimary">{saving ? t("panels.subjectTeachers.saving") : t("panels.subjectTeachers.save")}</Text>
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
  row: { flexDirection: "row", borderBottomWidth: 1 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  actions: { flexDirection: "row", gap: 12, alignItems: "center" },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 8, paddingVertical: 8, borderWidth: 1, maxWidth: "100%" },
  rowRoles: { flexDirection: "row", gap: 8 },
  roleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1 },
  primaryBtn: { alignItems: "center" },
});
