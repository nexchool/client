import type { Palette } from "@/common/theme";

/** Occupancy → accent token: green under 70%, amber 70–89%, red 90%+. */
export function occupancyTone(percent: number): keyof Palette {
  if (percent >= 90) return "error";
  if (percent >= 70) return "warning";
  return "success";
}

/** Clamp a raw occupancy percent into a whole number in [0, 100]. */
export function clampPercent(value: number | null | undefined): number {
  return Math.min(100, Math.max(0, Math.round(value ?? 0)));
}
