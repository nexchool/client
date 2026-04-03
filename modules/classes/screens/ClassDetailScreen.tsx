import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useClasses } from "../hooks/useClasses";
import { CreateClassModal } from "../components/CreateClassModal";
import { CreateClassDTO } from "../types";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { Student } from "@/modules/students/types";
import { Teacher } from "@/modules/teachers/types";
import { subjectService } from "@/modules/subjects/services/subjectService";
import { Subject } from "@/modules/subjects/types";
import { ClassSubjectsPanel } from "@/modules/academics/components/class/ClassSubjectsPanel";
import { SubjectTeachersPanel } from "@/modules/academics/components/class/SubjectTeachersPanel";
import { ClassTeachersPanel } from "@/modules/academics/components/class/ClassTeachersPanel";
import { ClassTimetableV2Panel } from "@/modules/academics/components/class/ClassTimetableV2Panel";
import { ClassAttendancePanel } from "@/modules/academics/components/class/ClassAttendancePanel";

type HubTab =
  | "students"
  // | "teachers"
  | "subjects"
  | "subjectTeachers"
  | "classTeachers"
  | "timetable"
  | "attendance";

const TAB_DEF: { key: HubTab; label: string }[] = [
  { key: "students", label: "Students" },
  // { key: "teachers", label: "Teachers" },
  { key: "subjects", label: "Subjects" },
  { key: "subjectTeachers", label: "Subj. teachers" },
  { key: "classTeachers", label: "Class teachers" },
  { key: "timetable", label: "Timetable" },
  { key: "attendance", label: "Attendance" },
];

