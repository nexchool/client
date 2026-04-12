import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { classAcademicApi } from "@/modules/academics/api/classAcademicApi";
import type {
  ClassSubjectOffering,
  SubjectTeacherAssignment,
} from "@/modules/academics/types";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";

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
      <View style={styles.center}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (lines.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.empty}>No subjects assigned to this class.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {lines.map((line) => (
        <View key={line.id} style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.subjectName}>{line.name}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{line.typeLabel}</Text>
            </View>
          </View>
          {line.teacher && (
            <Text style={styles.teacherLine}>Teacher: {line.teacher}</Text>
          )}
          {!line.teacher && timetable && (
            <Text style={styles.teacherEmpty}>No teacher assigned</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: Spacing.sm,
  },
  center: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  card: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.primary + "15",
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  teacherLine: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  teacherEmpty: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontStyle: "italic",
  },
  empty: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  error: {
    fontSize: 14,
    color: Colors.error,
  },
});
