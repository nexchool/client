import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
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
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { Button } from "@/common/components/Button";
import { DetailCard } from "@/common/components/DetailCard";
import { DetailRow } from "@/common/components/DetailRow";
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
import { ProfileHeroCard } from "@/modules/profile/components/ProfileHeroCard";
import { ProfileActionRow } from "@/modules/profile/components/ProfileActionRow";

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
  const { palette, spacing, radius } = useTheme();
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
        <Text variant="headlineMd" color="onSurface" style={{ marginTop: spacing.md }}>
          {t("languageSheet.title", { defaultValue: "Language" })}
        </Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
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
                  paddingVertical: spacing.md,
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
                  variant="bodyLg"
                  color={isSelected ? "onPrimaryContainer" : "onSurface"}
                  style={{ flex: 1 }}
                >
                  {LANGUAGE_LABELS[lng]}
                </Text>
                {isSelected ? (
                  <AppIcon name="checkmark" size="lg" color="onPrimaryContainer" />
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
  const { palette, spacing, radius } = useTheme();
  const { user, tenantName, enabledFeatures, updateLocalUser, logout } = useAuth();
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

  const subline = [roleLabel, tenantName].filter(Boolean).join(" · ");

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

  // Contact rows — read-only, pulled from role-aware data.
  const accountEmail = user?.email ?? undefined;
  const accountPhone = student?.phone ?? teacher?.phone ?? undefined;
  const accountDob = student?.date_of_birth ?? undefined;
  const accountClass =
    kind === "student" && student
      ? [student.class_name, student.roll_number ? `Roll ${student.roll_number}` : null]
          .filter(Boolean)
          .join(" · ")
      : undefined;

  if (loading) {
    return (
      <View style={styles.loadingFill}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingHorizontal: spacing.marginMobile,
        paddingTop: spacing.lg,
        paddingBottom: spacing[40] * 2,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero — tap avatar to change photo (real self-edit flow). */}
      <ProfileHeroCard
        avatarUri={avatarUri}
        name={displayName}
        subline={subline}
        onPressAvatar={() => void pickAndUpload()}
        uploading={uploading}
      />

      {/* Contact Information */}
      {accountEmail || accountPhone || accountDob || accountClass ? (
        <DetailCard
          title={t("profile:myProfile.sections.contact")}
          accent="secondary"
        >
          {accountEmail ? (
            <DetailRow
              icon="mail-outline"
              label={t("profile:fields.email")}
              value={accountEmail}
            />
          ) : null}
          {accountPhone ? (
            <DetailRow
              icon="call-outline"
              label={t("profile:fields.phone")}
              value={accountPhone}
            />
          ) : null}
          {accountDob ? (
            <DetailRow
              icon="calendar-outline"
              label={t("profile:fields.dateOfBirth")}
              value={accountDob}
            />
          ) : null}
          {accountClass ? (
            <DetailRow
              icon="school-outline"
              label={t("profile:fields.currentClass")}
              value={accountClass}
            />
          ) : null}
        </DetailCard>
      ) : null}

      {kind === "account" ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: spacing.sm,
            padding: spacing.md,
            backgroundColor: palette.surfaceContainer,
            borderRadius: radius.md,
          }}
        >
          <AppIcon name="information-circle-outline" size="lg" color="onSurfaceVariant" />
          <Text variant="bodyMd" color="onSurfaceVariant" style={{ flex: 1 }}>
            {t("profile:myProfile.notice")}
          </Text>
        </View>
      ) : null}

      {/* Role-specific detail cards (real data only). */}
      {kind === "student" && student ? (
        <>
          <DetailCard
            title={t("profile:myProfile.sections.basicInformation")}
            accent="tertiaryContainer"
          >
            <DetailRow
              icon="person-outline"
              label={t("profile:fields.fullName")}
              value={student.name}
            />
            {student.admission_number ? (
              <DetailRow
                icon="id-card-outline"
                label={t("profile:fields.admissionNumber")}
                value={student.admission_number}
              />
            ) : null}
            <DetailRow
              icon="calendar-outline"
              label={t("profile:fields.academicYear")}
              value={student.academic_year || t("profile:myProfile.dash")}
            />
            {student.gender ? (
              <DetailRow
                icon="male-female-outline"
                label={t("profile:fields.gender")}
                value={student.gender}
              />
            ) : null}
          </DetailCard>

          {student.guardian_name ||
          student.guardian_phone ||
          student.guardian_email ? (
            <DetailCard
              title={t("profile:myProfile.sections.guardian")}
              accent="primaryContainer"
            >
              {student.guardian_name ? (
                <DetailRow
                  icon="people-outline"
                  label={t("profile:fields.name")}
                  value={student.guardian_name}
                />
              ) : null}
              {student.guardian_relationship ? (
                <DetailRow
                  icon="heart-outline"
                  label={t("profile:fields.relationship")}
                  value={student.guardian_relationship}
                />
              ) : null}
              {student.guardian_phone ? (
                <DetailRow
                  icon="call-outline"
                  label={t("profile:fields.phone")}
                  value={student.guardian_phone}
                />
              ) : null}
              {student.guardian_email ? (
                <DetailRow
                  icon="mail-outline"
                  label={t("profile:fields.email")}
                  value={student.guardian_email}
                />
              ) : null}
            </DetailCard>
          ) : null}

          <StudentDocumentsSection studentId={student.id} />
        </>
      ) : null}

      {kind === "teacher" && teacher ? (
        <>
          <DetailCard
            title={t("profile:myProfile.sections.professional")}
            accent="tertiaryContainer"
          >
            {teacher.employee_id ? (
              <DetailRow
                icon="id-card-outline"
                label={t("profile:fields.employeeId")}
                value={teacher.employee_id}
              />
            ) : null}
            {teacher.designation ? (
              <DetailRow
                icon="ribbon-outline"
                label={t("profile:fields.designation")}
                value={teacher.designation}
              />
            ) : null}
            {teacher.department ? (
              <DetailRow
                icon="business-outline"
                label={t("profile:fields.department")}
                value={teacher.department}
              />
            ) : null}
            {teacher.qualification ? (
              <DetailRow
                icon="school-outline"
                label={t("profile:fields.qualification")}
                value={teacher.qualification}
              />
            ) : null}
            {teacher.specialization ? (
              <DetailRow
                icon="star-outline"
                label={t("profile:fields.specialization")}
                value={teacher.specialization}
              />
            ) : null}
            {teacher.experience_years != null ? (
              <DetailRow
                icon="time-outline"
                label={t("profile:fields.experience")}
                value={t("profile:myProfile.experienceYears", {
                  years: teacher.experience_years,
                })}
              />
            ) : null}
            {teacher.date_of_joining ? (
              <DetailRow
                icon="calendar-outline"
                label={t("profile:fields.dateOfJoining")}
                value={teacher.date_of_joining}
              />
            ) : null}
          </DetailCard>

          {teacher.address ? (
            <DetailCard
              title={t("profile:myProfile.sections.address")}
              accent="primaryContainer"
            >
              <DetailRow
                icon="location-outline"
                label={t("profile:fields.address")}
                value={teacher.address}
              />
            </DetailCard>
          ) : null}
        </>
      ) : null}

      {/* Security */}
      <ProfileActionRow
        icon="lock-closed-outline"
        label={t("profile:main.cards.changePassword")}
        hint={t("profile:main.cards.changePasswordSubtitle")}
        onPress={() =>
          router.push("/(protected)/profile/change-password" as never)
        }
      />
      <ProfileActionRow
        icon="log-out-outline"
        label={t("profile:signOutAll.row", {
          defaultValue: "Sign out from all devices",
        })}
        destructive
        trailing={null}
        onPress={handleSignOutAllDevices}
      />

      {/* Preferences */}
      <ProfileActionRow
        icon="language-outline"
        label={t("profile:preferences.language", { defaultValue: "Language" })}
        trailing={
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Text variant="bodyMd" color="onSurfaceVariant">
              {LANGUAGE_LABELS[currentLang]}
            </Text>
            <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
          </View>
        }
        onPress={() => setLanguageSheetOpen(true)}
      />
      <ProfileActionRow
        icon="notifications-outline"
        label={t("profile:preferences.notifications", { defaultValue: "Notifications" })}
        hint={t("profile:preferences.notificationsHint", {
          defaultValue: "Manage in your device settings",
        })}
        onPress={() => void Linking.openSettings()}
      />

      {/* About */}
      <ProfileActionRow
        icon="information-circle-outline"
        label={t("profile:about.version", { defaultValue: "App version" })}
        trailing={
          <Text variant="bodyMd" color="onSurfaceVariant">
            {appVersion}
          </Text>
        }
      />
      <ProfileActionRow
        icon="document-text-outline"
        label={t("profile:main.cards.terms")}
        trailing={null}
        onPress={() => void Linking.openURL(TERMS_URL)}
      />
      <ProfileActionRow
        icon="shield-checkmark-outline"
        label={t("profile:main.cards.privacy")}
        trailing={null}
        onPress={() => void Linking.openURL(PRIVACY_URL)}
      />

      {/* Sign out */}
      <ProfileActionRow
        icon="log-out-outline"
        label={t("profile:main.logout")}
        trailing={null}
        destructive
        onPress={handleLogout}
      />

      <LanguageSheet
        visible={languageSheetOpen}
        onClose={() => setLanguageSheetOpen(false)}
        current={currentLang}
        onSelect={(lng) => void handleSelectLanguage(lng)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingFill: { flex: 1, justifyContent: "center", alignItems: "center" },
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
