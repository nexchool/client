/**
 * Class selector — thin wrapper over the shared SelectSheet (bottom sheet with
 * automatic search for long lists). API kept stable for existing call sites.
 */
import React from "react";
import { View } from "react-native";
import { SelectSheet } from "@/common/components/SelectSheet";

export interface ClassOption {
  id: string;
  label: string;
  name?: string;
  section?: string;
}

interface ClassSelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  options: ClassOption[];
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  /** Shown above the trigger when set */
  label?: string;
  /** Title inside the picker sheet (defaults to `label`) */
  modalTitle?: string;
  style?: object;
}

function toSheetOptions(options: ClassOption[]) {
  return options.map((c) => ({
    value: c.id,
    label: c.label ?? (c.section ? `${c.name}-${c.section}` : c.name ?? c.id),
  }));
}

export function ClassSelect({
  value,
  onChange,
  options,
  placeholder = "Select class",
  allowEmpty = true,
  emptyLabel = "All",
  label,
  modalTitle,
  style,
}: ClassSelectProps) {
  return (
    <View style={style}>
      <SelectSheet
        label={label}
        sheetTitle={modalTitle ?? label}
        value={value}
        onChange={onChange}
        options={toSheetOptions(options)}
        placeholder={placeholder}
        allowEmpty={allowEmpty}
        emptyLabel={emptyLabel}
      />
    </View>
  );
}
