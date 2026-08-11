/**
 * Class selector — thin wrapper over the shared SelectSheet (bottom sheet with
 * automatic search for long lists). API kept stable for existing call sites.
 */
import React from "react";
import { View } from "react-native";
import { SelectSheet } from "@/common/components/SelectSheet";

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
    // `name` is null for every class the structured form creates, so the
    // old fallback rendered "null-A". Prefer the server's label.
    label:
      c.label ??
      c.display_name ??
      (c.section ? `${c.name ?? ""}-${c.section}` : c.name ?? c.id),
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
