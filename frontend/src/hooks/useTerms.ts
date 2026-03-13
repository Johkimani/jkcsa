import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_TERMS, API_ARCHIVE, API_JUMUIYA_ARCHIVE } from '../utils/api';
import toast from 'react-hot-toast';

export interface ElectionTerm {
  id: number;
  name: string;
  year: string;
  start_date: string;
  end_date?: string;
  description?: string;
  is_current: boolean;
  created_at?: string;
  archived_csa_count?: string | number;
  archived_jumuiya_count?: string | number;
}

export function useTerms() {
  const queryClient = useQueryClient();

  const termsQuery = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const res = await fetch(API_TERMS);
      if (!res.ok) throw new Error('Failed to fetch terms');
      const json = await res.json();
      return json.data as ElectionTerm[];
    },
  });

  const currentTermQuery = useQuery({
    queryKey: ['currentTerm'],
    queryFn: async () => {
      const res = await fetch(`${API_TERMS}/current`);
      if (!res.ok) throw new Error('Failed to fetch current term');
      const json = await res.json();
      return json.data as ElectionTerm | null;
    },
  });

  const createTermMutation = useMutation({
    mutationFn: async (termData: Partial<ElectionTerm> & { set_as_current?: boolean }) => {
      const res = await fetch(API_TERMS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termData),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to create term');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      queryClient.invalidateQueries({ queryKey: ['currentTerm'] });
      toast.success('Election term created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const archiveOfficialsMutation = useMutation({
    mutationFn: async (payload: any & { isJumuiya?: boolean }) => {
      const url = payload.isJumuiya ? API_JUMUIYA_ARCHIVE : API_ARCHIVE;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to archive officials');
      return json;
    },
    onSuccess: (json, variables) => {
      queryClient.invalidateQueries({ queryKey: variables.isJumuiya ? ['jumuiya_officials'] : ['officials'] });
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      queryClient.invalidateQueries({ queryKey: ['currentTerm'] });
      queryClient.invalidateQueries({ queryKey: variables.isJumuiya ? ['jumuiya_history'] : ['history'] });
      toast.success(`${json.data?.archived_count || 'Officials'} archived successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    terms: termsQuery.data || [],
    isLoadingTerms: termsQuery.isLoading,
    currentTerm: currentTermQuery.data || null,
    isLoadingCurrentTerm: currentTermQuery.isLoading,
    createTerm: createTermMutation.mutateAsync,
    isCreatingTerm: createTermMutation.isPending,
    archiveOfficials: archiveOfficialsMutation.mutateAsync,
    isArchiving: archiveOfficialsMutation.isPending,
  };
}
