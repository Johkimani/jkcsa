import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_JUMUIYA_BASE } from '../utils/api';
import toast from 'react-hot-toast';

export interface JumuiyaOfficial {
  id: number;
  name: string;
  category: string;
  position: string;
  contact: string;
  photo: string | null;
  election_term_id: number | null;
  term_of_service: string | null;
  term_name?: string;
  term_year?: number;
  status: string;
}

export function useJumuiyaOfficials(termId?: number | null) {
  const queryClient = useQueryClient();

  const officialsQuery = useQuery({
    queryKey: ['jumuiya_officials', termId],
    queryFn: async () => {
      const url = termId 
        ? `${API_JUMUIYA_BASE}?term_id=${termId}`
        : API_JUMUIYA_BASE;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch jumuiya officials');
      const json = await res.json();
      return json.data as JumuiyaOfficial[];
    },
  });

  const addOfficialMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(API_JUMUIYA_BASE, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to add jumuiya official');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jumuiya_officials'] });
      queryClient.invalidateQueries({ queryKey: ['currentTerm'] });
      toast.success('Jumuiya official added successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateOfficialMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const res = await fetch(`${API_JUMUIYA_BASE}/${id}`, {
        method: 'PUT',
        body: formData,
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to update jumuiya official');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jumuiya_officials'] });
      toast.success('Jumuiya official updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteOfficialMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_JUMUIYA_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to delete jumuiya official');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jumuiya_officials'] });
      toast.success('Jumuiya official deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    officials: officialsQuery.data || [],
    isLoading: officialsQuery.isLoading,
    isError: officialsQuery.isError,
    error: officialsQuery.error,
    addOfficial: addOfficialMutation.mutateAsync,
    isAdding: addOfficialMutation.isPending,
    updateOfficial: updateOfficialMutation.mutateAsync,
    isUpdating: updateOfficialMutation.isPending,
    deleteOfficial: deleteOfficialMutation.mutateAsync,
    isDeleting: deleteOfficialMutation.isPending,
    fetchOfficials: officialsQuery.refetch,
  };
}
