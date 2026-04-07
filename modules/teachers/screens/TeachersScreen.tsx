import React, { useEffect, useState } from "react";
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
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTeachers } from "../hooks/useTeachers";
import { TeacherListItem } from "../components/TeacherListItem";
import { CreateTeacherModal } from "../components/CreateTeacherModal";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { Teacher } from "../types";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function TeachersScreen() {
  const { t } = useTranslation("teachers");
  const router = useRouter();
  const { teachers, loading, fetchTeachers, createTeacher } = useTeachers();
  const { hasPermission } = usePermissions();

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const canCreate = hasPermission(PERMS.TEACHER_CREATE);

  useEffect(() => {
    fetchTeachers({ search: debouncedSearch || undefined });
  }, [debouncedSearch]);

  const handleTeacherPress = (teacher: Teacher) => {
    router.push(`/teachers/${teacher.id}` as any);
  };

  const handleCreateTeacher = async (data: any) => {
    try {
      const response = await createTeacher(data);
      setModalVisible(false);

      if (response.credentials) {
        Alert.alert(
          t("list.credentialTitle"),
          t("list.credentialBody", {
            employee_id: response.credentials.employee_id,
            email: response.credentials.email,
            password: response.credentials.password,
          }),
          [{ text: t("list.ok") }],
        );
      } else {
        Alert.alert(t("list.success"), t("list.createdSimple"));
      }

      fetchTeachers();
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("list.title")}</Text>
        {canCreate && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("list.searchPlaceholder")}
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading && teachers.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={teachers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TeacherListItem teacher={item} onPress={handleTeacherPress} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => fetchTeachers()} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {searchQuery ? t("list.emptySearch") : t("list.emptyNone")}
              </Text>
            </View>
          }
        />
      )}

      {canCreate && (
        <CreateTeacherModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={handleCreateTeacher}
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: Colors.text },
  addButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    margin: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: 16, color: Colors.text, padding: Spacing.sm },
  listContent: { padding: Spacing.md },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
});
