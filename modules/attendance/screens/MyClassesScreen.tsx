import React from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { useEligibleAttendanceClasses } from "@/modules/academics/hooks/useAcademicQueries";
import type { EligibleClassItem } from "@/modules/academics/types";

export default function MyClassesScreen() {
  const { t } = useTranslation("attendance");
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const { data: items = [], isLoading, refetch, isRefetching } = useEligibleAttendanceClasses(today);

  const handleClassPress = (cls: EligibleClassItem) => {
    router.push({
      pathname: "/(protected)/attendance/session",
      params: { classId: cls.class_id, className: cls.class_name, date: today },
    } as any);
  };

  const renderClassItem = ({ item }: { item: EligibleClassItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleClassPress(item)} activeOpacity={0.7}>
      <View style={styles.cardIcon}>
        <Ionicons name="school" size={28} color={Colors.primary} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.class_name}</Text>
        <Text style={styles.cardDetail}>{item.reason.replace(/_/g, " ")}</Text>
      </View>
      <View style={styles.markButton}>
        <Text style={styles.markButtonText}>{t("myClasses.open")}</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("myClasses.title")}</Text>
      </View>

      {isLoading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.class_id}
          renderItem={renderClassItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="school-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>{t("myClasses.empty")}</Text>
              <Text style={styles.emptySubtext}>{t("myClasses.emptySub")}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backIcon: { padding: Spacing.sm },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "bold", color: Colors.text, marginLeft: Spacing.md },
  listContent: { padding: Spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "600", color: Colors.text },
  cardDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, textTransform: "capitalize" },
  markButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    gap: 4,
  },
  markButtonText: { fontSize: 14, fontWeight: "600", color: Colors.primary },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: Spacing.md, textAlign: "center" },
  emptySubtext: { fontSize: 14, color: Colors.textTertiary, marginTop: Spacing.xs, textAlign: "center" },
});
