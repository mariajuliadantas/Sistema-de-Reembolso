import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Category } from '../types/reimbursement';
import { useAuth } from './useAuth';

interface UseCategoriesOptions {
  includeInactive?: boolean;
}

export const useCategories = (options: UseCategoriesOptions = {}) => {
  const { includeInactive = false } = options;
  const { user } = useAuth();
  const shouldUseAdminEndpoint = includeInactive && user?.role === 'ADMIN';
  const endpoint = shouldUseAdminEndpoint ? '/categories' : '/categories/active';

  return useQuery({
    queryKey: ['categories', endpoint],
    queryFn: async (): Promise<Category[]> => {
      const { data } = await api.get(endpoint);
      return data;
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; active?: boolean }) => {
      const { data } = await api.post('/categories', payload);
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { name?: string; active?: boolean } }) => {
      const { data } = await api.patch(`/categories/${id}`, payload);
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
