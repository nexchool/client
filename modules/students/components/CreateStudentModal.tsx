import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { Ionicons } from "@expo/vector-icons";
import { CreateStudentDTO, Student } from "../types";
import { validateStudentData } from "../validation/schemas";
import { useAcademicYears } from "@/modules/academics/hooks/useAcademicYears";
import { useAcademicYearContext } from "@/modules/academics/context/AcademicYearContext";
import { classService } from "@/modules/classes/services/classService";
import { ClassSelect } from "@/common/components/ClassSelect";
import { DateField } from "@/common/components/DateField";
import { useQuery } from "@tanstack/react-query";

interface CreateStudentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStudentDTO) => Promise<void>;
  initialData?: Student | null; // For edit mode
  mode?: "create" | "edit";
}

export const CreateStudentModal: React.FC<CreateStudentModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData = null,
  mode = "create",
}) => {
  const { t } = useTranslation("students");
  const [formData, setFormData] = useState<CreateStudentDTO>({
    name: "",
    guardian_name: "",
    guardian_relationship: "",
    guardian_phone: "",
    admission_number: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    class_id: "",
    academic_year_id: "",
    // Extended fields (default empty)
    blood_group: "",
    height_cm: "",
    weight_kg: "",
    medical_allergies: "",
    medical_conditions: "",
    disability_details: "",
    identification_marks: "",

    father_name: "",
    father_phone: "",
    father_email: "",
    father_occupation: "",
    father_annual_income: "",

    mother_name: "",
    mother_phone: "",
    mother_email: "",
    mother_occupation: "",
    mother_annual_income: "",

    guardian_address: "",
    guardian_occupation: "",
    guardian_aadhar_number: "",

    aadhar_number: "",
    apaar_id: "",
    emis_number: "",
    udise_student_id: "",
    religion: "",
    category: "",
    caste: "",
    nationality: "",
    mother_tongue: "",
    place_of_birth: "",

    current_address: "",
    current_city: "",
    current_state: "",
    current_pincode: "",

    permanent_address: "",
    permanent_city: "",
    permanent_state: "",
    permanent_pincode: "",

    is_same_as_permanent_address: false,
    is_commuting_from_outstation: false,
    commute_location: "",
    commute_notes: "",

    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    emergency_contact_alt_phone: "",

    admission_date: "",
    previous_school_name: "",
    previous_school_class: "",
    last_school_board: "",
    tc_number: "",
    house_name: "",
    student_status: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: academicYears = [] } = useAcademicYears(false);
  const { selectedAcademicYearId: contextYearId } = useAcademicYearContext();
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classService.getClasses(),
  });

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        name: initialData.name || "",
        guardian_name: initialData.guardian_name || "",
        guardian_relationship: initialData.guardian_relationship || "",
        guardian_phone: initialData.guardian_phone || "",
        admission_number: initialData.admission_number || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        date_of_birth: initialData.date_of_birth || "",
        gender: initialData.gender || "",
        class_id: initialData.class_id || "",
        academic_year_id: initialData.academic_year_id || "",
        guardian_email: initialData.guardian_email || "",
        blood_group: (initialData as any).blood_group || "",
        height_cm: (initialData as any).height_cm?.toString?.() || "",
        weight_kg: (initialData as any).weight_kg?.toString?.() || "",
        medical_allergies: (initialData as any).medical_allergies || "",
        medical_conditions: (initialData as any).medical_conditions || "",
        disability_details: (initialData as any).disability_details || "",
        identification_marks: (initialData as any).identification_marks || "",

        father_name: (initialData as any).father_name || "",
        father_phone: (initialData as any).father_phone || "",
        father_email: (initialData as any).father_email || "",
        father_occupation: (initialData as any).father_occupation || "",
        father_annual_income: (initialData as any).father_annual_income?.toString?.() || "",

        mother_name: (initialData as any).mother_name || "",
        mother_phone: (initialData as any).mother_phone || "",
        mother_email: (initialData as any).mother_email || "",
        mother_occupation: (initialData as any).mother_occupation || "",
        mother_annual_income: (initialData as any).mother_annual_income?.toString?.() || "",

        guardian_address: (initialData as any).guardian_address || "",
        guardian_occupation: (initialData as any).guardian_occupation || "",
        guardian_aadhar_number: (initialData as any).guardian_aadhar_number || "",

        aadhar_number: (initialData as any).aadhar_number || "",
        apaar_id: (initialData as any).apaar_id || "",
        emis_number: (initialData as any).emis_number || "",
        udise_student_id: (initialData as any).udise_student_id || "",
        religion: (initialData as any).religion || "",
        category: (initialData as any).category || "",
        caste: (initialData as any).caste || "",
        nationality: (initialData as any).nationality || "",
        mother_tongue: (initialData as any).mother_tongue || "",
        place_of_birth: (initialData as any).place_of_birth || "",

        current_address: (initialData as any).current_address || "",
        current_city: (initialData as any).current_city || "",
        current_state: (initialData as any).current_state || "",
        current_pincode: (initialData as any).current_pincode || "",

        permanent_address: (initialData as any).permanent_address || "",
        permanent_city: (initialData as any).permanent_city || "",
        permanent_state: (initialData as any).permanent_state || "",
        permanent_pincode: (initialData as any).permanent_pincode || "",

        is_same_as_permanent_address:
          (initialData as any).is_same_as_permanent_address || false,
        is_commuting_from_outstation:
          (initialData as any).is_commuting_from_outstation || false,
        commute_location: (initialData as any).commute_location || "",
        commute_notes: (initialData as any).commute_notes || "",

        emergency_contact_name: (initialData as any).emergency_contact_name || "",
        emergency_contact_relationship:
          (initialData as any).emergency_contact_relationship || "",
        emergency_contact_phone: (initialData as any).emergency_contact_phone || "",
        emergency_contact_alt_phone:
          (initialData as any).emergency_contact_alt_phone || "",

        admission_date: (initialData as any).admission_date || "",
        previous_school_name: (initialData as any).previous_school_name || "",
        previous_school_class: (initialData as any).previous_school_class || "",
        last_school_board: (initialData as any).last_school_board || "",
        tc_number: (initialData as any).tc_number || "",
        house_name: (initialData as any).house_name || "",
        student_status: (initialData as any).student_status || "",
      });
    } else {
      // Reset for create mode - default academic_year_id from global selection when admin has chosen a year
      setFormData({
        name: "",
        guardian_name: "",
        guardian_relationship: "",
        guardian_phone: "",
        admission_number: "",
        email: "",
        phone: "",
        date_of_birth: "",
        gender: "",
        class_id: "",
        academic_year_id: contextYearId || "",
        blood_group: "",
        height_cm: "",
        weight_kg: "",
        medical_allergies: "",
        medical_conditions: "",
        disability_details: "",
        identification_marks: "",

        father_name: "",
        father_phone: "",
        father_email: "",
        father_occupation: "",
        father_annual_income: "",

        mother_name: "",
        mother_phone: "",
        mother_email: "",
        mother_occupation: "",
        mother_annual_income: "",

        guardian_address: "",
        guardian_occupation: "",
        guardian_aadhar_number: "",

        aadhar_number: "",
        apaar_id: "",
        emis_number: "",
        udise_student_id: "",
        religion: "",
        category: "",
        caste: "",
        nationality: "",
        mother_tongue: "",
        place_of_birth: "",

        current_address: "",
        current_city: "",
        current_state: "",
        current_pincode: "",

        permanent_address: "",
        permanent_city: "",
        permanent_state: "",
        permanent_pincode: "",

        is_same_as_permanent_address: false,
        is_commuting_from_outstation: false,
        commute_location: "",
        commute_notes: "",

        emergency_contact_name: "",
        emergency_contact_relationship: "",
        emergency_contact_phone: "",
        emergency_contact_alt_phone: "",

        admission_date: "",
        previous_school_name: "",
        previous_school_class: "",
        last_school_board: "",
        tc_number: "",
        house_name: "",
        student_status: "",
      });
    }
  }, [mode, initialData, visible, contextYearId]);

  const trField = useCallback(
    (msg: string | undefined) =>
      msg ? t(`validation.${msg}`, { defaultValue: msg }) : "",
    [t],
  );

  const validateForm = (): boolean => {
    // Use Zod validation
    const validation = validateStudentData(formData, mode === "edit");
    
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return false;
    }
    
    setFieldErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError(t("modal.fixErrors"));
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});
    
    try {
      // Clean up formData - send class_id or academic_year_id (backend derives from class)
      const cleanData: CreateStudentDTO = {
        name: formData.name.trim(),
        guardian_name: formData.guardian_name.trim(),
        guardian_relationship: formData.guardian_relationship.trim(),
        guardian_phone: formData.guardian_phone.trim(),
        admission_number: formData.admission_number?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        class_id: formData.class_id?.trim() || undefined,
        academic_year_id: formData.class_id ? undefined : (formData.academic_year_id?.trim() || undefined),
        guardian_email: formData.guardian_email?.trim() || undefined,

        blood_group: formData.blood_group?.trim() || undefined,
        height_cm: formData.height_cm?.toString().trim() || undefined,
        weight_kg: formData.weight_kg?.toString().trim() || undefined,
        medical_allergies: formData.medical_allergies?.trim() || undefined,
        medical_conditions: formData.medical_conditions?.trim() || undefined,
        disability_details: formData.disability_details?.trim() || undefined,
        identification_marks: formData.identification_marks?.trim() || undefined,

        father_name: formData.father_name?.trim() || undefined,
        father_phone: formData.father_phone?.trim() || undefined,
        father_email: formData.father_email?.trim() || undefined,
        father_occupation: formData.father_occupation?.trim() || undefined,
        father_annual_income: formData.father_annual_income?.toString().trim() || undefined,

        mother_name: formData.mother_name?.trim() || undefined,
        mother_phone: formData.mother_phone?.trim() || undefined,
        mother_email: formData.mother_email?.trim() || undefined,
        mother_occupation: formData.mother_occupation?.trim() || undefined,
        mother_annual_income: formData.mother_annual_income?.toString().trim() || undefined,

        guardian_address: formData.guardian_address?.trim() || undefined,
        guardian_occupation: formData.guardian_occupation?.trim() || undefined,
        guardian_aadhar_number: formData.guardian_aadhar_number?.trim() || undefined,

        aadhar_number: formData.aadhar_number?.trim() || undefined,
        apaar_id: formData.apaar_id?.trim() || undefined,
        emis_number: formData.emis_number?.trim() || undefined,
        udise_student_id: formData.udise_student_id?.trim() || undefined,
        religion: formData.religion?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        caste: formData.caste?.trim() || undefined,
        nationality: formData.nationality?.trim() || undefined,
        mother_tongue: formData.mother_tongue?.trim() || undefined,
        place_of_birth: formData.place_of_birth?.trim() || undefined,

        current_address: formData.current_address?.trim() || undefined,
        current_city: formData.current_city?.trim() || undefined,
        current_state: formData.current_state?.trim() || undefined,
        current_pincode: formData.current_pincode?.trim() || undefined,

        permanent_address: formData.permanent_address?.trim() || undefined,
        permanent_city: formData.permanent_city?.trim() || undefined,
        permanent_state: formData.permanent_state?.trim() || undefined,
        permanent_pincode: formData.permanent_pincode?.trim() || undefined,

        is_same_as_permanent_address: formData.is_same_as_permanent_address || undefined,
        is_commuting_from_outstation: formData.is_commuting_from_outstation || undefined,
        commute_location: formData.commute_location?.trim() || undefined,
        commute_notes: formData.commute_notes?.trim() || undefined,

        emergency_contact_name: formData.emergency_contact_name?.trim() || undefined,
        emergency_contact_relationship:
          formData.emergency_contact_relationship?.trim() || undefined,
        emergency_contact_phone: formData.emergency_contact_phone?.trim() || undefined,
        emergency_contact_alt_phone:
          formData.emergency_contact_alt_phone?.trim() || undefined,

        admission_date: formData.admission_date || undefined,
        previous_school_name: formData.previous_school_name?.trim() || undefined,
        previous_school_class: formData.previous_school_class?.trim() || undefined,
        last_school_board: formData.last_school_board?.trim() || undefined,
        tc_number: formData.tc_number?.trim() || undefined,
        house_name: formData.house_name?.trim() || undefined,
        student_status: formData.student_status?.trim() || undefined,
      };
      
      await onSubmit(cleanData);
      
      // onSubmit successful - parent will close modal
      // Reset form for next time (only if creating, not editing)
      if (mode === "create") {
        setFormData({
          name: "",
          guardian_name: "",
          guardian_relationship: "",
          guardian_phone: "",
          admission_number: "",
          email: "",
          phone: "",
          date_of_birth: "",
          gender: "",
          class_id: "",
          academic_year_id: "",
          blood_group: "",
          height_cm: "",
          weight_kg: "",
          medical_allergies: "",
          medical_conditions: "",
          disability_details: "",
          identification_marks: "",

          father_name: "",
          father_phone: "",
          father_email: "",
          father_occupation: "",
          father_annual_income: "",

          mother_name: "",
          mother_phone: "",
          mother_email: "",
          mother_occupation: "",
          mother_annual_income: "",

          guardian_address: "",
          guardian_occupation: "",
          guardian_aadhar_number: "",

          aadhar_number: "",
          apaar_id: "",
          emis_number: "",
          udise_student_id: "",
          religion: "",
          category: "",
          caste: "",
          nationality: "",
          mother_tongue: "",
          place_of_birth: "",

          current_address: "",
          current_city: "",
          current_state: "",
          current_pincode: "",

          permanent_address: "",
          permanent_city: "",
          permanent_state: "",
          permanent_pincode: "",

          is_same_as_permanent_address: false,
          is_commuting_from_outstation: false,
          commute_location: "",
          commute_notes: "",

          emergency_contact_name: "",
          emergency_contact_relationship: "",
          emergency_contact_phone: "",
          emergency_contact_alt_phone: "",

          admission_date: "",
          previous_school_name: "",
          previous_school_class: "",
          last_school_board: "",
          tc_number: "",
          house_name: "",
          student_status: "",
        });
      }
      setError(null);
      setFieldErrors({});
    } catch (err: any) {
      setError(
        err.message ||
          (mode === "edit" ? t("modal.updateFailed") : t("modal.createFailed")),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === "edit" ? t("modal.titleEdit") : t("modal.titleCreate")}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Basic Information */}
            <Text style={styles.sectionTitle}>{t("modal.sectionBasic")}</Text>

            <Text style={styles.label}>{t("modal.fullNameRequired")}</Text>
            <TextInput
              style={[styles.input, fieldErrors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, name: text }));
                if (fieldErrors.name) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              placeholder={t("modal.namePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            {fieldErrors.name && (
              <Text style={styles.fieldError}>{trField(fieldErrors.name)}</Text>
            )}

            <Text style={styles.label}>{t("modal.admissionNumber")}</Text>
            <Text style={styles.helperText}>{t("modal.admissionHint")}</Text>
            <TextInput
              style={[styles.input, fieldErrors.admission_number && styles.inputError]}
              value={formData.admission_number}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, admission_number: text }));
                if (fieldErrors.admission_number) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.admission_number;
                    return next;
                  });
                }
              }}
              placeholder={t("modal.admissionPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              editable={mode === "create"} // Cannot edit admission number
            />
            {fieldErrors.admission_number && (
              <Text style={styles.fieldError}>
                {trField(fieldErrors.admission_number)}
              </Text>
            )}

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>{t("modal.gender")}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.gender}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, gender: text }))
                  }
                  placeholder={t("modal.genderPlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={[styles.col, { marginLeft: Spacing.md }]}>
                <DateField
                  label={t("modal.dateOfBirth")}
                  value={formData.date_of_birth || null}
                  onChange={(text) =>
                    setFormData((prev) => ({ ...prev, date_of_birth: text }))
                  }
                  placeholder={t("modal.datePlaceholder")}
                  error={
                    fieldErrors.date_of_birth
                      ? trField(fieldErrors.date_of_birth)
                      : undefined
                  }
                  useOverlayInsideModal
                />
              </View>
            </View>

            {/* Class (optional) - when selected, academic year is derived */}
            <Text style={styles.label}>{t("modal.class")}</Text>
            <Text style={styles.helperText}>{t("modal.classHint")}</Text>
            <ClassSelect
              value={formData.class_id || null}
              onChange={(id) => {
                setFormData((prev) => ({
                  ...prev,
                  class_id: id ?? "",
                  academic_year_id: id ? "" : prev.academic_year_id,
                }));
                if (fieldErrors.class_id || fieldErrors.academic_year_id) {
                  setFieldErrors((p) => {
                    const next = { ...p };
                    delete next.class_id;
                    delete next.academic_year_id;
                    return next;
                  });
                }
              }}
              options={classes.map((c) => ({
                id: c.id,
                label: c.section ? `${c.name}-${c.section}` : c.name,
                name: c.name,
                section: c.section,
              }))}
              allowEmpty
              emptyLabel={t("modal.classNone")}
              placeholder={t("modal.classPlaceholder")}
              modalTitle={t("modal.classModalTitle")}
            />
            {fieldErrors.class_id && (
              <Text style={styles.fieldError}>{trField(fieldErrors.class_id)}</Text>
            )}

            {/* Academic Year (required when class not selected) */}
            {!formData.class_id && (
              <>
                <Text style={styles.label}>{t("modal.academicYearRequired")}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {academicYears.map((ay) => (
                    <TouchableOpacity
                      key={ay.id}
                      style={[styles.chip, formData.academic_year_id === ay.id && styles.chipActive]}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, academic_year_id: ay.id }));
                        if (fieldErrors.academic_year_id) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.academic_year_id;
                            return next;
                          });
                        }
                      }}
                    >
                      <Text style={[styles.chipText, formData.academic_year_id === ay.id && styles.chipTextActive]}>
                        {ay.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {fieldErrors.academic_year_id && (
                  <Text style={styles.fieldError}>
                    {trField(fieldErrors.academic_year_id)}
                  </Text>
                )}
              </>
            )}

            {/* Guardian Information */}
            <Text style={styles.sectionTitle}>{t("modal.sectionGuardian")}</Text>

            <Text style={styles.label}>{t("modal.guardianNameRequired")}</Text>
            <TextInput
              style={[styles.input, fieldErrors.guardian_name && styles.inputError]}
              value={formData.guardian_name}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, guardian_name: text }));
                if (fieldErrors.guardian_name) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.guardian_name;
                    return next;
                  });
                }
              }}
              placeholder={t("modal.guardianPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            {fieldErrors.guardian_name && (
              <Text style={styles.fieldError}>
                {trField(fieldErrors.guardian_name)}
              </Text>
            )}

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>{t("modal.relationshipRequired")}</Text>
                <TextInput
                  style={[styles.input, fieldErrors.guardian_relationship && styles.inputError]}
                  value={formData.guardian_relationship}
                  onChangeText={(text) => {
                    setFormData((prev) => ({ ...prev, guardian_relationship: text }));
                    if (fieldErrors.guardian_relationship) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.guardian_relationship;
                        return next;
                      });
                    }
                  }}
                  placeholder={t("modal.relationshipPlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                />
                {fieldErrors.guardian_relationship && (
                  <Text style={styles.fieldError}>
                    {trField(fieldErrors.guardian_relationship)}
                  </Text>
                )}
              </View>
              <View style={[styles.col, { marginLeft: Spacing.md }]}>
                <Text style={styles.label}>{t("modal.guardianPhoneRequired")}</Text>
                <TextInput
                  style={[styles.input, fieldErrors.guardian_phone && styles.inputError]}
                  value={formData.guardian_phone}
                  onChangeText={(text) => {
                    setFormData((prev) => ({ ...prev, guardian_phone: text }));
                    if (fieldErrors.guardian_phone) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.guardian_phone;
                        return next;
                      });
                    }
                  }}
                  placeholder={t("modal.guardianPhonePlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="phone-pad"
                />
                {fieldErrors.guardian_phone && (
                  <Text style={styles.fieldError}>
                    {trField(fieldErrors.guardian_phone)}
                  </Text>
                )}
              </View>
            </View>

            {/* Contact Information */}
            <Text style={styles.sectionTitle}>
              {t("modal.sectionContactOptional")}
            </Text>

            <Text style={styles.label}>{t("modal.studentPhone")}</Text>
            <TextInput
              style={[styles.input, fieldErrors.phone && styles.inputError]}
              value={formData.phone}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, phone: text }));
                if (fieldErrors.phone) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.phone;
                    return next;
                  });
                }
              }}
              placeholder={t("modal.studentPhonePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />
            {fieldErrors.phone && (
              <Text style={styles.fieldError}>{trField(fieldErrors.phone)}</Text>
            )}

            <Text style={styles.label}>{t("modal.studentEmail")}</Text>
            <Text style={styles.helperText}>{t("modal.studentEmailHint")}</Text>
            <TextInput
              style={[styles.input, fieldErrors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, email: text }));
                if (fieldErrors.email) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }
              }}
              placeholder={t("modal.studentEmailPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {fieldErrors.email && (
              <Text style={styles.fieldError}>{trField(fieldErrors.email)}</Text>
            )}

            {/* Parent / Family Info */}
            <Text style={styles.sectionTitle}>{t("modal.sectionParentFamily")}</Text>

            <Text style={styles.label}>{t("modal.fatherName")}</Text>
            <TextInput
              style={styles.input}
              value={formData.father_name as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, father_name: text }))}
              placeholder={t("modal.fatherNamePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.label}>{t("modal.fatherPhone")}</Text>
            <TextInput
              style={styles.input}
              value={formData.father_phone as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, father_phone: text }))}
              placeholder={t("modal.fatherPhonePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>{t("modal.fatherEmail")}</Text>
            <TextInput
              style={styles.input}
              value={formData.father_email as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, father_email: text }))}
              placeholder={t("modal.fatherEmailPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>{t("modal.fatherOccupation")}</Text>
            <TextInput
              style={styles.input}
              value={formData.father_occupation as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, father_occupation: text }))}
              placeholder={t("modal.fatherOccupationPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.label}>{t("modal.fatherAnnualIncome")}</Text>
            <TextInput
              style={styles.input}
              value={formData.father_annual_income as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, father_annual_income: text }))}
              placeholder={t("modal.fatherAnnualIncomePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />

            <Text style={styles.label}>{t("modal.motherName")}</Text>
            <TextInput
              style={styles.input}
              value={formData.mother_name as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, mother_name: text }))}
              placeholder={t("modal.motherNamePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.label}>{t("modal.motherPhone")}</Text>
            <TextInput
              style={styles.input}
              value={formData.mother_phone as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, mother_phone: text }))}
              placeholder={t("modal.motherPhonePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>{t("modal.motherEmail")}</Text>
            <TextInput
              style={styles.input}
              value={formData.mother_email as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, mother_email: text }))}
              placeholder={t("modal.motherEmailPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>{t("modal.motherOccupation")}</Text>
            <TextInput
              style={styles.input}
              value={formData.mother_occupation as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, mother_occupation: text }))}
              placeholder={t("modal.motherOccupationPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.label}>{t("modal.motherAnnualIncome")}</Text>
            <TextInput
              style={styles.input}
              value={formData.mother_annual_income as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, mother_annual_income: text }))}
              placeholder={t("modal.motherAnnualIncomePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />

            <Text style={styles.label}>{t("modal.guardianAddress")}</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              value={formData.guardian_address as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, guardian_address: text }))}
              placeholder={t("modal.guardianAddressPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              multiline
            />

            <Text style={styles.label}>{t("modal.guardianOccupation")}</Text>
            <TextInput
              style={styles.input}
              value={formData.guardian_occupation as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, guardian_occupation: text }))}
              placeholder={t("modal.guardianOccupationPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.label}>{t("modal.guardianAadhar")}</Text>
            <TextInput
              style={styles.input}
              value={formData.guardian_aadhar_number as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, guardian_aadhar_number: text }))}
              placeholder={t("modal.guardianAadharPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />

            {/* Health Info */}
            <Text style={styles.sectionTitle}>{t("modal.sectionHealth")}</Text>
            <Text style={styles.label}>{t("modal.bloodGroup")}</Text>
            <TextInput
              style={styles.input}
              value={formData.blood_group as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, blood_group: text }))}
              placeholder={t("modal.bloodGroupPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>{t("modal.heightCm")}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.height_cm as any}
                  onChangeText={(text) => setFormData((p) => ({ ...p, height_cm: text }))}
                  placeholder={t("modal.heightCmPlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.col, { marginLeft: Spacing.md }]}>
                <Text style={styles.label}>{t("modal.weightKg")}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.weight_kg as any}
                  onChangeText={(text) => setFormData((p) => ({ ...p, weight_kg: text }))}
                  placeholder={t("modal.weightKgPlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Text style={styles.label}>{t("modal.medicalAllergies")}</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              value={formData.medical_allergies as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, medical_allergies: text }))}
              placeholder={t("modal.medicalAllergiesPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              multiline
            />
            <Text style={styles.label}>{t("modal.medicalConditions")}</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              value={formData.medical_conditions as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, medical_conditions: text }))}
              placeholder={t("modal.medicalConditionsPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              multiline
            />
            <Text style={styles.label}>{t("modal.disabilityDetails")}</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              value={formData.disability_details as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, disability_details: text }))}
              placeholder={t("modal.disabilityDetailsPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              multiline
            />
            <Text style={styles.label}>{t("modal.identificationMarks")}</Text>
            <TextInput
              style={styles.input}
              value={formData.identification_marks as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, identification_marks: text }))}
              placeholder={t("modal.identificationMarksPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />

            {/* Identity Info */}
            <Text style={styles.sectionTitle}>{t("modal.sectionIdentity")}</Text>
            <Text style={styles.label}>{t("modal.aadharNumber")}</Text>
            <TextInput
              style={styles.input}
              value={formData.aadhar_number as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, aadhar_number: text }))}
              placeholder={t("modal.aadharNumberPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />
            <Text style={styles.label}>{t("modal.apaarId")}</Text>
            <TextInput
              style={styles.input}
              value={formData.apaar_id as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, apaar_id: text }))}
              placeholder={t("modal.apaarIdPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.emisNumber")}</Text>
            <TextInput
              style={styles.input}
              value={formData.emis_number as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, emis_number: text }))}
              placeholder={t("modal.emisNumberPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.udiseStudentId")}</Text>
            <TextInput
              style={styles.input}
              value={formData.udise_student_id as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, udise_student_id: text }))}
              placeholder={t("modal.udiseStudentIdPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.religion")}</Text>
            <TextInput
              style={styles.input}
              value={formData.religion as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, religion: text }))}
              placeholder={t("modal.religionPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.category")}</Text>
            <TextInput
              style={styles.input}
              value={formData.category as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, category: text }))}
              placeholder={t("modal.categoryPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.caste")}</Text>
            <TextInput
              style={styles.input}
              value={formData.caste as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, caste: text }))}
              placeholder={t("modal.castePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.nationality")}</Text>
            <TextInput
              style={styles.input}
              value={formData.nationality as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, nationality: text }))}
              placeholder={t("modal.nationalityPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.motherTongue")}</Text>
            <TextInput
              style={styles.input}
              value={formData.mother_tongue as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, mother_tongue: text }))}
              placeholder={t("modal.motherTonguePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.placeOfBirth")}</Text>
            <TextInput
              style={styles.input}
              value={formData.place_of_birth as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, place_of_birth: text }))}
              placeholder={t("modal.placeOfBirthPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />

            {/* Residence Info */}
            <Text style={styles.sectionTitle}>{t("modal.sectionResidence")}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.label}>{t("modal.sameAsPermanent")}</Text>
              <Switch
                value={!!formData.is_same_as_permanent_address}
                onValueChange={(v) => {
                  setFormData((p) => {
                    const next = { ...p, is_same_as_permanent_address: v };
                    if (v) {
                      next.current_address = p.permanent_address || "";
                      next.current_city = p.permanent_city || "";
                      next.current_state = p.permanent_state || "";
                      next.current_pincode = p.permanent_pincode || "";
                    }
                    return next;
                  });
                }}
              />
            </View>
            <Text style={styles.label}>{t("modal.permanentAddress")}</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              value={formData.permanent_address as any}
              onChangeText={(text) =>
                setFormData((p) => {
                  const next = { ...p, permanent_address: text };
                  if (p.is_same_as_permanent_address) next.current_address = text;
                  return next;
                })
              }
              placeholder={t("modal.permanentAddressPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              multiline
            />
            <Text style={styles.label}>{t("modal.currentAddress")}</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }, formData.is_same_as_permanent_address ? styles.disabledField : null]}
              value={formData.current_address as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, current_address: text }))}
              placeholder={t("modal.currentAddressPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              multiline
              editable={!formData.is_same_as_permanent_address}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>{t("modal.permanentCity")}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.permanent_city as any}
                  onChangeText={(text) =>
                    setFormData((p) => {
                      const next = { ...p, permanent_city: text };
                      if (p.is_same_as_permanent_address) next.current_city = text;
                      return next;
                    })
                  }
                  placeholder={t("modal.permanentCityPlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={[styles.col, { marginLeft: Spacing.md }]}>
                <Text style={styles.label}>{t("modal.currentCity")}</Text>
                <TextInput
                  style={[styles.input, formData.is_same_as_permanent_address ? styles.disabledField : null]}
                  value={formData.current_city as any}
                  onChangeText={(text) => setFormData((p) => ({ ...p, current_city: text }))}
                  placeholder={t("modal.currentCityPlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                  editable={!formData.is_same_as_permanent_address}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>{t("modal.permanentState")}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.permanent_state as any}
                  onChangeText={(text) =>
                    setFormData((p) => {
                      const next = { ...p, permanent_state: text };
                      if (p.is_same_as_permanent_address) next.current_state = text;
                      return next;
                    })
                  }
                  placeholder={t("modal.permanentStatePlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={[styles.col, { marginLeft: Spacing.md }]}>
                <Text style={styles.label}>{t("modal.currentState")}</Text>
                <TextInput
                  style={[styles.input, formData.is_same_as_permanent_address ? styles.disabledField : null]}
                  value={formData.current_state as any}
                  onChangeText={(text) => setFormData((p) => ({ ...p, current_state: text }))}
                  placeholder={t("modal.currentStatePlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                  editable={!formData.is_same_as_permanent_address}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>{t("modal.permanentPincode")}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.permanent_pincode as any}
                  onChangeText={(text) =>
                    setFormData((p) => {
                      const next = { ...p, permanent_pincode: text };
                      if (p.is_same_as_permanent_address) next.current_pincode = text;
                      return next;
                    })
                  }
                  placeholder={t("modal.permanentPincodePlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.col, { marginLeft: Spacing.md }]}>
                <Text style={styles.label}>{t("modal.currentPincode")}</Text>
                <TextInput
                  style={[styles.input, formData.is_same_as_permanent_address ? styles.disabledField : null]}
                  value={formData.current_pincode as any}
                  onChangeText={(text) => setFormData((p) => ({ ...p, current_pincode: text }))}
                  placeholder={t("modal.currentPincodePlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  editable={!formData.is_same_as_permanent_address}
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>{t("modal.outstationCommute")}</Text>
              <Switch
                value={!!formData.is_commuting_from_outstation}
                onValueChange={(v) => setFormData((p) => ({ ...p, is_commuting_from_outstation: v }))}
              />
            </View>
            <Text style={styles.label}>{t("modal.commuteLocation")}</Text>
            <TextInput
              style={styles.input}
              value={formData.commute_location as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, commute_location: text }))}
              placeholder={t("modal.commuteLocationPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.commuteNotes")}</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              value={formData.commute_notes as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, commute_notes: text }))}
              placeholder={t("modal.commuteNotesPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              multiline
            />

            {/* Emergency Info */}
            <Text style={styles.sectionTitle}>{t("modal.sectionEmergency")}</Text>
            <Text style={styles.label}>{t("modal.emergencyName")}</Text>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact_name as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, emergency_contact_name: text }))}
              placeholder={t("modal.emergencyNamePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.emergencyRelationship")}</Text>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact_relationship as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, emergency_contact_relationship: text }))}
              placeholder={t("modal.emergencyRelationshipPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.emergencyPhone")}</Text>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact_phone as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, emergency_contact_phone: text }))}
              placeholder={t("modal.emergencyPhonePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>{t("modal.emergencyAltPhone")}</Text>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact_alt_phone as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, emergency_contact_alt_phone: text }))}
              placeholder={t("modal.emergencyAltPhonePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />

            {/* Academic Info */}
            <Text style={styles.sectionTitle}>{t("modal.sectionAcademic")}</Text>
            <DateField
              label={t("modal.admissionDate")}
              value={(formData.admission_date as any) || null}
              onChange={(text) => setFormData((p) => ({ ...p, admission_date: text }))}
              placeholder={t("modal.datePlaceholder")}
              useOverlayInsideModal
            />
            <Text style={styles.label}>{t("modal.previousSchoolName")}</Text>
            <TextInput
              style={styles.input}
              value={formData.previous_school_name as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, previous_school_name: text }))}
              placeholder={t("modal.previousSchoolNamePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.previousSchoolClass")}</Text>
            <TextInput
              style={styles.input}
              value={formData.previous_school_class as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, previous_school_class: text }))}
              placeholder={t("modal.previousSchoolClassPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.lastSchoolBoard")}</Text>
            <TextInput
              style={styles.input}
              value={formData.last_school_board as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, last_school_board: text }))}
              placeholder={t("modal.lastSchoolBoardPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.tcNumber")}</Text>
            <TextInput
              style={styles.input}
              value={formData.tc_number as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, tc_number: text }))}
              placeholder={t("modal.tcNumberPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.houseName")}</Text>
            <TextInput
              style={styles.input}
              value={formData.house_name as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, house_name: text }))}
              placeholder={t("modal.houseNamePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.label}>{t("modal.studentStatus")}</Text>
            <TextInput
              style={styles.input}
              value={formData.student_status as any}
              onChangeText={(text) => setFormData((p) => ({ ...p, student_status: text }))}
              placeholder={t("modal.studentStatusPlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{t("modal.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading
                  ? mode === "edit"
                    ? t("modal.updating")
                    : t("modal.creating")
                  : mode === "edit"
                    ? t("modal.update")
                    : t("modal.create")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    height: "85%",
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  fieldError: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: "row",
  },
  col: {
    flex: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  disabledField: {
    opacity: 0.7,
  },
  errorContainer: {
    backgroundColor: "#FFE5E5",
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    alignItems: "center",
    marginRight: Spacing.md,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  submitButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  chipRow: { marginBottom: Spacing.xs, flexDirection: "row" },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.backgroundSecondary,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "20",
  },
  chipText: { fontSize: 14, color: Colors.text },
  chipTextActive: { color: Colors.primary, fontWeight: "600" },
});
