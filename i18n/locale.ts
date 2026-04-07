/**
 * BCP-47 locale tag for `toLocaleDateString` / number formatting, aligned with app language.
 */
export function calendarLocaleForLanguage(languageCode: string): string {
  const base = languageCode.split("-")[0]?.toLowerCase() ?? "en";
  if (base === "gu") return "gu-IN";
  if (base === "hi") return "hi-IN";
  return "en-IN";
}
