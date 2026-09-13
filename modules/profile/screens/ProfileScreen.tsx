import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";

import { AppIcon } from "@/common/components/AppIcon";

import { DetailCard } from "@/common/components/DetailCard";
import { DetailRow } from "@/common/components/DetailRow";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useUiRole } from "@/modules/permissions/hooks/useUiRole";
import { studentService } from "@/modules/students/services/studentService";
import { teacherService } from "@/modules/teachers/services/teacherService";
import type { Student } from "@/modules/students/types";
import type { Teacher } from "@/modules/teachers/types";
import { uploadProfilePicture } from "@/modules/auth/services/profileService";
import { revokeAllMySessions } from "@/modules/auth/services/authService";
import { StudentDocumentsSection } from "@/modules/students/components/StudentDocumentsSection";
import { ApiException } from "@/common/services/api";
import { useTranslation } from "react-i18next";

import { ProfileHeroCard } from "@/modules/profile/components/ProfileHeroCard";
import { ProfileActionRow } from "@/modules/profile/components/ProfileActionRow";
import { useDialog, useToast } from "@/common/feedback";

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

/**
 * The one profile screen, for every role.
 *
 * There used to be two — a staff screen whose only real content was a link to
 * "My profile", and the profile behind it — plus a Settings screen carrying a
 * third copy of half the same rows. Three screens, one subject: the person
 * signed in. This is that screen.
 *
 * What belongs here is who you are and how your account is secured. What
 * belongs in Settings is how the app behaves on this phone — language, push,
 * biometrics — and the app's own shelf: help, legal, version. The two screens
 * no longer share a single row.
 */
export default function ProfileScreen() {
  const toast = useToast();
  const { confirm } = useDialog();
  const { t } = useTranslation(["profile", "navigation"]);
  const router = useRouter();
  const { palette, spacing, radius } = useTheme();
  const { user, tenantName, updateLocalUser, logout } = useAuth();
  const { role: userRole, isAdmin } = useUiRole();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [signingOutEverywhere, setSigningOutEverywhere] = useState(false);
  const [kind, setKind] = useState<ProfileKind>("account");
  const [student, setStudent] = useState<Student | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      // Which of the two this account is, if either. Both are core — a school
      // always has students and teachers — so there is nothing to check first;
      // the lookups themselves answer it.
      try {
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
  }, []);

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
      toast.info(t("profile:myProfile.alerts.permissionMessage"));
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
        toast.info(t("profile:myProfile.alerts.readPhotoMessage"));
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
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }, [updateLocalUser, student, teacher, t, toast]);

  const handleLogout = useCallback(async () => {
    const signOut = await confirm({
      title: t("profile:logoutConfirm.title", { defaultValue: "Sign out" }),
      description: t("profile:logoutConfirm.message", {
        defaultValue: "Are you sure you want to sign out?",
      }),
      tone: "danger",
      confirmLabel: t("profile:logoutConfirm.confirm", { defaultValue: "Sign out" }),
      cancelLabel: t("profile:logoutConfirm.cancel", { defaultValue: "Cancel" }),
    });
    if (signOut) void logout();
  }, [confirm, logout, t]);

  const handleSignOutAllDevices = useCallback(async () => {
    const signOut = await confirm({
      title: t("profile:signOutAll.title", { defaultValue: "Sign out from all devices" }),
      description: t("profile:signOutAll.message", {
        defaultValue:
          "This will sign you out everywhere. You'll need to log in again on each device.",
      }),
      tone: "danger",
      confirmLabel: t("profile:signOutAll.confirm", { defaultValue: "Sign out" }),
      cancelLabel: t("profile:logoutConfirm.cancel", { defaultValue: "Cancel" }),
    });
    if (!signOut) return;

    // Revoking server-side is the part that actually reaches the other phone.
    // If it fails we still sign out here: the person asked to be signed out,
    // and leaving them signed in on the device in their hand would be the
    // worse of the two failures. The toast says the rest did not happen.
    setSigningOutEverywhere(true);
    try {
      await revokeAllMySessions();
    } catch {
      toast.error(
        t("profile:signOutAll.failed", {
          defaultValue:
            "Could not sign out your other devices. You have been signed out here.",
        }),
      );
    } finally {
      setSigningOutEverywhere(false);
      void logout();
    }
  }, [confirm, logout, t, toast]);

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
        paddingBottom: spacing.scrollBottom,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero — tap the avatar to change the photo. This is the only place in
          the app that does it, for every role; it used to be a screen deeper. */}
      <ProfileHeroCard
        avatarUri={avatarUri}
        name={displayName}
        subline={subline}
        onPressAvatar={() => void pickAndUpload()}
        uploading={uploading}
      />

      {/* Contact Information */}
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
        {tenantName ? (
          <DetailRow
            icon="business-outline"
            label={t("profile:fields.school", { defaultValue: "School" })}
            value={tenantName}
          />
        ) : null}
        <DetailRow
          icon="ribbon-outline"
          label={t("profile:fields.designation")}
          value={roleLabel}
        />
      </DetailCard>

      {/* An administrator has no student or teacher record by design, so the
          notice is not about them — it is for a student or teacher whose login
          was never linked, which is a real thing for their school to fix. */}
      {kind === "account" && !isAdmin ? (
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

      {/*
        Actions, in the order somebody actually needs them: secure the account,
        then step across to how the app behaves, then the two ways to leave —
        which are last because a destructive action you can reach by accident
        on the way to something else is a bug.
      */}
      <ProfileActionRow
        icon="lock-closed-outline"
        label={t("profile:main.cards.changePassword")}
        hint={t("profile:main.cards.changePasswordSubtitle")}
        onPress={() =>
          router.push("/(protected)/profile/change-password" as never)
        }
      />

      <ProfileActionRow
        icon="settings-outline"
        label={t("profile:main.cards.appSettings")}
        hint={t("profile:main.cards.appSettingsSubtitle")}
        onPress={() => router.push("/(protected)/settings" as never)}
      />

      <ProfileActionRow
        icon="log-out-outline"
        label={t("profile:main.logout")}
        hint={t("profile:main.logoutSubtitle", {
          defaultValue: "Sign out of Nexchool on this device",
        })}
        trailing={null}
        destructive
        onPress={handleLogout}
      />

      <ProfileActionRow
        icon="phone-portrait-outline"
        label={t("profile:signOutAll.row", {
          defaultValue: "Sign out from all devices",
        })}
        hint={t("profile:signOutAll.hint", {
          defaultValue:
            "Ends every signed-in session, including this one. Use it if you lost a phone.",
        })}
        destructive
        trailing={
          signingOutEverywhere ? (
            <ActivityIndicator size="small" color={palette.error} />
          ) : null
        }
        onPress={signingOutEverywhere ? undefined : handleSignOutAllDevices}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingFill: { flex: 1, justifyContent: "center", alignItems: "center" },
});
