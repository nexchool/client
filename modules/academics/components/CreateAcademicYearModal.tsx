import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  TextInput,
  StyleSheet,
} from "react-native";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { Dialog } from "@/common/components/Dialog";
import { academicYearService, type AcademicYear } from "../services/academicYearService";
import { DatePicker } from '@/common/components/datepicker';

interface CreateAcademicYearModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (year: AcademicYear) => void;
}

export function CreateAcademicYearModal({
  visible,
  onClose,
  onSuccess,
}: CreateAcademicYearModalProps) {
  const { t } = useTranslation("common");
  const { palette, spacing, radius, typography: { bodyMd: bodyMdType } } = useTheme();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName("");
      setStartDate("");
      setEndDate("");
      setError(null);
    }
  }, [visible]);

  const handleSubmit = async () => {
    const n = name.trim();
    const sd = startDate.trim();
    const ed = endDate.trim();
    if (!n || !sd || !ed) {
      setError(t("academicYearCreate.errors.required"));
      return;
    }
    const startMatch = /^\d{4}-\d{2}-\d{2}$/.test(sd);
    const endMatch = /^\d{4}-\d{2}-\d{2}$/.test(ed);
    if (!startMatch || !endMatch) {
      setError(t("academicYearCreate.errors.dateFormat"));
      return;
    }
    if (new Date(sd) >= new Date(ed)) {
      setError(t("academicYearCreate.errors.startBeforeEnd"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await academicYearService.createAcademicYear({
        name: n,
        start_date: sd,
        end_date: ed,
        is_active: true,
      });
      onSuccess(created);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? t("academicYearCreate.errors.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title={t("academicYearCreate.title")}
      // No tone icon: this is a form to fill in, not a question to answer, and
      // the well would push the first field below the fold on a small phone.
      icon={null}
      actions={[
        { label: t("cancel"), onPress: onClose, disabled: loading },
        {
          label: t("academicYearCreate.create"),
          onPress: () => void handleSubmit(),
          loading,
          disabled: loading,
        },
      ]}
    >
      {error ? (
        <View
          style={{
            backgroundColor: palette.errorContainer,
            padding: spacing.sm,
            borderRadius: radius.sm,
            borderLeftWidth: 4,
            borderLeftColor: palette.error,
          }}
        >
          <Text variant="labelMd" color="error">
            {error}
          </Text>
        </View>
      ) : null}

      <View>
        <Text variant="labelMd" color="onSurface" style={{ marginBottom: spacing.xs }}>
          {t("academicYearCreate.nameLabel")}
        </Text>
        <TextInput
          style={[
            styles.input,
            bodyMdType,
            {
              borderColor: palette.outlineVariant,
              borderRadius: radius.sm,
              padding: spacing.md,
              color: palette.onSurface,
              backgroundColor: palette.surfaceContainerLow,
            },
          ]}
          value={name}
          onChangeText={setName}
          placeholder={t("academicYearCreate.namePlaceholder")}
          placeholderTextColor={palette.outline}
          editable={!loading}
        />
      </View>

      <DatePicker
        label={t("academicYearCreate.startDate")}
        value={startDate}
        onChange={setStartDate}
        placeholder={t("academicYearCreate.datePlaceholder")}
      />

      <DatePicker
        label={t("academicYearCreate.endDate")}
        value={endDate}
        onChange={setEndDate}
        placeholder={t("academicYearCreate.datePlaceholder")}
      />
    </Dialog>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
  },
});
