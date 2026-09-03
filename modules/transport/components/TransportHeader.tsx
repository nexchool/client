import React from "react";
import { PageHeader } from "@/common/components/PageHeader";

/**
 * Back + title header for the transport section.
 *
 * Delegates to PageHeader so transport sits at the same height as every other
 * screen; it kept its own name because several transport screens call it.
 */
export function TransportHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return <PageHeader title={title} onBack={onBack} />;
}