export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isFeatureEnabled } = useAuth();
  const {
    currentClass,
    loading,
    fetchClassDetail,
    updateClass,
    assignStudent,
    removeStudent,
    assignTeacher,
    removeTeacher,
    fetchUnassignedStudents,
    fetchUnassignedTeachers,
    unassignedStudents,
    unassignedTeachers,
  } = useClasses();
  const { hasPermission } = usePermissions();

  const canUpdate = hasPermission(PERMS.CLASS_UPDATE);
  const canManage = hasPermission(PERMS.CLASS_MANAGE);
  const canManageSubjects = canManage || hasPermission(PERMS.CLASS_SUBJECT_MANAGE);
  const canViewSubjects =
    hasPermission(PERMS.CLASS_SUBJECT_READ) || hasPermission(PERMS.CLASS_SUBJECT_MANAGE) || canManage;
  const canSubjectTeachers =
    isFeatureEnabled("timetable") && (hasPermission(PERMS.CLASS_SUBJECT_MANAGE) || canManage);
  const canClassTeacherTab = hasPermission(PERMS.CLASS_READ) || hasPermission(PERMS.CLASS_TEACHER_MANAGE);
  const canManageClassTeachers = hasPermission(PERMS.CLASS_TEACHER_MANAGE) || canManage;
  const canTimetable = isFeatureEnabled("timetable") && (hasPermission(PERMS.TIMETABLE_READ) || hasPermission(PERMS.TIMETABLE_MANAGE));
  const canManageTimetable = hasPermission(PERMS.TIMETABLE_MANAGE);
  const canAttendanceMark = isFeatureEnabled("attendance") && hasPermission(PERMS.ATTENDANCE_MARK);
  const canAttendanceView =
    isFeatureEnabled("attendance") &&
    (hasPermission(PERMS.ATTENDANCE_READ_CLASS) ||
      hasPermission(PERMS.ATTENDANCE_READ_ALL) ||
      canAttendanceMark);

  const visibleTabs = useMemo(() => {
    return TAB_DEF.filter((t) => {
      if (t.key === "subjects") return canViewSubjects;
      if (t.key === "subjectTeachers") return canSubjectTeachers;
      if (t.key === "classTeachers") return canClassTeacherTab;
      if (t.key === "timetable") return canTimetable;
      if (t.key === "attendance") return canAttendanceView;
      return true;
    });
  }, [canViewSubjects, canSubjectTeachers, canClassTeacherTab, canTimetable, canAttendanceView]);

  const [tab, setTab] = useState<HubTab>("students");
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  useEffect(() => {
    if (id) fetchClassDetail(id);
  }, [id]);

  useEffect(() => {
    if (!visibleTabs.some((t) => t.key === tab)) {
      setTab(visibleTabs[0]?.key ?? "students");
    }
  }, [visibleTabs, tab]);

  const handleAssignStudent = async (student: Student) => {
    if (!id) return;
    try {
      await assignStudent(id, student.id);
      setShowStudentPicker(false);
      Alert.alert("Success", `${student.name} assigned to class`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to assign student");
    }
  };

  const handleRemoveStudent = (student: Student) => {
    Alert.alert("Remove Student", `Remove ${student.name} from this class?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!id) return;
          try {
            await removeStudent(id, student.id);
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const handleAssignTeacher = async (teacher: Teacher) => {
    if (!id) return;
    if (!selectedSubjectId) {
      Alert.alert("Select Subject", "Please select a subject first.");
      return;
    }
    try {
      await assignTeacher(id, teacher.id, selectedSubjectId);
      setShowTeacherPicker(false);
      setSelectedSubjectId("");
      Alert.alert("Success", `${teacher.name} assigned to class`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to assign teacher");
    }
  };

  const handleRemoveTeacher = (teacherId: string, teacherName: string) => {
    Alert.alert("Remove Teacher", `Remove ${teacherName} from this class?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!id) return;
          try {
            await removeTeacher(id, teacherId);
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const openStudentPicker = async () => {
    if (!id) return;
    await fetchUnassignedStudents(id);
    setShowStudentPicker(true);
  };

  const handleUpdateClass = async (data: CreateClassDTO) => {
    if (!id) return;
    try {
      await updateClass(id, data);
      setShowEditModal(false);
      Alert.alert("Success", "Class updated successfully");
      fetchClassDetail(id);
    } catch (err: any) {
      throw err;
    }
  };

  const openTeacherPicker = async () => {
    if (!id) return;
    setSelectedSubjectId("");
    setSubjectsLoading(true);
    try {
      const subs = await subjectService.getSubjects();
      setSubjects(subs);
    } catch {
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
    await fetchUnassignedTeachers(id);
    setShowTeacherPicker(true);
  };

  if (loading && !currentClass) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentClass) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Class not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const classLabel = `${currentClass.name}-${currentClass.section}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{classLabel}</Text>
        {canUpdate && (
          <TouchableOpacity style={styles.editIcon} onPress={() => setShowEditModal(true)}>
            <Ionicons name="create-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} nestedScrollEnabled>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Class information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Academic Year</Text>
            <Text style={styles.value}>{currentClass.academic_year}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Legacy class teacher</Text>
            <Text style={styles.value}>{currentClass.teacher_name || "—"}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{currentClass.student_count || 0}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{currentClass.teacher_count || 0}</Text>
              <Text style={styles.statLabel}>Teachers</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {visibleTabs.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabChip, tab === t.key && styles.tabChipActive]}
                onPress={() => setTab(t.key)}
              >
                <Text style={[styles.tabChipTxt, tab === t.key && styles.tabChipTxtActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.tabBody}>
          {tab === "students" && (
            <View>
              <View style={styles.rowHeader}>
                <Text style={styles.panelTitle}>Students</Text>
                {canUpdate && (
                  <TouchableOpacity style={styles.addSmallBtn} onPress={openStudentPicker}>
                    <Ionicons name="add" size={20} color={Colors.primary} />
                    <Text style={styles.addSmallBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
              {currentClass.students && currentClass.students.length > 0 ? (
                currentClass.students.map((student) => (
                  <View key={student.id} style={styles.listItem}>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemName}>{student.name}</Text>
                      <Text style={styles.listItemDetail}>{student.admission_number}</Text>
                    </View>
                    {canUpdate && (
                      <TouchableOpacity onPress={() => handleRemoveStudent(student)}>
                        <Ionicons name="close-circle-outline" size={22} color={Colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No students assigned</Text>
              )}
            </View>
          )}

          {/* {tab === "teachers" && (
            <View>
              <View style={styles.rowHeader}>
                <Text style={styles.panelTitle}>Teachers</Text>
                {canUpdate && (
                  <TouchableOpacity style={styles.addSmallBtn} onPress={openTeacherPicker}>
                    <Ionicons name="add" size={20} color={Colors.primary} />
                    <Text style={styles.addSmallBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
              {currentClass.teachers && currentClass.teachers.length > 0 ? (
                currentClass.teachers.map((ct) => (
                  <View key={ct.id} style={styles.listItem}>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemName}>{ct.teacher_name}</Text>
                      <Text style={styles.listItemDetail}>
                        {ct.teacher_employee_id}
                        {ct.subject_name || ct.subject ? ` — ${ct.subject_name || ct.subject}` : ""}
                      </Text>
                    </View>
                    {canUpdate && (
                      <TouchableOpacity onPress={() => handleRemoveTeacher(ct.teacher_id, ct.teacher_name)}>
                        <Ionicons name="close-circle-outline" size={22} color={Colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No teachers assigned</Text>
              )}
            </View>
          )} */}

          {tab === "subjects" && id && (
            <ClassSubjectsPanel classId={id} canManage={canManageSubjects} />
          )}

          {tab === "subjectTeachers" && id && (
            <SubjectTeachersPanel classId={id} canManage={canSubjectTeachers} />
          )}

          {tab === "classTeachers" && id && (
            <ClassTeachersPanel classId={id} canManage={canManageClassTeachers} />
          )}

          {tab === "timetable" && id && <ClassTimetableV2Panel classId={id} canManage={canManageTimetable} />}

          {tab === "attendance" && id && (
            <ClassAttendancePanel
              classId={id}
              classLabel={classLabel}
              canMark={canAttendanceMark}
              canViewHistory={canAttendanceView}
            />
          )}
        </View>
      </ScrollView>

      <Modal visible={showStudentPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Student</Text>
            <TouchableOpacity onPress={() => setShowStudentPicker(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={unassignedStudents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: Spacing.md }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.pickerItem} onPress={() => handleAssignStudent(item)}>
                <Text style={styles.pickerName}>{item.name}</Text>
                <Text style={styles.pickerDetail}>{item.admission_number}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>No unassigned students available</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {canUpdate && (
        <CreateClassModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateClass}
          initialData={{
            name: currentClass.name,
            section: currentClass.section,
            academic_year_id: currentClass.academic_year_id ?? "",
            teacher_id: currentClass.teacher_id,
            start_date: currentClass.start_date,
            end_date: currentClass.end_date,
            grade_level: currentClass.grade_level ?? null,
          }}
          classId={id}
        />
      )}

      <Modal visible={showTeacherPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Teacher</Text>
            <TouchableOpacity
              onPress={() => {
                setShowTeacherPicker(false);
                setSelectedSubjectId("");
              }}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.subjectSection}>
            <Text style={styles.subjectLabel}>1. Select Subject *</Text>
            {subjectsLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.md }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectChips}>
                {subjects.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.subjectChip, selectedSubjectId === s.id && styles.subjectChipActive]}
                    onPress={() => setSelectedSubjectId(s.id)}
                  >
                    <Text
                      style={[styles.subjectChipText, selectedSubjectId === s.id && styles.subjectChipTextActive]}
                    >
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {!subjectsLoading && subjects.length === 0 && (
                  <Text style={styles.subjectEmpty}>No subjects. Create subjects first.</Text>
                )}
              </ScrollView>
            )}
          </View>
          <View style={styles.teacherSection}>
            <Text style={styles.subjectLabel}>2. Select Teacher</Text>
          </View>
          <FlatList
            data={unassignedTeachers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: Spacing.md }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.pickerItem} onPress={() => handleAssignTeacher(item)}>
                <Text style={styles.pickerName}>{item.name}</Text>
                <Text style={styles.pickerDetail}>
                  {item.employee_id}
                  {item.department ? ` - ${item.department}` : ""}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>No available teachers</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
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
  editIcon: { padding: Spacing.sm },
  content: { flex: 1, padding: Spacing.lg },
  section: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: Spacing.md, color: Colors.text },
  infoRow: { marginBottom: Spacing.sm },
  label: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4 },
  value: { fontSize: 16, fontWeight: "500", color: Colors.text },
  statsRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
  },
  statNumber: { fontSize: 24, fontWeight: "700", color: Colors.text },
  statLabel: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  tabBar: { marginBottom: Spacing.md },
  tabChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginRight: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
  },
  tabChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + "18" },
  tabChipTxt: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  tabChipTxtActive: { color: Colors.primary },
  tabBody: {
    minHeight: 420,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  panelTitle: { fontSize: 16, fontWeight: "700" },
  addSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.sm,
    gap: 4,
  },
  addSmallBtnText: { fontSize: 14, color: Colors.primary, fontWeight: "500" },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  listItemInfo: { flex: 1 },
  listItemName: { fontSize: 15, fontWeight: "500", color: Colors.text },
  listItemDetail: { fontSize: 13, color: Colors.textSecondary },
  emptyText: { fontSize: 14, color: Colors.textSecondary, fontStyle: "italic" },
  errorText: { fontSize: 16, color: Colors.error, textAlign: "center", marginBottom: Spacing.lg },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  backBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", color: Colors.text },
  subjectSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  subjectLabel: { fontSize: 14, fontWeight: "500", color: Colors.text, marginBottom: Spacing.sm },
  subjectChips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  subjectChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.backgroundSecondary,
  },
  subjectChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + "20" },
  subjectChipText: { fontSize: 14, color: Colors.text },
  subjectChipTextActive: { color: Colors.primary, fontWeight: "600" },
  subjectEmpty: { fontSize: 14, color: Colors.textSecondary, fontStyle: "italic", paddingVertical: Spacing.sm },
  teacherSection: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  pickerItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerName: { fontSize: 16, fontWeight: "500", color: Colors.text },
  pickerDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
});
