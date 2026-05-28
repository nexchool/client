// client/modules/search/services/searchService.ts
import { apiGet } from '@/common/services/api';
import type { SearchResults } from '../types';

export const searchService = {
  search: (q: string, limit = 5) =>
    apiGet<SearchResults>(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`),
};
