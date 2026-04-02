import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Pressable,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";

export interface DateFieldProps {
  label?: string;
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
  disabled?: boolean;
  /** @deprecated No longer used — Android uses the system dialog; iOS uses a nested modal. Safe to remove from call sites. */
  useOverlayInsideModal?: boolean;
}

function parseIsoDate(value?: string | null): Date {
  if (!value) return new Date();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDisplay(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  try {
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

/** iOS only: sheet with spinner + Done/Cancel */
function IosDatePickerSheet({
  label,
  tempDate,
  minimumDate,
  maximumDate,
  onChange,
  onClose,
  onConfirm,
}: {
  label?: string;
  tempDate: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onChange: (e: DateTimePickerEvent, d?: Date) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{label || "Select date"}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.pickerContainer}>
        <DateTimePicker
          mode="date"
          value={tempDate}
          onChange={onChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          display="spinner"
        />
      </View>
      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={styles.footerBtnSecondary}
          onPress={onClose}
        >
          <Text style={styles.footerBtnSecondaryText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerBtnPrimary}
          onPress={onConfirm}
        >
          <Text style={styles.footerBtnPrimaryText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = "Select date",
  minimumDate,
  maximumDate,
  error,
  disabled,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(parseIsoDate(value));

  const handleOpen = () => {
    if (disabled) return;
    setTempDate(parseIsoDate(value));
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleIosChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setTempDate(date);
  };

  /** Android: system dialog — no custom Modal; handle dismiss vs confirm via event.type */
  const handleAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === "dismissed" || event.type === "neutralButtonPressed") {
      setOpen(false);
      return;
    }
    setOpen(false);
    if (event.type === "set" && date) {
      onChange(toIsoDate(date));
    }
  };

  const handleConfirm = () => {
    onChange(toIsoDate(tempDate));
    setOpen(false);
  };

  const displayText = formatDisplay(value);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.trigger,
          !!error && styles.triggerError,
          disabled && styles.triggerDisabled,
        ]}
        activeOpacity={0.7}
        onPress={handleOpen}
        disabled={disabled}
      >
        <Text
          style={[
            styles.triggerText,
            !displayText && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {displayText || placeholder}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={18}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {Platform.OS === "android" && open ? (
        <DateTimePicker
          mode="date"
          value={tempDate}
          display="calendar"
          onChange={handleAndroidChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          style={styles.androidPickerAnchor}
        />
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          onRequestClose={handleClose}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={[StyleSheet.absoluteFill, styles.modalBackdrop]}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Dismiss date picker"
            />
            <View style={styles.modalSheetCenter} pointerEvents="box-none">
              <IosDatePickerSheet
                label={label}
                tempDate={tempDate}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={handleIosChange}
                onClose={handleClose}
                onConfirm={handleConfirm}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  triggerError: {
    borderColor: Colors.error,
  },
  triggerDisabled: {
    opacity: 0.55,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  placeholderText: {
    color: Colors.textTertiary,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.error,
  },
  /** Host view for the Android system date dialog — kept off-screen so layout is unchanged. */
  androidPickerAnchor: {
    position: "absolute",
    left: -9999,
    top: 0,
    width: 1,
    height: 1,
  },
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    backgroundColor: Colors.overlay,
  },
  modalSheetCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    borderRadius: Layout.borderRadius.lg,
    backgroundColor: Colors.background,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  pickerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  footerBtnSecondary: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.backgroundSecondary,
  },
  footerBtnSecondaryText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  footerBtnPrimary: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.primary,
  },
  footerBtnPrimaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
