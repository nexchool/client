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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("profile");
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
    return user?.email?.split("@")[0] ?? t("myProfile.defaultDisplayName");
  }, [student, teacher, user, t]);

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
        t("myProfile.alerts.permissionTitle"),
        t("myProfile.alerts.permissionMessage"),
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
          t("myProfile.alerts.readPhotoTitle"),
          t("myProfile.alerts.readPhotoMessage"),
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
          : t("myProfile.alerts.uploadFailedFallback");
      Alert.alert(t("myProfile.alerts.uploadFailedTitle"), msg);
    } finally {
      setUploading(false);
    }
  }, [updateLocalUser, student, teacher, t]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t("myProfile.screenTitle")}
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
            <Text style={styles.heroHint}>{t("myProfile.heroHint")}</Text>
          </View>

          <TableSection title={t("myProfile.sections.account")}>
            <TableRow label={t("fields.loginEmail")} value={user?.email} />
            <View style={rowStyles.row}>
              <Text style={rowStyles.labelCell}>{t("fields.profilePhoto")}</Text>
              <Text style={[rowStyles.valueCell, styles.mutedValue]}>
                {t("fields.profilePhotoHint")}
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
              <Text style={styles.noticeText}>{t("myProfile.notice")}</Text>
            </View>
          )}

          {kind === "student" && student && (
            <>
              <TableSection title={t("myProfile.sections.basicInformation")}>
                <TableRow label={t("fields.fullName")} value={student.name} />
                <TableRow
                  label={t("fields.admissionNumber")}
                  value={student.admission_number}
                />
                <TableRow
                  label={t("fields.academicYear")}
                  value={student.academic_year || t("myProfile.dash")}
                />
                <TableRow label={t("fields.gender")} value={student.gender} />
                <TableRow
                  label={t("fields.dateOfBirth")}
                  value={student.date_of_birth}
                />
              </TableSection>

              <TableSection title={t("myProfile.sections.contact")}>
                <TableRow label={t("fields.email")} value={student.email} />
                <TableRow label={t("fields.phone")} value={student.phone} />
                <TableRow label={t("fields.address")} value={student.address} />
              </TableSection>

              <TableSection title={t("myProfile.sections.guardian")}>
                <TableRow label={t("fields.name")} value={student.guardian_name} />
                <TableRow
                  label={t("fields.relationship")}
                  value={student.guardian_relationship}
                />
                <TableRow label={t("fields.phone")} value={student.guardian_phone} />
                <TableRow label={t("fields.email")} value={student.guardian_email} />
              </TableSection>

              <TableSection title={t("myProfile.sections.classInfo")}>
                <TableRow
                  label={t("fields.currentClass")}
                  value={student.class_name || t("myProfile.notAssigned")}
                />
                <TableRow label={t("fields.rollNumber")} value={student.roll_number} />
              </TableSection>

              <View style={styles.documentsWrap}>
                <StudentDocumentsSection studentId={student.id} />
              </View>
            </>
          )}

          {kind === "teacher" && teacher && (
            <>
              <TableSection title={t("myProfile.sections.basicInformation")}>
                <TableRow label={t("fields.fullName")} value={teacher.name} />
                <TableRow label={t("fields.employeeId")} value={teacher.employee_id} />
                <TableRow label={t("fields.email")} value={teacher.email} />
                <TableRow label={t("fields.phone")} value={teacher.phone} />
                <TableRow label={t("fields.status")} value={teacher.status} />
              </TableSection>

              <TableSection title={t("myProfile.sections.professional")}>
                <TableRow label={t("fields.designation")} value={teacher.designation} />
                <TableRow label={t("fields.department")} value={teacher.department} />
                <TableRow label={t("fields.qualification")} value={teacher.qualification} />
                <TableRow
                  label={t("fields.specialization")}
                  value={teacher.specialization}
                />
                <TableRow
                  label={t("fields.experience")}
                  value={
                    teacher.experience_years != null
                      ? t("myProfile.experienceYears", {
                          years: teacher.experience_years,
                        })
                      : undefined
                  }
                />
                <TableRow
                  label={t("fields.dateOfJoining")}
                  value={teacher.date_of_joining}
                />
              </TableSection>

              {teacher.address ? (
                <TableSection title={t("myProfile.sections.address")}>
                  <TableRow label={t("fields.address")} value={teacher.address} />
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
