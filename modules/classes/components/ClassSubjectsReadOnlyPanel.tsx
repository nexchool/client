import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { classAcademicApi } from "@/modules/academics/api/classAcademicApi";
import type {
  ClassSubjectOffering,
  SubjectTeacherAssignment,
} from "@/modules/academics/types";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";

function primaryTeacherName(assignments: SubjectTeacherAssignment[], classSubjectId: string): string | null {
  const forCs = assignments.filter((a) => a.class_subject_id === classSubjectId && a.is_active);
  const primary = forCs.find((a) => a.role === "primary");
  const pick = primary ?? forCs[0];
  if (!pick) return null;
  return pick.teacher_name ?? pick.employee_id ?? null;
}

function subjectTypeLabel(offering: ClassSubjectOffering): string {
  if (offering.is_elective_bucket) return "Elective";
  if (offering.is_mandatory) return "Core";
  return "Optional";
}

interface Props {
  classId: string;
}

/**
 * Read-only list of class subjects with type badge and primary teacher.
 */
export function ClassSubjectsReadOnlyPanel({ classId }: Props) {
  const { isFeatureEnabled } = useAuth();
  const { palette, spacing, radius } = useTheme();
  const timetable = isFeatureEnabled("timetable");

  const [offerings, setOfferings] = useState<ClassSubjectOffering[]>([]);
  const [teachers, setTeachers] = useState<SubjectTeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const subRes = await classAcademicApi.listClassSubjects(classId);
      const items = subRes?.items ?? [];
      setOfferings(Array.isArray(items) ? items : []);

      if (timetable) {
        try {
          const ttRes = await classAcademicApi.listSubjectTeachers(classId);
          const tItems = ttRes?.items ?? [];
          setTeachers(Array.isArray(tItems) ? tItems : []);
        } catch {
          setTeachers([]);
        }
      } else {
        setTeachers([]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load subjects");
      setOfferings([]);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [classId, timetable]);

  useEffect(() => {
    load();
  }, [load]);

  const lines = useMemo(() => {
    return offerings
      .filter((o) => o.status === "active")
      .map((o) => ({
        id: o.id,
        name: o.subject_name ?? "Subject",
        typeLabel: subjectTypeLabel(o),
        teacher: timetable ? primaryTeacherName(teachers, o.id) : null,
      }));
  }, [offerings, teachers, timetable]);

  if (loading) {
    return (
      <View style={{ padding: spacing.xl, alignItems: "center" }}>
        <ActivityIndicator size="small" color={palette.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ paddingVertical: spacing.sm }}>
        <Text variant="bodySm" color="error">{error}</Text>
      </View>
    );
  }

  if (lines.length === 0) {
    return (
      <View style={{ paddingVertical: spacing.sm }}>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ fontStyle: "italic" }}>
          No subjects assigned to this class.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ paddingVertical: spacing.sm }}>
      {lines.map((line) => (
        <View key={line.id} style={[styles.card, { paddingVertical: spacing.md, borderBottomColor: palette.surfaceContainerHighest }]}>
          <View style={styles.titleRow}>
            <Text variant="labelLg" color="onSurface" style={{ flex: 1 }}>{line.name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: palette.primaryContainer, borderRadius: radius.sm }]}>
              <Text variant="overline" color="onPrimaryContainer">{line.typeLabel}</Text>
            </View>
          </View>
          {line.teacher && (
            <Text variant="bodySm" color="onSurfaceVariant">Teacher: {line.teacher}</Text>
          )}
          {!line.teacher && timetable && (
            <Text variant="bodySm" color="onSurfaceVariant" style={{ fontStyle: "italic" }}>No teacher assigned</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderBottomWidth: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2 },
});
