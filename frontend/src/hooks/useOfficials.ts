import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE } from '../utils/api';
import toast from 'react-hot-toast';

export interface Official {
  id: number;
  name: string;
  category: string;
  position: string;
  contact?: string;
  photo?: string;
  term_of_service?: string;
  status?: string;
  term_name?: string;
  term_year?: string;
}

export function useOfficials() {
  const queryClient = useQueryClient();

  const officialsQuery = useQuery({
    queryKey: ['officials'],
    queryFn: async () => {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Failed to fetch officials');
      const json = await res.json();
      return json.data as Official[];
    },
  });

  const addOfficialMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(API_BASE, { method: 'POST', body: formData });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to add official');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officials'] });
      queryClient.invalidateQueries({ queryKey: ['currentTerm'] });
      toast.success('Official added successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateOfficialMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'PUT', body: formData });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to update official');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officials'] });
      toast.success('Official updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteOfficialMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to delete official');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officials'] });
      toast.success('Official deleted successfully!');
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
  };
}
