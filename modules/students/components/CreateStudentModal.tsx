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
