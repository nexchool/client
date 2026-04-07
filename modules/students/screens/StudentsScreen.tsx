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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStudents } from "../hooks/useStudents";
import { StudentListItem } from "../components/StudentListItem";
import { CreateStudentModal } from "../components/CreateStudentModal";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import { useAcademicYearContext } from "@/modules/academics/context/AcademicYearContext";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { Student } from "../types";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function StudentsScreen() {
  const { t } = useTranslation("students");
  const router = useRouter();
  const {
    students,
    currentStudent,
    loading,
    fetchStudents,
    fetchMyProfile,
    createStudent,
  } = useStudents();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { selectedAcademicYearId } = useAcademicYearContext();
  const params = useLocalSearchParams();

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Check permissions
  const canViewAll = hasAnyPermission([
    PERMS.STUDENT_READ_ALL,
    PERMS.STUDENT_READ_CLASS,
  ]);
  const canViewSelf = hasPermission(PERMS.STUDENT_READ_SELF);
  const canCreate = hasPermission(PERMS.STUDENT_CREATE);

  useEffect(() => {
    loadData();
  }, [canViewAll, canViewSelf, debouncedSearch, selectedAcademicYearId]);

  useEffect(() => {
    // Check if navigated with Create intent
    if (params.action === "create" && canCreate) {
      setModalVisible(true);
    }
  }, [params.action, canCreate]);

  const loadData = () => {
    if (canViewAll) {
      fetchStudents({
        search: debouncedSearch || undefined,
        academic_year_id: selectedAcademicYearId || undefined,
      });
    } else if (canViewSelf) {
      fetchMyProfile();
    }
  };

  const handleStudentPress = (student: Student) => {
    router.push(`/students/${student.id}` as any);
  };

  const handleCreateStudent = async (data: any) => {
    try {
      const response = await createStudent(data);
      setModalVisible(false);
      
      // Show credentials if generated
      if (response.credentials) {
        Alert.alert(
          t("list.credentialTitle"),
          t("list.credentialBody", {
            username: response.credentials.username,
            email: response.credentials.email,
            password: response.credentials.password,
          }),
          [{ text: t("list.ok") }],
        );
      } else {
        Alert.alert(t("list.success"), t("list.createdSimple"));
      }
      
      // Refresh list
      if (canViewAll) {
        fetchStudents();
      }
    } catch (error: any) {
      throw error;
    }
  };

  const renderContent = () => {
    if (loading && students.length === 0 && !currentStudent) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (canViewAll) {
      return (
        <>
          {/* Search Bar */}
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

          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StudentListItem
                student={item}
                onPress={handleStudentPress}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={loadData} />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>
                  {searchQuery ? t("list.emptySearch") : t("list.empty")}
                </Text>
              </View>
            }
          />
        </>
      );
    }

    if (canViewSelf && currentStudent) {
      return (
        <View style={styles.profileContainer}>
          <Text style={styles.profileTitle}>{t("list.myProfileTitle")}</Text>
          <View style={styles.card}>
            <Text style={styles.label}>{t("list.labelName")}</Text>
            <Text style={styles.value}>{currentStudent.name}</Text>

            <Text style={styles.label}>{t("list.labelAdmissionNo")}</Text>
            <Text style={styles.value}>{currentStudent.admission_number}</Text>

            <Text style={styles.label}>{t("list.labelClass")}</Text>
            <Text style={styles.value}>
              {currentStudent.class_name || t("list.notAssigned")}
            </Text>

            <Text style={styles.label}>{t("list.labelEmail")}</Text>
            <Text style={styles.value}>{currentStudent.email}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t("list.noPermission")}</Text>
      </View>
    );
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

      {renderContent()}

      {canCreate && (
        <CreateStudentModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={handleCreateStudent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
  },
  addButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
  },
  listContent: {
    padding: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
  },
  profileContainer: {
    padding: Spacing.lg,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.lg,
    color: Colors.text,
  },
  card: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
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
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    padding: Spacing.sm,
  },
});
