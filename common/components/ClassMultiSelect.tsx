/**
 * Multi-select class picker — thin wrapper over the shared MultiSelectSheet
 * (bottom sheet, automatic search, Clear/Done). API kept stable for existing
 * call sites; onChange fires once with the final selection on Done.
 */
import React from "react";
import { View } from "react-native";
import { MultiSelectSheet } from "@/common/components/SelectSheet";

export interface ClassOption {
  id: string;
  label: string;
  name?: string;
  section?: string;
}

interface ClassMultiSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
  options: ClassOption[];
  placeholder?: string;
  label?: string;
  style?: object;
}

export function ClassMultiSelect({
  value,
  onChange,
  options,
  placeholder = "Select classes",
  label,
  style,
}: ClassMultiSelectProps) {
  return (
    <View style={style}>
      <MultiSelectSheet
        label={label}
        sheetTitle={label}
        value={value}
        onChange={onChange}
        options={options.map((c) => ({
          value: c.id,
          label: c.label ?? (c.section ? `${c.name}-${c.section}` : c.name ?? c.id),
        }))}
        placeholder={placeholder}
        hint="Leave empty for all classes."
      />
    </View>
  );
}
