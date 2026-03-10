import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_HISTORY, API_BASE } from '../utils/api';
import toast from 'react-hot-toast';
import { Official } from './useOfficials';

export interface HistoryResponse {
  data: Official[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useHistory(filters: { termId?: string; onlyArchived?: boolean; page?: number; limit?: number }) {
  const queryClient = useQueryClient();
  const { termId, onlyArchived, page = 1, limit = 20 } = filters;

  const historyQuery = useQuery({
    queryKey: ['history', filters],
    queryFn: async () => {
      let url = `${API_HISTORY}`;
      if (termId) {
        url = `${API_HISTORY}/${termId}`;
      }
      
      const queryParams = new URLSearchParams();
      if (onlyArchived) queryParams.append('only_archived', 'true');
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      const res = await fetch(`${url}?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch history');
      return (await res.json()) as HistoryResponse;
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (officialIds: number[]) => {
      const res = await fetch(`${API_BASE}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officialIds }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to restore officials');
      }
      return res.json();
    },
    onSuccess: (json) => {
      queryClient.invalidateQueries({ queryKey: ['officials'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      toast.success(json.message || 'Officials restored successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteArchivedMutation = useMutation({
    mutationFn: async (officialId: number) => {
      const res = await fetch(`${API_HISTORY}/${officialId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to delete archived official');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
      toast.success('Archived official deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (officialIds: number[]) => {
      const res = await fetch(`${API_HISTORY}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officialIds }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to perform bulk delete');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
      toast.success('Archived officials deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    history: historyQuery.data?.data || [],
    meta: historyQuery.data?.meta,
    isLoading: historyQuery.isLoading,
    isError: historyQuery.isError,
    restoreOfficials: restoreMutation.mutateAsync,
    isRestoring: restoreMutation.isPending,
    deleteArchived: deleteArchivedMutation.mutateAsync,
    isDeleting: deleteArchivedMutation.isPending,
    bulkDelete: bulkDeleteMutation.mutateAsync,
    isBulkDeleting: bulkDeleteMutation.isPending,
  };
}
