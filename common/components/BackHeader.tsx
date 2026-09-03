import React from "react";
import { useRouter } from "expo-router";
import { PageHeader } from "@/common/components/PageHeader";

/**
 * Back + title header for nested section screens.
 *
 * Kept as its own name because a dozen screens call it, but it is now just
 * PageHeader with a back control — so nested screens and top-level ones sit at
 * the same height and carry the same chevron.
 *
 * `onBack` is optional and falls back to `router.back()`. Three finance
 * screens had each grown a private copy of this component for exactly that
 * reason, and those copies kept the old spacing when the shared one was fixed.
 */
export function BackHeader({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  return <PageHeader title={title} onBack={onBack ?? (() => router.back())} />;
}
