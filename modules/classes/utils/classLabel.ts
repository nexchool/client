/**
 * The second line under a class in a picker — what distinguishes it from the
 * other class with the same name.
 *
 * A trust runs several campuses, more than one board, and parallel English and
 * Gujarati sections, so "1 A" is not an identity: the demo tenant alone has
 * three of them. Grade and section name the class; programme, campus and
 * medium say *which* one. Only the parts that exist are shown, so a
 * single-campus school with one board sees a short line, or none at all,
 * rather than a row of separators.
 */
export function classScopeLabel(item: {
  programme_name?: string | null;
  school_unit_name?: string | null;
  medium_name?: string | null;
  stream?: string | null;
}): string | undefined {
  const parts = [
    item.programme_name,
    item.school_unit_name,
    item.medium_name,
    item.stream,
  ].filter((part): part is string => !!part && part.trim() !== '');
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

/**
 * What the school calls this class, preferring the server's composed name.
 *
 * Structurally typed rather than tied to `ClassItem`, because the class list
 * arrives under two different shapes in this app and both need the same label.
 */
export function classDisplayName(item: {
  id: string;
  name?: string | null;
  display_name?: string | null;
  section?: string | null;
}): string {
  return (
    item.display_name ??
    (item.section ? `${item.name ?? ''} ${item.section}`.trim() : item.name ?? item.id)
  );
}
