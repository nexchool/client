import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { studentService } from "@/modules/students/services/studentService";
import { teacherService } from "@/modules/teachers/services/teacherService";
import type { Student } from "@/modules/students/types";
import type { Teacher } from "@/modules/teachers/types";
import { uploadProfilePicture } from "@/modules/auth/services/profileService";
import { StudentDocumentsSection } from "@/modules/students/components/StudentDocumentsSection";
import { ApiException } from "@/common/services/api";

type ProfileKind = "student" | "teacher" | "account";

/**
 * After crop/edit, URIs are often content:// or short-lived file:// paths that
 * React Native FormData does not attach reliably. Copy to cache first.
 */
async function prepareImageForUploadUri(
  asset: ImagePicker.ImagePickerAsset,
): Promise<{ uri: string; name: string; mimeType: string }> {
  const mimeType = asset.mimeType ?? "image/jpeg";
  const ext = mimeType.includes("png") ? "png" : "jpg";
  const safeName =
    asset.fileName?.replace(/[^\w.-]/g, "_") ||
    `profile_${Date.now()}.${ext}`;

  if (Platform.OS === "web") {
    return { uri: asset.uri, name: safeName, mimeType };
  }

  const cache = FileSystem.cacheDirectory;
  if (!cache) {
    return { uri: asset.uri, name: safeName, mimeType };
  }

  const dest = `${cache}profile_upload_${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: asset.uri, to: dest });
  return { uri: dest, name: safeName, mimeType };
}

function TableRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.labelCell}>{label}</Text>
      <Text style={rowStyles.valueCell}>{String(value)}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  labelCell: {
    width: "38%",
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  valueCell: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500",
  },
});

function TableSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.tableSection}>
      <Text style={styles.tableSectionTitle}>{title}</Text>
      <View style={styles.tableCard}>{children}</View>
    </View>
  );
}

export default function MyProfileScreen() {
  const router = useRouter();
  const { user, enabledFeatures, updateLocalUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState<ProfileKind>("account");
  const [student, setStudent] = useState<Student | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const allowStudent =
        enabledFeatures.length === 0 ||
        enabledFeatures.includes("student_management");
      const allowTeacher =
        enabledFeatures.length === 0 ||
        enabledFeatures.includes("teacher_management");
      try {
        if (allowStudent) {
          try {
            const s = await studentService.getMyProfile();
            if (!cancelled) {
              setStudent(s);
              setTeacher(null);
              setKind("student");
              return;
            }
          } catch {
            /* not linked as student */
          }
        }
        if (allowTeacher) {
          try {
            const t = await teacherService.getMyProfile();
            if (!cancelled) {
              setTeacher(t);
              setStudent(null);
              setKind("teacher");
              return;
            }
          } catch {
            /* not linked as teacher */
          }
        }
        if (!cancelled) {
          setStudent(null);
          setTeacher(null);
          setKind("account");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabledFeatures]);

  const displayName = useMemo(() => {
    if (student?.name) return student.name;
    if (teacher?.name) return teacher.name;
    if (user?.name) return user.name;
    return user?.email?.split("@")[0] ?? "Profile";
  }, [student, teacher, user]);

  const avatarUri = useMemo(() => {
    return (
      user?.profile_picture_url ||
      student?.profile_picture ||
      teacher?.profile_picture ||
      null
    );
  }, [user, student, teacher]);

  const pickAndUpload = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to change your profile picture.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      let prepared: { uri: string; name: string; mimeType: string };
      try {
        prepared = await prepareImageForUploadUri(asset);
      } catch {
        Alert.alert(
          "Could not read photo",
          "The image could not be copied for upload. Try again, or pick the photo without using the crop screen.",
        );
        return;
      }
      const data = await uploadProfilePicture(prepared);
      await updateLocalUser({ profile_picture_url: data.profile_picture_url });
      if (student) {
        const refreshed = await studentService.getMyProfile();
        setStudent(refreshed);
      }
      if (teacher) {
        const t = await teacherService.getMyProfile();
        setTeacher(t);
      }
    } catch (e) {
      const msg =
        e instanceof ApiException
          ? e.message
          : "Could not update your photo. Please try again.";
      Alert.alert("Upload failed", msg);
    } finally {
      setUploading(false);
    }
  }, [updateLocalUser, student, teacher]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          My profile
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() => void pickAndUpload()}
              disabled={uploading}
              activeOpacity={0.85}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImg}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={56} color={Colors.primary} />
                </View>
              )}
              {uploading ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={18} color={Colors.background} />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.heroName}>{displayName}</Text>
            <Text style={styles.heroHint}>
              Tap the photo to change it here. Your school can also set your
              photo from the admin panel. Other details are read-only and come
              from your school records.
            </Text>
          </View>

          <TableSection title="Account">
            <TableRow label="Login email" value={user?.email} />
            <View style={rowStyles.row}>
              <Text style={rowStyles.labelCell}>Profile photo</Text>
              <Text style={[rowStyles.valueCell, styles.mutedValue]}>
                You or your school can set this (tap photo above)
              </Text>
            </View>
          </TableSection>

          {kind === "account" && (
            <View style={styles.notice}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={Colors.textSecondary}
              />
              <Text style={styles.noticeText}>
                No student or teacher record is linked to this login. If you
                are a student or teacher, contact your school administrator.
              </Text>
            </View>
          )}

          {kind === "student" && student && (
            <>
              <TableSection title="Basic information">
                <TableRow label="Full name" value={student.name} />
                <TableRow
                  label="Admission number"
                  value={student.admission_number}
                />
                <TableRow
                  label="Academic year"
                  value={student.academic_year || "—"}
                />
                <TableRow label="Gender" value={student.gender} />
                <TableRow label="Date of birth" value={student.date_of_birth} />
              </TableSection>

              <TableSection title="Contact">
                <TableRow label="Email" value={student.email} />
                <TableRow label="Phone" value={student.phone} />
                <TableRow label="Address" value={student.address} />
              </TableSection>

              <TableSection title="Guardian">
                <TableRow label="Name" value={student.guardian_name} />
                <TableRow
                  label="Relationship"
                  value={student.guardian_relationship}
                />
                <TableRow label="Phone" value={student.guardian_phone} />
                <TableRow label="Email" value={student.guardian_email} />
              </TableSection>

              <TableSection title="Class">
                <TableRow
                  label="Current class"
                  value={student.class_name || "Not assigned"}
                />
                <TableRow label="Roll number" value={student.roll_number} />
              </TableSection>

              <View style={styles.documentsWrap}>
                <StudentDocumentsSection studentId={student.id} />
              </View>
            </>
          )}

          {kind === "teacher" && teacher && (
            <>
              <TableSection title="Basic information">
                <TableRow label="Full name" value={teacher.name} />
                <TableRow label="Employee ID" value={teacher.employee_id} />
                <TableRow label="Email" value={teacher.email} />
                <TableRow label="Phone" value={teacher.phone} />
                <TableRow label="Status" value={teacher.status} />
              </TableSection>

              <TableSection title="Professional">
                <TableRow label="Designation" value={teacher.designation} />
                <TableRow label="Department" value={teacher.department} />
                <TableRow label="Qualification" value={teacher.qualification} />
                <TableRow
                  label="Specialization"
                  value={teacher.specialization}
                />
                <TableRow
                  label="Experience"
                  value={
                    teacher.experience_years != null
                      ? `${teacher.experience_years} years`
                      : undefined
                  }
                />
                <TableRow
                  label="Date of joining"
                  value={teacher.date_of_joining}
                />
              </TableSection>

              {teacher.address ? (
                <TableSection title="Address">
                  <TableRow label="Address" value={teacher.address} />
                </TableSection>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  backBtn: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  avatarImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.background,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  heroHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 320,
  },
  tableSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  tableSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  tableCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: "hidden",
  },
  mutedValue: {
    color: Colors.textSecondary,
    fontWeight: "400",
    fontSize: 14,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  documentsWrap: {
    marginHorizontal: Spacing.lg,
  },
});
