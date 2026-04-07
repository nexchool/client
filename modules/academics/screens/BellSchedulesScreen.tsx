import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { bellScheduleApi, academicSettingsApi } from "../api/classAcademicApi";
import { qk } from "../hooks/queryKeys";
import type { BellScheduleListItem, BellSchedulePeriod } from "../types";
import { Protected } from "@/modules/permissions/components/Protected";
import * as PERMS from "@/modules/permissions/constants/permissions";

export default function BellSchedulesScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: qk.bellSchedules(),
    queryFn: async () => (await bellScheduleApi.list()).items,
  });
  const { data: settings } = useQuery({
    queryKey: qk.academicSettings(),
    queryFn: () => academicSettingsApi.get(),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: () => bellScheduleApi.create({ name }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.bellSchedules() });
      setCreateOpen(false);
      setName("");
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const setDefault = async (id: string) => {
    try {
      await academicSettingsApi.patch({ default_bell_schedule_id: id });
      await qc.invalidateQueries({ queryKey: qk.academicSettings() });
      Alert.alert("Updated", "Default bell schedule saved.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const defaultId = (settings?.default_bell_schedule_id as string | undefined) ?? undefined;

  const renderItem = ({ item }: { item: BellScheduleListItem }) => (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardMain} onPress={() => setDetailId(item.id)} activeOpacity={0.75}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.is_default ? <Text style={styles.badge}>template default</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
      {defaultId === item.id ? (
        <Text style={styles.defaultLbl}>tenant default</Text>
      ) : (
        <Protected anyPermissions={[PERMS.ACADEMICS_MANAGE, PERMS.CLASS_MANAGE]}>
          <TouchableOpacity onPress={() => setDefault(item.id)} style={styles.setDefWrap}>
            <Text style={styles.link}>Set default</Text>
          </TouchableOpacity>
        </Protected>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Bell schedules</Text>
        <Protected anyPermissions={[PERMS.ACADEMICS_MANAGE, PERMS.TIMETABLE_MANAGE]}>
          <TouchableOpacity onPress={() => setCreateOpen(true)}>
            <Ionicons name="add-circle-outline" size={28} color={Colors.primary} />
          </TouchableOpacity>
        </Protected>
      </View>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: Spacing.lg }}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No bell schedules yet.</Text>}
        />
      )}

      <Modal visible={createOpen} animationType="slide" presentationStyle="formSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>New bell schedule</Text>
          <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => name.trim() && createMut.mutate()}
            disabled={!name.trim() || createMut.isPending}
          >
            <Text style={styles.primaryTxt}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCreateOpen(false)}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {detailId && (
        <BellDetailModal id={detailId} onClose={() => setDetailId(null)} />
      )}
    </SafeAreaView>
  );
}

function BellDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: qk.bellSchedule(id),
    queryFn: () => bellScheduleApi.get(id),
  });

  const [pOpen, setPOpen] = useState(false);
  const [pNum, setPNum] = useState("1");
  const [pKind, setPKind] = useState("lesson");
  const [pLabel, setPLabel] = useState("");
  const [pStart, setPStart] = useState("09:00");
  const [pEnd, setPEnd] = useState("09:45");

  const addPeriod = async () => {
    try {
      await bellScheduleApi.createPeriod(id, {
        period_number: parseInt(pNum, 10) || 1,
        period_kind: pKind,
        label: pLabel || null,
        starts_at: pStart,
        ends_at: pEnd,
        sort_order: parseInt(pNum, 10) || 1,
      });
      await qc.invalidateQueries({ queryKey: qk.bellSchedule(id) });
      setPOpen(false);
      refetch();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const removePeriod = (pid: string) => {
    Alert.alert("Delete period", "Remove this period?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await bellScheduleApi.deletePeriod(id, pid);
            await qc.invalidateQueries({ queryKey: qk.bellSchedule(id) });
            refetch();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {data?.name ?? "Schedule"}
          </Text>
          <TouchableOpacity onPress={() => setPOpen(true)}>
            <Ionicons name="add" size={26} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        {isLoading || !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={Colors.primary} />
        ) : (
          <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
            {(data.periods ?? []).map((p: BellSchedulePeriod) => (
              <View key={p.id} style={styles.periodRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pTitle}>
                    #{p.period_number} · {p.label || p.period_kind}
                  </Text>
                  <Text style={styles.pMeta}>
                    {p.period_kind} · {String(p.starts_at).slice(11, 16) || p.starts_at} –{" "}
                    {String(p.ends_at).slice(11, 16) || p.ends_at}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removePeriod(p.id)}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <Modal visible={pOpen} transparent animationType="fade">
          <View style={styles.pModalBg}>
            <View style={styles.pModal}>
              <Text style={styles.modalTitle}>Add period</Text>
              <Text style={styles.label}>Number</Text>
              <TextInput style={styles.input} keyboardType="number-pad" value={pNum} onChangeText={setPNum} />
              <Text style={styles.label}>Kind (lesson/break/lunch/assembly)</Text>
              <TextInput style={styles.input} value={pKind} onChangeText={setPKind} />
              <Text style={styles.label}>Label</Text>
              <TextInput style={styles.input} value={pLabel} onChangeText={setPLabel} />
              <Text style={styles.label}>Start / End (HH:MM)</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput style={[styles.input, { flex: 1 }]} value={pStart} onChangeText={setPStart} />
                <TextInput style={[styles.input, { flex: 1 }]} value={pEnd} onChangeText={setPEnd} />
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={addPeriod}>
                <Text style={styles.primaryTxt}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPOpen(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  back: { padding: Spacing.sm },
  title: { flex: 1, fontSize: 20, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center" },
  card: {
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  setDefWrap: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  badge: { fontSize: 11, color: Colors.textTertiary },
  defaultLbl: { fontSize: 12, color: Colors.success, fontWeight: "600" },
  link: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  empty: { textAlign: "center", color: Colors.textSecondary, marginTop: Spacing.xl },
  modal: { padding: Spacing.xl, paddingTop: 60 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: Spacing.md },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
  },
  primaryTxt: { color: "#fff", fontWeight: "700" },
  cancel: { textAlign: "center", marginTop: Spacing.md, color: Colors.primary },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pTitle: { fontSize: 15, fontWeight: "600" },
  pMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  pModalBg: {
    flex: 1,
    backgroundColor: "#0008",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  pModal: { backgroundColor: Colors.background, borderRadius: Layout.borderRadius.lg, padding: Spacing.lg },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
});
