// Tracks the active company id. Persists to localStorage so the choice
// survives reloads; defaults to the first company returned by the API.

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paperclip } from '@/api/paperclip';

const STORAGE_KEY = 'deo:activeCompanyId';

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => paperclip.listCompanies(),
    staleTime: 60_000,
  });
}

export function useActiveCompany(): {
  id: string | undefined;
  setId: (id: string) => void;
  companies: ReturnType<typeof useCompanies>;
} {
  const companies = useCompanies();
  const [id, setIdState] = useState<string | undefined>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? undefined;
  });

  useEffect(() => {
    if (id) return;
    const first = companies.data?.[0]?.id;
    if (first) setIdState(first);
  }, [companies.data, id]);

  const setId = (next: string) => {
    localStorage.setItem(STORAGE_KEY, next);
    setIdState(next);
  };

  return { id, setId, companies };
}
