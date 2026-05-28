// client/modules/search/hooks/useSearch.ts
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  });

  return {
    query,
    setQuery,
    debounced,
    enabled,
    results: q.data,
    isFetching: q.isFetching,
  };
}
