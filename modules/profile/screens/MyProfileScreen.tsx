import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Linking,
} from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/common/theme";
import { ScreenContainer } from "@/common/components/ScreenContainer";
import { Button } from "@/common/components/Button";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useUiRole } from "@/modules/permissions/hooks/useUiRole";
import { studentService } from "@/modules/students/services/studentService";
import { teacherService } from "@/modules/teachers/services/teacherService";
import type { Student } from "@/modules/students/types";
import type { Teacher } from "@/modules/teachers/types";
import { uploadProfilePicture } from "@/modules/auth/services/profileService";
import { StudentDocumentsSection } from "@/modules/students/components/StudentDocumentsSection";
import { ApiException } from "@/common/services/api";
import { useTranslation } from "react-i18next";
import { setAppLanguage, getAppLanguage } from "@/i18n/language";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n/config";

type ProfileKind = "student" | "teacher" | "account";

const TERMS_URL = "https://nexchool.in/terms";
const PRIVACY_URL = "https://nexchool.in/privacy";

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

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  hi: "हिन्दी",
  gu: "ગુજરાતી",
};

type CardSectionProps = {
  title: string;
  children: React.ReactNode;
};

function CardSection({ title, children }: CardSectionProps) {
  const { palette, spacing, radius, typography } = useTheme();
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text
        style={[
          typography.labelSm,
          {
            color: palette.onSurfaceVariant,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginBottom: spacing.sm,
            includeFontPadding: false,
          },
        ]}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: palette.outlineVariant,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

type InfoRowProps = {
  label: string;
  value?: string | number | null;
  isLast?: boolean;
};

function InfoRow({ label, value, isLast }: InfoRowProps) {
  const { palette, spacing, typography } = useTheme();
  if (value === undefined || value === null || value === "") return null;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: palette.outlineVariant,
      }}
    >
      <Text
        style={[
          typography.labelMd,
          { color: palette.onSurfaceVariant, width: "40%", includeFontPadding: false },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          typography.bodyMd,
          { color: palette.onSurface, flex: 1, includeFontPadding: false },
        ]}
      >
        {String(value)}
      </Text>
    </View>
  );
}

type ActionRowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
};

function ActionRow({
  icon,
  label,
  hint,
  trailing,
  onPress,
  destructive,
  isLast,
}: ActionRowProps) {
  const { palette, spacing, typography } = useTheme();
  const textColor = destructive ? palette.error : palette.onSurface;
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: palette.surfaceContainer }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: pressed ? palette.surfaceContainer : "transparent",
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: palette.outlineVariant,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: destructive ? `${palette.error}1A` : palette.surfaceContainer,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={20} color={textColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            typography.bodyMd,
            { color: textColor, includeFontPadding: false },
          ]}
        >
          {label}
        </Text>
        {hint ? (
          <Text
            style={[
              typography.labelSm,
              { color: palette.onSurfaceVariant, marginTop: 2, includeFontPadding: false },
            ]}
          >
            {hint}
          </Text>
        ) : null}
      </View>
      {trailing ?? (
        <Ionicons name="chevron-forward" size={18} color={palette.onSurfaceVariant} />
      )}
    </Pressable>
  );
}

