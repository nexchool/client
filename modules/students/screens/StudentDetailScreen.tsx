import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStudents } from "../hooks/useStudents";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { CreateStudentModal } from "../components/CreateStudentModal";
import { StudentDocumentsSection } from "../components/StudentDocumentsSection";

export default function StudentDetailScreen() {
  const { t } = useTranslation("students");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentStudent, loading, fetchStudent, updateStudent, deleteStudent } = useStudents();
  const { hasPermission } = usePermissions();
  const [editModalVisible, setEditModalVisible] = useState(false);

  const canUpdate = hasPermission(PERMS.STUDENT_UPDATE);
  const canDelete = hasPermission(PERMS.STUDENT_DELETE);

  useEffect(() => {
    if (id) {
      fetchStudent(id);
    }
  }, [id]);

  const handleUpdate = async (data: any) => {
    if (!id) return;

    try {
      await updateStudent(id, data);
      setEditModalVisible(false);
      Alert.alert(t("list.success"), t("detail.updated"));
      // Refresh data
      fetchStudent(id);
    } catch (error: any) {
      throw error;
    }
  };

  const handleBack = () => {
    router.back();
  };

  const confirmDelete = useCallback(() => {
    if (!currentStudent) return;
    Alert.alert(t("detail.deleteConfirmTitle"), t("detail.deleteConfirmMessage"), [
      { text: t("detail.cancel"), style: "cancel" },
      {
        text: t("detail.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteStudent(currentStudent.id);
            router.replace("/students" as never);
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : t("detail.deleteFailed");
            Alert.alert(t("detail.errorTitle"), msg);
          }
        },
      },
    ]);
  }, [currentStudent, deleteStudent, router, t]);

  if (loading && !currentStudent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentStudent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{t("detail.notFound")}</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>{t("detail.goBack")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("detail.title")}</Text>
        {canDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={confirmDelete}
          >
            <Ionicons name="trash-outline" size={24} color={Colors.error} />
          </TouchableOpacity>
        )}
        {canUpdate && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="create-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("detail.basicInfo")}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>{t("detail.fullName")}</Text>
            <Text style={styles.value}>{currentStudent.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>{t("detail.admissionNumber")}</Text>
            <Text style={styles.value}>{currentStudent.admission_number}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>{t("detail.academicYear")}</Text>
            <Text style={styles.value}>
              {currentStudent.academic_year || t("detail.notSet")}
            </Text>
          </View>

          {currentStudent.gender && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.gender")}</Text>
              <Text style={styles.value}>{currentStudent.gender}</Text>
            </View>
          )}

          {currentStudent.date_of_birth && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.dateOfBirth")}</Text>
              <Text style={styles.value}>{currentStudent.date_of_birth}</Text>
            </View>
          )}
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("detail.contactInfo")}</Text>

          {currentStudent.email && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.email")}</Text>
              <Text style={styles.value}>{currentStudent.email}</Text>
            </View>
          )}

          {currentStudent.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.phone")}</Text>
              <Text style={styles.value}>{currentStudent.phone}</Text>
            </View>
          )}

          {currentStudent.address && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.address")}</Text>
              <Text style={styles.value}>{currentStudent.address}</Text>
            </View>
          )}
        </View>

        {/* Guardian Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("detail.guardianInfo")}</Text>

          {currentStudent.guardian_name && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.guardianName")}</Text>
              <Text style={styles.value}>{currentStudent.guardian_name}</Text>
            </View>
          )}

          {currentStudent.guardian_relationship && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.relationship")}</Text>
              <Text style={styles.value}>{currentStudent.guardian_relationship}</Text>
            </View>
          )}

          {currentStudent.guardian_phone && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.guardianPhone")}</Text>
              <Text style={styles.value}>{currentStudent.guardian_phone}</Text>
            </View>
          )}

          {currentStudent.guardian_email && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.guardianEmail")}</Text>
              <Text style={styles.value}>{currentStudent.guardian_email}</Text>
            </View>
          )}
        </View>

        {/* Class Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("detail.classInfo")}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>{t("detail.currentClass")}</Text>
            <Text style={styles.value}>
              {currentStudent.class_name || t("detail.notAssigned")}
            </Text>
          </View>

          {currentStudent.roll_number && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.rollNumber")}</Text>
              <Text style={styles.value}>{currentStudent.roll_number}</Text>
            </View>
          )}
        </View>

        {/* Documents */}
        <StudentDocumentsSection studentId={currentStudent.id} />
      </ScrollView>

      {/* Edit Modal */}
      {canUpdate && (
        <CreateStudentModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          onSubmit={handleUpdate}
          initialData={currentStudent}
          mode="edit"
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
  backIcon: {
    padding: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
    marginLeft: Spacing.md,
  },
  editButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
  },
  deleteButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.sm,
  },
  infoRow: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
