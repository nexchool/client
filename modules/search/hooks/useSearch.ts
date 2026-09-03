// client/modules/search/hooks/useSearch.ts
import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchService } from '../services/searchService';

const MIN_LEN = 2;
const DEBOUNCE_MS = 300;

export function useSearch() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const enabled = debounced.length >= MIN_LEN;
  const q = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchService.search(debounced),
    enabled,
    // Every extra character is a new query key with nothing cached, so without
    // this the results vanish into skeletons between each keystroke and the
    // list flickers all the way through a name. Hold the previous answer until
    // the new one lands.
    placeholderData: keepPreviousData,
  });

  return {
    query,
    setQuery,
    debounced,
    enabled,
    results: q.data,
    isFetching: q.isFetching,
    /** True only when there is nothing to show yet — skeletons, not a flicker. */
    isInitialLoad: q.isFetching && q.data === undefined,
  };
}
