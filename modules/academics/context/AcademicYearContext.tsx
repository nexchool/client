import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAcademicYears } from "../hooks/useAcademicYears";
import type { AcademicYear } from "../services/academicYearService";
import { getSelectedAcademicYearId, setSelectedAcademicYearId as persistSelectedAcademicYearId } from "@/common/utils/storage";

type AcademicYearContextType = {
  /** Currently selected academic year ID for filtering across the app. Empty = show all. */
  selectedAcademicYearId: string;
  setSelectedAcademicYearId: (id: string) => void;
  /** All academic years for the dropdown */
  academicYears: AcademicYear[];
  isLoading: boolean;
};

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>("");
  const [hydrationDone, setHydrationDone] = useState(false);
  const { data: academicYears = [], isLoading } = useAcademicYears(false);

  // Hydrate from persisted storage on mount
  useEffect(() => {
    getSelectedAcademicYearId().then((id) => {
      setSelectedAcademicYearId(id ?? "");
      setHydrationDone(true);
    });
  }, []);

  // Settle on a year as soon as the list is known.
  //
  // Two cases land here and both used to leave the app with no year selected:
  // a fresh sign-in has nothing persisted to hydrate from, and a persisted id
  // can name a year that has since been deleted. Either way the whole app sat
  // on "" — every screen filtering by academic year asked for all years at
  // once, and the header showed a bare em dash. There is always a right answer
  // available, so pick it: the school's active year, or the first one the
  // server returned if none is flagged active.
  useEffect(() => {
    if (!hydrationDone || isLoading || academicYears.length === 0) return;
    const stillExists =
      !!selectedAcademicYearId &&
      academicYears.some((ay) => ay.id === selectedAcademicYearId);
    if (stillExists) return;
    const fallback = academicYears.find((ay) => ay.is_active) ?? academicYears[0];
    if (!fallback) return;
    setSelectedAcademicYearId(fallback.id);
    persistSelectedAcademicYearId(fallback.id);
  }, [hydrationDone, isLoading, academicYears, selectedAcademicYearId]);

  // Persist when selection changes
  const setSelected = useCallback((id: string) => {
    setSelectedAcademicYearId(id);
    persistSelectedAcademicYearId(id);
  }, []);

  return (
    <AcademicYearContext.Provider
      value={{
        selectedAcademicYearId,
        setSelectedAcademicYearId: setSelected,
        academicYears,
        isLoading,
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYearContext() {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) {
    throw new Error("useAcademicYearContext must be used within AcademicYearProvider");
  }
  return ctx;
}
