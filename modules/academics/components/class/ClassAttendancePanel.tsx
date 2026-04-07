import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { attendanceV2Api } from "../../api/attendanceV2Api";
import type { AttendanceSessionV2 } from "../../types";
import { StatusChip } from "../StatusChip";

type Props = {
  classId: string;
  classLabel: string;
  canMark: boolean;
  canViewHistory: boolean;
};

export function ClassAttendancePanel({ classId, classLabel, canMark, canViewHistory }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<AttendanceSessionV2[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!canViewHistory) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await attendanceV2Api.getClassHistory(classId);
      setItems(r.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [classId, canViewHistory]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <View>
      {canMark && (
        <TouchableOpacity
          style={styles.cta}
          onPress={() =>
            router.push({
              pathname: "/(protected)/attendance/session",
              params: { classId, className: classLabel, date: today },
            } as any)
          }
        >
          <Ionicons name="checkbox-outline" size={22} color="#fff" />
          <Text style={styles.ctaTxt}>Mark attendance (today)</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      )}
      {!canViewHistory ? (
        <Text style={styles.muted}>You do not have permission to view class attendance history.</Text>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <>
          <Text style={styles.sub}>Recent sessions</Text>
          <FlatList
            data={items.slice(0, 30)}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.date}>{item.session_date}</Text>
                  <StatusChip
                    label={item.status}
                    variant={item.status === "finalized" ? "finalized" : "draft"}
                  />
                </View>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/(protected)/attendance/session",
                      params: {
                        classId,
                        className: classLabel,
                        date: item.session_date?.slice(0, 10) ?? today,
                      },
                    } as any)
                  }
                >
                  <Text style={styles.open}>Open</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.muted}>No sessions recorded yet.</Text>}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.lg,
  },
  ctaTxt: { flex: 1, color: "#fff", fontWeight: "700", fontSize: 16 },
  sub: { fontSize: 13, fontWeight: "700", color: Colors.textSecondary, marginBottom: Spacing.sm },
  center: { padding: Spacing.md, alignItems: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  date: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  open: { color: Colors.primary, fontWeight: "600" },
  muted: { fontSize: 14, color: Colors.textSecondary, fontStyle: "italic" },
});
