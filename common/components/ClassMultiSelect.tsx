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
  /** A caller may pass its own label; otherwise one is composed below. */
  label?: string | null;
  /** Nullable server-side — a class is named by its grade, not by this. */
  name?: string | null;
  /** What the school calls this class ("5 A"), composed server-side. */
  display_name?: string | null;
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
          // `name` is null for every class the structured form creates, so
          // the old fallback rendered "null-A". Prefer the server's label.
          label:
            c.label ??
            c.display_name ??
            (c.section ? `${c.name ?? ""}-${c.section}` : c.name ?? c.id),
        }))}
        placeholder={placeholder}
        hint="Leave empty for all classes."
      />
    </View>
  );
}
