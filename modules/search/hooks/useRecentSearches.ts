import { useCallback, useEffect, useState } from 'react';
import { getRecentSearches, setRecentSearches } from '@/common/utils/storage';

/** Enough to be useful, few enough to read without scrolling past the results. */
const MAX_RECENTS = 8;

/**
 * The terms this person has actually searched for, newest first.
 *
 * A term is only recorded when the search is *committed* — a result opened, or
 * the keyboard's search key pressed. Recording every debounced query instead
 * would fill the list with the prefixes typed on the way to the real one
 * ("k", "ki", "kia", "kiar"), which is a history of keystrokes rather than of
 * searches.
 */
export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void getRecentSearches().then((stored) => {
      if (active) setRecents(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: string[]) => {
    setRecents(next);
    void setRecentSearches(next);
  }, []);

  const remember = useCallback(
    (term: string) => {
      const cleaned = term.trim();
      if (!cleaned) return;
      setRecents((current) => {
        // Case-insensitive de-dupe, but keep what they typed: re-searching
        // "Kiara" should move the existing entry up, not sit beside "kiara".
        const withoutDuplicate = current.filter(
          (t) => t.toLowerCase() !== cleaned.toLowerCase()
        );
        const next = [cleaned, ...withoutDuplicate].slice(0, MAX_RECENTS);
        void setRecentSearches(next);
        return next;
      });
    },
    []
  );

  const forget = useCallback(
    (term: string) => persist(recents.filter((t) => t !== term)),
    [recents, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { recents, remember, forget, clear };
}