function LanguageSheet({
  visible,
  onClose,
  current,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  current: SupportedLanguage;
  onSelect: (lng: SupportedLanguage) => void;
}) {
  const { palette, spacing, radius, typography } = useTheme();
  const { t } = useTranslation("profile");
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: "rgba(11, 28, 48, 0.40)" }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.lg,
            paddingBottom: spacing.xl,
          },
        ]}
      >
        <View
          style={[
            styles.handle,
            { backgroundColor: palette.outlineVariant, alignSelf: "center" },
          ]}
        />
        <Text
          style={[
            typography.headlineMd,
            { color: palette.onSurface, marginTop: spacing.md },
          ]}
        >
          {t("languageSheet.title", { defaultValue: "Language" })}
        </Text>
        <Text
          style={[
            typography.bodyMd,
            { color: palette.onSurfaceVariant, marginTop: spacing.xs },
          ]}
        >
          {t("languageSheet.subtitle", {
            defaultValue: "Choose your preferred language.",
          })}
        </Text>

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {SUPPORTED_LANGUAGES.map((lng) => {
            const isSelected = lng === current;
            return (
              <Pressable
                key={lng}
                onPress={() => onSelect(lng)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.DEFAULT,
                  backgroundColor: isSelected
                    ? palette.primaryContainer
                    : pressed
                    ? palette.surfaceContainer
                    : "transparent",
                })}
              >
                <Text
                  style={[
                    typography.bodyLg,
                    {
                      color: isSelected ? palette.onPrimaryContainer : palette.onSurface,
                      flex: 1,
                    },
                  ]}
                >
                  {LANGUAGE_LABELS[lng]}
                </Text>
                {isSelected ? (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={palette.onPrimaryContainer}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: spacing.md }}>
          <Button variant="ghost" fullWidth onPress={onClose}>
            {t("languageSheet.cancel", { defaultValue: "Cancel" })}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

export default function MyProfileScreen() {
  const { t } = useTranslation(["profile", "navigation"]);
  const router = useRouter();
  const { palette, spacing, radius, typography } = useTheme();
  const { user, enabledFeatures, updateLocalUser, logout } = useAuth();
  const { role: userRole } = useUiRole();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState<ProfileKind>("account");
  const [student, setStudent] = useState<Student | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(getAppLanguage());

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
            const tch = await teacherService.getMyProfile();
            if (!cancelled) {
              setTeacher(tch);
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
    return user?.email?.split("@")[0] ?? t("profile:myProfile.defaultDisplayName");
  }, [student, teacher, user, t]);

  const avatarUri = useMemo(() => {
    return (
      user?.profile_picture_url ||
      student?.profile_picture ||
      teacher?.profile_picture ||
      null
    );
  }, [user, student, teacher]);

  const roleLabel = t(`navigation:roles.${userRole.toLowerCase()}`, {
    defaultValue: userRole,
  });

  const schoolName =
    (user as { tenant_name?: string | null } | null | undefined)?.tenant_name ?? null;

  const pickAndUpload = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        t("profile:myProfile.alerts.permissionTitle"),
        t("profile:myProfile.alerts.permissionMessage"),
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
          t("profile:myProfile.alerts.readPhotoTitle"),
          t("profile:myProfile.alerts.readPhotoMessage"),
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
        const refreshedTeacher = await teacherService.getMyProfile();
        setTeacher(refreshedTeacher);
      }
    } catch (e) {
      const msg =
        e instanceof ApiException
          ? e.message
          : t("profile:myProfile.alerts.uploadFailedFallback");
      Alert.alert(t("profile:myProfile.alerts.uploadFailedTitle"), msg);
    } finally {
      setUploading(false);
    }
  }, [updateLocalUser, student, teacher, t]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      t("profile:logoutConfirm.title", { defaultValue: "Sign out" }),
      t("profile:logoutConfirm.message", {
        defaultValue: "Are you sure you want to sign out?",
      }),
      [
        { text: t("profile:logoutConfirm.cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("profile:logoutConfirm.confirm", { defaultValue: "Sign out" }),
          style: "destructive",
          onPress: () => {
            void logout();
          },
        },
      ],
    );
  }, [logout, t]);

  const handleSignOutAllDevices = useCallback(() => {
    Alert.alert(
      t("profile:signOutAll.title", { defaultValue: "Sign out from all devices" }),
      t("profile:signOutAll.message", {
        defaultValue:
          "This will sign you out everywhere. You'll need to log in again on each device.",
      }),
      [
        { text: t("profile:logoutConfirm.cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("profile:signOutAll.confirm", { defaultValue: "Sign out" }),
          style: "destructive",
          onPress: () => {
            void logout();
          },
        },
      ],
    );
  }, [logout, t]);

  const handleSelectLanguage = useCallback(async (lng: SupportedLanguage) => {
    setLanguageSheetOpen(false);
    if (lng === currentLang) return;
    await setAppLanguage(lng);
    setCurrentLang(lng);
  }, [currentLang]);

  const appVersion = Constants.expoConfig?.version ?? "—";

  // Build account info rows (read-only) — pulled from role-aware data.
  const accountEmail = user?.email ?? undefined;
  const accountPhone = student?.phone ?? teacher?.phone ?? undefined;
  const accountDob = student?.date_of_birth ?? undefined;
  const accountClass =
    kind === "student" && student
      ? [student.class_name, student.roll_number ? `Roll ${student.roll_number}` : null]
          .filter(Boolean)
          .join(" · ")
      : undefined;

  return (
    <ScreenContainer>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{ width: 44, height: 44, justifyContent: "center" }}
        >
          <Ionicons name="chevron-back" size={24} color={palette.onSurface} />
        </Pressable>
        <Text
          style={[
            typography.headlineMd,
            { color: palette.onSurface, flex: 1, textAlign: "center" },
          ]}
        >
          {t("profile:myProfile.screenTitle")}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: spacing.xl }}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <>
          {/* Header card: avatar + name + role pill + school */}
          <View
            style={{
              alignItems: "center",
              backgroundColor: palette.surfaceContainerLow,
              borderRadius: radius.lg,
              paddingVertical: spacing.xl,
              paddingHorizontal: spacing.lg,
              marginTop: spacing.md,
            }}
          >
            <Pressable
              onPress={() => void pickAndUpload()}
              disabled={uploading}
              style={{ position: "relative", marginBottom: spacing.md }}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                  }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor: palette.surfaceContainer,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="person" size={44} color={palette.primary} />
                </View>
              )}
              {uploading ? (
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      borderRadius: 48,
                      backgroundColor: "rgba(0,0,0,0.45)",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <View
                  style={{
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: palette.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: palette.surfaceContainerLow,
                  }}
                >
                  <Ionicons name="camera" size={14} color={palette.onPrimary} />
                </View>
              )}
            </Pressable>

            <Text
              style={[
                typography.display,
                { color: palette.onSurface, textAlign: "center", fontSize: 24, lineHeight: 30 },
              ]}
              numberOfLines={1}
            >
              {displayName}
            </Text>

            <View
              style={{
                marginTop: spacing.sm,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: radius.full,
                backgroundColor: palette.primaryContainer,
              }}
            >
              <Text
                style={[
                  typography.labelSm,
                  { color: palette.onPrimaryContainer, includeFontPadding: false },
                ]}
              >
                {roleLabel}
              </Text>
            </View>

            {schoolName ? (
              <Text
                style={[
                  typography.bodyMd,
                  { color: palette.onSurfaceVariant, marginTop: spacing.xs, textAlign: "center" },
                ]}
                numberOfLines={1}
              >
                {schoolName}
              </Text>
            ) : null}
          </View>

          {/* Account section */}
          <CardSection title={t("profile:myProfile.sections.account")}>
            <InfoRow label={t("profile:fields.email")} value={accountEmail} />
            <InfoRow label={t("profile:fields.phone")} value={accountPhone} />
            <InfoRow label={t("profile:fields.dateOfBirth")} value={accountDob} />
            <InfoRow
              label={t("profile:fields.currentClass")}
              value={accountClass}
              isLast
            />
          </CardSection>

          {/* Security section */}
          <CardSection title={t("profile:sections.security", { defaultValue: "Security" })}>
            <ActionRow
              icon="lock-closed-outline"
              label={t("profile:main.cards.changePassword")}
              hint={t("profile:main.cards.changePasswordSubtitle")}
              onPress={() =>
                router.push("/(protected)/profile/change-password" as never)
              }
            />
            <ActionRow
              icon="log-out-outline"
              label={t("profile:signOutAll.row", {
                defaultValue: "Sign out from all devices",
              })}
              destructive
              onPress={handleSignOutAllDevices}
              isLast
            />
          </CardSection>

          {/* Preferences section */}
          <CardSection title={t("profile:sections.preferences", { defaultValue: "Preferences" })}>
            <ActionRow
              icon="language-outline"
              label={t("profile:preferences.language", { defaultValue: "Language" })}
              trailing={
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]}>
                    {LANGUAGE_LABELS[currentLang]}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={palette.onSurfaceVariant} />
                </View>
              }
              onPress={() => setLanguageSheetOpen(true)}
            />
            <ActionRow
              icon="notifications-outline"
              label={t("profile:preferences.notifications", {
                defaultValue: "Notifications",
              })}
              hint={t("profile:preferences.notificationsHint", {
                defaultValue: "Manage in your device settings",
              })}
              onPress={() => void Linking.openSettings()}
              isLast
            />
          </CardSection>

          {/* About section */}
          <CardSection title={t("profile:sections.about", { defaultValue: "About" })}>
            <ActionRow
              icon="information-circle-outline"
              label={t("profile:about.version", { defaultValue: "App version" })}
              trailing={
                <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]}>
                  {appVersion}
                </Text>
              }
            />
            <ActionRow
              icon="document-text-outline"
              label={t("profile:main.cards.terms")}
              trailing={
                <Ionicons name="open-outline" size={18} color={palette.onSurfaceVariant} />
              }
              onPress={() => void Linking.openURL(TERMS_URL)}
            />
            <ActionRow
              icon="shield-checkmark-outline"
              label={t("profile:main.cards.privacy")}
              trailing={
                <Ionicons name="open-outline" size={18} color={palette.onSurfaceVariant} />
              }
              onPress={() => void Linking.openURL(PRIVACY_URL)}
              isLast
            />
          </CardSection>

          {kind === "account" && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: spacing.sm,
                marginTop: spacing.lg,
                padding: spacing.md,
                backgroundColor: palette.surfaceContainer,
                borderRadius: radius.md,
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={palette.onSurfaceVariant}
              />
              <Text
                style={[
                  typography.bodyMd,
                  { color: palette.onSurfaceVariant, flex: 1 },
                ]}
              >
                {t("profile:myProfile.notice")}
              </Text>
            </View>
          )}

          {/* Role-specific extra details */}
          {kind === "student" && student && (
            <>
              <CardSection title={t("profile:myProfile.sections.basicInformation")}>
                <InfoRow label={t("profile:fields.fullName")} value={student.name} />
                <InfoRow
                  label={t("profile:fields.admissionNumber")}
                  value={student.admission_number}
                />
                <InfoRow
                  label={t("profile:fields.academicYear")}
                  value={student.academic_year || t("profile:myProfile.dash")}
                />
                <InfoRow label={t("profile:fields.gender")} value={student.gender} isLast />
              </CardSection>

              <CardSection title={t("profile:myProfile.sections.guardian")}>
                <InfoRow label={t("profile:fields.name")} value={student.guardian_name} />
                <InfoRow
                  label={t("profile:fields.relationship")}
                  value={student.guardian_relationship}
                />
                <InfoRow
                  label={t("profile:fields.phone")}
                  value={student.guardian_phone}
                />
                <InfoRow
                  label={t("profile:fields.email")}
                  value={student.guardian_email}
                  isLast
                />
              </CardSection>

              <View style={{ marginTop: spacing.lg }}>
                <StudentDocumentsSection studentId={student.id} />
              </View>
            </>
          )}

          {kind === "teacher" && teacher && (
            <>
              <CardSection title={t("profile:myProfile.sections.professional")}>
                <InfoRow
                  label={t("profile:fields.employeeId")}
                  value={teacher.employee_id}
                />
                <InfoRow
                  label={t("profile:fields.designation")}
                  value={teacher.designation}
                />
                <InfoRow
                  label={t("profile:fields.department")}
                  value={teacher.department}
                />
                <InfoRow
                  label={t("profile:fields.qualification")}
                  value={teacher.qualification}
                />
                <InfoRow
                  label={t("profile:fields.specialization")}
                  value={teacher.specialization}
                />
                <InfoRow
                  label={t("profile:fields.experience")}
                  value={
                    teacher.experience_years != null
                      ? t("profile:myProfile.experienceYears", {
                          years: teacher.experience_years,
                        })
                      : undefined
                  }
                />
                <InfoRow
                  label={t("profile:fields.dateOfJoining")}
                  value={teacher.date_of_joining}
                  isLast
                />
              </CardSection>

              {teacher.address ? (
                <CardSection title={t("profile:myProfile.sections.address")}>
                  <InfoRow label={t("profile:fields.address")} value={teacher.address} isLast />
                </CardSection>
              ) : null}
            </>
          )}

          {/* Bottom destructive Sign out button */}
          <View style={{ marginTop: spacing.xl, marginBottom: spacing.lg }}>
            <Button variant="destructive" fullWidth onPress={handleLogout}>
              {t("profile:main.logout")}
            </Button>
          </View>
        </>
      )}

      <LanguageSheet
        visible={languageSheetOpen}
        onClose={() => setLanguageSheetOpen(false)}
        current={currentLang}
        onSelect={(lng) => void handleSelectLanguage(lng)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});
