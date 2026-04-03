import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { classAcademicApi } from "../../api/classAcademicApi";
import { qk } from "../../hooks/queryKeys";
import type { ClassSubjectOffering } from "../../types";
import { StatusChip } from "../StatusChip";
import { subjectService } from "@/modules/subjects/services/subjectService";
import { Subject } from "@/modules/subjects/types";

type Props = {
  classId: string;
  canManage: boolean;
};

export function ClassSubjectsPanel({ classId, canManage }: Props) {
  const qc = useQueryClient();
  const [items, setItems] = useState<ClassSubjectOffering[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [subjectsPool, setSubjectsPool] = useState<Subject[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<ClassSubjectOffering | null>(null);
  const [pickSubject, setPickSubject] = useState("");
  const [weekly, setWeekly] = useState("5");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await classAcademicApi.listClassSubjects(classId);
      setItems(r.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [classId]);

  const assignedSubjectIds = useMemo(() => new Set((items ?? []).map((i) => i.subject_id)), [items]);

  const openAdd = async () => {
    try {
      const subs = await subjectService.getSubjects();
      setSubjectsPool(subs.filter((s) => !assignedSubjectIds.has(s.id)));
    } catch {
      setSubjectsPool([]);
    }
    setPickSubject("");
    setWeekly("5");
    setModal("add");
  };

  const openEdit = (row: ClassSubjectOffering) => {
    setEditing(row);
    setWeekly(String(row.weekly_periods));
    setModal("edit");
  };

  const archive = (row: ClassSubjectOffering) => {
    Alert.alert("Remove subject", `Remove ${row.subject_name ?? "subject"} from this class?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await classAcademicApi.deleteClassSubject(classId, row.id);
            await qc.invalidateQueries({ queryKey: qk.classSubjects(classId) });
            load();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const submit = async () => {
    if (modal === "add") {
      if (!pickSubject) {
        Alert.alert("Validation", "Select a subject");
        return;
      }
      const w = parseInt(weekly, 10);
      if (!w || w < 1) {
        Alert.alert("Validation", "Weekly periods must be ≥ 1");
        return;
      }
      setSaving(true);
      try {
        await classAcademicApi.createClassSubject(classId, {
          subject_id: pickSubject,
          weekly_periods: w,
        });
        await qc.invalidateQueries({ queryKey: qk.classSubjects(classId) });
        setModal(null);
        load();
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setSaving(false);
      }
    } else if (modal === "edit" && editing) {
      const w = parseInt(weekly, 10);
      if (!w || w < 1) {
        Alert.alert("Validation", "Weekly periods must be ≥ 1");
        return;
      }
      setSaving(true);
      try {
        await classAcademicApi.patchClassSubject(classId, editing.id, { weekly_periods: w });
        await qc.invalidateQueries({ queryKey: qk.classSubjects(classId) });
        setModal(null);
        setEditing(null);
        load();
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading && !items) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const rows = items ?? [];

  return (
    <View>
      <View style={styles.headRow}>
        <Text style={styles.sectionHint}>Weekly periods and offering status for this class.</Text>
        {canManage && (
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Ionicons name="add" size={18} color={Colors.primary} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>No subjects linked to this class yet.</Text>
      ) : (
        rows.map((row) => (
          <View key={row.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{row.subject_name ?? "—"}</Text>
              {row.subject_code ? (
                <Text style={styles.meta}>Code: {row.subject_code}</Text>
              ) : null}
              <View style={styles.badges}>
                <Text style={styles.periodBadge}>{row.weekly_periods} / week</Text>
                <StatusChip
                  label={row.status === "active" ? "active" : row.status}
                  variant={row.status === "active" ? "active" : "inactive"}
                />
                {row.academic_term_name ? (
                  <Text style={styles.term}>Term: {row.academic_term_name}</Text>
                ) : null}
              </View>
            </View>
            {canManage && (
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(row)} hitSlop={8}>
                  <Ionicons name="create-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => archive(row)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}

      <Modal visible={modal !== null} animationType="slide" presentationStyle="formSheet">
        <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modal === "add" ? "Add subject" : "Edit subject"}</Text>
            <TouchableOpacity
              onPress={() => {
                setModal(null);
                setEditing(null);
              }}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          {modal === "add" && (
            <>
              <Text style={styles.label}>Subject *</Text>
              <View style={styles.chips}>
                {subjectsPool.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.chip, pickSubject === s.id && styles.chipOn]}
                    onPress={() => setPickSubject(s.id)}
                  >
                    <Text style={[styles.chipTxt, pickSubject === s.id && styles.chipTxtOn]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {subjectsPool.length === 0 ? (
                <Text style={styles.empty}>No available subjects to add.</Text>
              ) : null}
            </>
          )}
          {modal === "edit" && editing && (
            <Text style={styles.editSubjectName}>{editing.subject_name}</Text>
          )}
          <Text style={styles.label}>Weekly periods *</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={weekly}
            onChangeText={setWeekly}
          />
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={submit}
            disabled={saving}
          >
            <Text style={styles.primaryBtnTxt}>{saving ? "Saving…" : "Save"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { padding: Spacing.lg, alignItems: "center" },
  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.sm },
  sectionHint: { flex: 1, fontSize: 13, color: Colors.textSecondary, marginRight: Spacing.sm },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  addBtnText: { color: Colors.primary, fontWeight: "600" },
  empty: { fontSize: 14, color: Colors.textSecondary, fontStyle: "italic" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  name: { fontSize: 15, fontWeight: "600", color: Colors.text },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  badges: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 },
  periodBadge: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  term: { fontSize: 11, color: Colors.textTertiary },
  actions: { flexDirection: "row", gap: 12 },
  modalBody: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.md },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "600", marginTop: Spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginTop: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipOn: { borderColor: Colors.primary, backgroundColor: Colors.primary + "15" },
  chipTxt: { fontSize: 14, color: Colors.text },
  chipTxtOn: { color: Colors.primary, fontWeight: "700" },
  editSubjectName: { fontSize: 16, fontWeight: "600", marginTop: Spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    fontSize: 16,
    color: Colors.text,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  primaryBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
