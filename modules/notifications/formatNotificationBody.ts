/**
 * Turn stored HTML (e.g. `<p>…</p>`) into plain text for list previews and detail.
 */
export function stripHtmlToPlainText(raw: string | null | undefined): string {
  if (raw == null || raw === "") return "";
  const noTags = raw.replace(/<[^>]*>/g, " ");
  return noTags.replace(/\s+/g, " ").trim();
}
