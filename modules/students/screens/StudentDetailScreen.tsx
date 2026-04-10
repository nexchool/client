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
import { useAuthContext } from "@/modules/auth/context/AuthContext";

export default function StudentDetailScreen() {
  const { t } = useTranslation("students");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentStudent, loading, fetchStudent, updateStudent, deleteStudent } = useStudents();
  const { hasPermission } = usePermissions();
  const { isFeatureEnabled } = useAuthContext();
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

        {isFeatureEnabled("transport") && currentStudent.transport && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transport</Text>
            {currentStudent.transport.status != null && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Status</Text>
                <Text style={styles.value}>{String(currentStudent.transport.status)}</Text>
              </View>
            )}
            {currentStudent.transport.bus && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Bus</Text>
                <Text style={styles.value}>
                  {currentStudent.transport.bus.bus_number}
                  {currentStudent.transport.bus.vehicle_number
                    ? ` (${currentStudent.transport.bus.vehicle_number})`
                    : ""}
                </Text>
              </View>
            )}
            {currentStudent.transport.route && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Route</Text>
                <Text style={styles.value}>
                  {currentStudent.transport.route.name ?? "—"}
                </Text>
              </View>
            )}
            {(currentStudent.transport.pickup_point != null ||
              currentStudent.transport.pickup_stop != null) && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Pickup</Text>
                <Text style={styles.value}>
                  {currentStudent.transport.pickup_stop?.name ??
                    currentStudent.transport.pickup_point ??
                    "—"}
                </Text>
              </View>
            )}
            {(currentStudent.transport.drop_point != null ||
              currentStudent.transport.drop_stop != null) && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Drop</Text>
                <Text style={styles.value}>
                  {currentStudent.transport.drop_stop?.name ??
                    currentStudent.transport.drop_point ??
                    "—"}
                </Text>
              </View>
            )}
            {currentStudent.transport.driver && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Driver</Text>
                <Text style={styles.value}>
                  {currentStudent.transport.driver.name ?? "—"}
                  {currentStudent.transport.driver.phone
                    ? ` · ${currentStudent.transport.driver.phone}`
                    : ""}
                </Text>
              </View>
            )}
            {currentStudent.transport.helper && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Helper</Text>
                <Text style={styles.value}>
                  {(currentStudent.transport.helper as { name?: string }).name ?? "—"}
                  {(currentStudent.transport.helper as { phone?: string }).phone
                    ? ` · ${(currentStudent.transport.helper as { phone?: string }).phone}`
                    : ""}
                </Text>
              </View>
            )}
            {currentStudent.transport.monthly_fee != null && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Monthly fee</Text>
                <Text style={styles.value}>{String(currentStudent.transport.monthly_fee)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Parent / Family */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("detail.parentFamilyInfo")}</Text>
          {currentStudent.father_name && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.fatherName")}</Text>
              <Text style={styles.value}>{currentStudent.father_name}</Text>
            </View>
          )}
          {currentStudent.father_phone && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.fatherPhone")}</Text>
              <Text style={styles.value}>{currentStudent.father_phone}</Text>
            </View>
          )}
          {currentStudent.father_email && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.fatherEmail")}</Text>
              <Text style={styles.value}>{currentStudent.father_email}</Text>
            </View>
          )}
          {currentStudent.father_occupation && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.fatherOccupation")}</Text>
              <Text style={styles.value}>{currentStudent.father_occupation}</Text>
            </View>
          )}
          {(currentStudent.father_annual_income ?? null) !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.fatherAnnualIncome")}</Text>
              <Text style={styles.value}>{String(currentStudent.father_annual_income)}</Text>
            </View>
          )}

          {currentStudent.mother_name && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.motherName")}</Text>
              <Text style={styles.value}>{currentStudent.mother_name}</Text>
            </View>
          )}
          {currentStudent.mother_phone && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.motherPhone")}</Text>
              <Text style={styles.value}>{currentStudent.mother_phone}</Text>
            </View>
          )}
          {currentStudent.mother_email && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.motherEmail")}</Text>
              <Text style={styles.value}>{currentStudent.mother_email}</Text>
            </View>
          )}
          {currentStudent.mother_occupation && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.motherOccupation")}</Text>
              <Text style={styles.value}>{currentStudent.mother_occupation}</Text>
            </View>
          )}
          {(currentStudent.mother_annual_income ?? null) !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.motherAnnualIncome")}</Text>
              <Text style={styles.value}>{String(currentStudent.mother_annual_income)}</Text>
            </View>
          )}
        </View>

        {/* Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("detail.healthInfo")}</Text>
          {currentStudent.blood_group && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.bloodGroup")}</Text>
              <Text style={styles.value}>{currentStudent.blood_group}</Text>
            </View>
          )}
          {(currentStudent.height_cm ?? null) !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.heightCm")}</Text>
              <Text style={styles.value}>{String(currentStudent.height_cm)}</Text>
            </View>
          )}
          {(currentStudent.weight_kg ?? null) !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.weightKg")}</Text>
              <Text style={styles.value}>{String(currentStudent.weight_kg)}</Text>
            </View>
          )}
          {currentStudent.medical_allergies && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.medicalAllergies")}</Text>
              <Text style={styles.value}>{currentStudent.medical_allergies}</Text>
            </View>
          )}
          {currentStudent.medical_conditions && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.medicalConditions")}</Text>
              <Text style={styles.value}>{currentStudent.medical_conditions}</Text>
            </View>
          )}
          {currentStudent.disability_details && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.disabilityDetails")}</Text>
              <Text style={styles.value}>{currentStudent.disability_details}</Text>
            </View>
          )}
          {currentStudent.identification_marks && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.identificationMarks")}</Text>
              <Text style={styles.value}>{currentStudent.identification_marks}</Text>
            </View>
          )}
        </View>

        {/* Identity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("detail.identityInfo")}</Text>
          {currentStudent.aadhar_number && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.aadharNumber")}</Text>
              <Text style={styles.value}>{currentStudent.aadhar_number}</Text>
            </View>
          )}
          {currentStudent.apaar_id && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.apaarId")}</Text>
              <Text style={styles.value}>{currentStudent.apaar_id}</Text>
            </View>
          )}
          {currentStudent.emis_number && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.emisNumber")}</Text>
              <Text style={styles.value}>{currentStudent.emis_number}</Text>
            </View>
          )}
          {currentStudent.udise_student_id && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.udiseStudentId")}</Text>
              <Text style={styles.value}>{currentStudent.udise_student_id}</Text>
            </View>
          )}
          {currentStudent.religion && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.religion")}</Text>
              <Text style={styles.value}>{currentStudent.religion}</Text>
            </View>
          )}
          {currentStudent.category && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.category")}</Text>
              <Text style={styles.value}>{currentStudent.category}</Text>
            </View>
          )}
          {currentStudent.caste && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.caste")}</Text>
              <Text style={styles.value}>{currentStudent.caste}</Text>
            </View>
          )}
          {currentStudent.nationality && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.nationality")}</Text>
              <Text style={styles.value}>{currentStudent.nationality}</Text>
            </View>
          )}
          {currentStudent.mother_tongue && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.motherTongue")}</Text>
              <Text style={styles.value}>{currentStudent.mother_tongue}</Text>
            </View>
          )}
          {currentStudent.place_of_birth && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.placeOfBirth")}</Text>
              <Text style={styles.value}>{currentStudent.place_of_birth}</Text>
            </View>
          )}
        </View>

        {/* Residence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("detail.residenceInfo")}</Text>
          {(currentStudent.is_same_as_permanent_address ?? null) !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.sameAsPermanent")}</Text>
              <Text style={styles.value}>
                {currentStudent.is_same_as_permanent_address
                  ? t("detail.yes")
                  : t("detail.no")}
              </Text>
            </View>
          )}
          {currentStudent.current_address && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.currentAddress")}</Text>
              <Text style={styles.value}>{currentStudent.current_address}</Text>
            </View>
          )}
          {currentStudent.current_city && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.currentCity")}</Text>
              <Text style={styles.value}>{currentStudent.current_city}</Text>
            </View>
          )}
          {currentStudent.current_state && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.currentState")}</Text>
              <Text style={styles.value}>{currentStudent.current_state}</Text>
            </View>
          )}
          {currentStudent.current_pincode && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.currentPincode")}</Text>
              <Text style={styles.value}>{currentStudent.current_pincode}</Text>
            </View>
          )}
          {currentStudent.permanent_address && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.permanentAddress")}</Text>
              <Text style={styles.value}>{currentStudent.permanent_address}</Text>
            </View>
          )}
          {currentStudent.permanent_city && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.permanentCity")}</Text>
              <Text style={styles.value}>{currentStudent.permanent_city}</Text>
            </View>
          )}
          {currentStudent.permanent_state && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.permanentState")}</Text>
              <Text style={styles.value}>{currentStudent.permanent_state}</Text>
            </View>
          )}
          {currentStudent.permanent_pincode && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.permanentPincode")}</Text>
              <Text style={styles.value}>{currentStudent.permanent_pincode}</Text>
            </View>
          )}
          {(currentStudent.is_commuting_from_outstation ?? null) !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.outstationCommute")}</Text>
              <Text style={styles.value}>
                {currentStudent.is_commuting_from_outstation
                  ? t("detail.yes")
                  : t("detail.no")}
              </Text>
            </View>
          )}
          {currentStudent.commute_location && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.commuteLocation")}</Text>
              <Text style={styles.value}>{currentStudent.commute_location}</Text>
            </View>
          )}
          {currentStudent.commute_notes && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.commuteNotes")}</Text>
              <Text style={styles.value}>{currentStudent.commute_notes}</Text>
            </View>
          )}
        </View>

        {/* Emergency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("detail.emergencyInfo")}</Text>
          {currentStudent.emergency_contact_name && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.emergencyName")}</Text>
              <Text style={styles.value}>{currentStudent.emergency_contact_name}</Text>
            </View>
          )}
          {currentStudent.emergency_contact_relationship && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.emergencyRelationship")}</Text>
              <Text style={styles.value}>{currentStudent.emergency_contact_relationship}</Text>
            </View>
          )}
          {currentStudent.emergency_contact_phone && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.emergencyPhone")}</Text>
              <Text style={styles.value}>{currentStudent.emergency_contact_phone}</Text>
            </View>
          )}
          {currentStudent.emergency_contact_alt_phone && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.emergencyAltPhone")}</Text>
              <Text style={styles.value}>{currentStudent.emergency_contact_alt_phone}</Text>
            </View>
          )}
        </View>

        {/* Academic */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("detail.academicInfo")}</Text>
          {currentStudent.admission_date && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.admissionDate")}</Text>
              <Text style={styles.value}>{currentStudent.admission_date}</Text>
            </View>
          )}
          {currentStudent.previous_school_name && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.previousSchoolName")}</Text>
              <Text style={styles.value}>{currentStudent.previous_school_name}</Text>
            </View>
          )}
          {currentStudent.previous_school_class && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.previousSchoolClass")}</Text>
              <Text style={styles.value}>{currentStudent.previous_school_class}</Text>
            </View>
          )}
          {currentStudent.last_school_board && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.lastSchoolBoard")}</Text>
              <Text style={styles.value}>{currentStudent.last_school_board}</Text>
            </View>
          )}
          {currentStudent.tc_number && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.tcNumber")}</Text>
              <Text style={styles.value}>{currentStudent.tc_number}</Text>
            </View>
          )}
          {currentStudent.house_name && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.houseName")}</Text>
              <Text style={styles.value}>{currentStudent.house_name}</Text>
            </View>
          )}
          {currentStudent.student_status && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("detail.studentStatus")}</Text>
              <Text style={styles.value}>{currentStudent.student_status}</Text>
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
