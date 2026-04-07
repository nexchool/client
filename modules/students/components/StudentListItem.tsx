import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { ProfileAvatar } from "@/common/components/ProfileAvatar";
import { Student } from "../types";

interface StudentListItemProps {
  student: Student;
  onPress: (student: Student) => void;
}

export const StudentListItem: React.FC<StudentListItemProps> = ({
  student,
  onPress,
}) => {
  const { t } = useTranslation("students");
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(student)}
      activeOpacity={0.7}
    >
      <ProfileAvatar
        uri={student.profile_picture}
        size={48}
        name={student.name}
        iconColor={Colors.primary}
        placeholderBg={Colors.backgroundSecondary}
        style={{ marginRight: Spacing.md }}
      />
      <View style={styles.content}>
        <Text style={styles.name}>
          {student.name || t("listItem.unknownName")}
        </Text>
        <Text style={styles.info}>
          {student.admission_number} •{" "}
          {student.class_name || t("listItem.noClass")}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  info: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
