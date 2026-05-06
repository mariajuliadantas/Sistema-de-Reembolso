import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type {
  Reimbursement,
  CreateReimbursementDTO,
  UpdateReimbursementDTO,
  ReimbursementAttachment,
  ReimbursementStatus,
} from '../types/reimbursement';

export interface ReimbursementListFilters {
  status?: ReimbursementStatus;
  categoryId?: string;
  requesterSearch?: string;
  sortBy?: 'expenseDate' | 'value' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedReimbursementsResponse {
  items: Reimbursement[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  totals: {
    totalRequests: number;
    totalAmount: number;
    byStatus: {
      DRAFT: number;
      SUBMITTED: number;
      APPROVED: number;
      REJECTED: number;
      PAID: number;
      CANCELLED: number;
    };
  };
}

export const useReimbursements = (filters: ReimbursementListFilters = {}) => {
  const normalizedFilters = {
    status: filters.status,
    categoryId: filters.categoryId,
    requesterSearch: filters.requesterSearch?.trim() || undefined,
    sortBy: filters.sortBy ?? 'createdAt',
    sortOrder: filters.sortOrder ?? 'desc',
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
  };

  return useQuery({
    queryKey: ['reimbursements', normalizedFilters],
    queryFn: async (): Promise<PaginatedReimbursementsResponse> => {
      const { data } = await api.get('/reimbursements', {
        params: normalizedFilters,
      });
      return data;
    },
  });
};

export const useReimbursement = (id: string) => {
  return useQuery({
    queryKey: ['reimbursement', id],
    queryFn: async (): Promise<Reimbursement> => {
      const { data } = await api.get(`/reimbursements/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateReimbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newReimbursement: CreateReimbursementDTO) => {
      const { data } = await api.post('/reimbursements', newReimbursement);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'reimbursements',
      });
    },
  });
};

export const useUpdateReimbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateReimbursementDTO }) => {
      const { data } = await api.put(`/reimbursements/${id}`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'reimbursements',
      });
      queryClient.invalidateQueries({ queryKey: ['reimbursement', variables.id] });
    },
  });
};

export const useSubmitReimbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/reimbursements/${id}/submit`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'reimbursements',
      });
      queryClient.invalidateQueries({ queryKey: ['reimbursement', id] });
    },
  });
};

export const useApproveReimbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/reimbursements/${id}/approve`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'reimbursements',
      });
      queryClient.invalidateQueries({ queryKey: ['reimbursement', id] });
    },
  });
};

export const useRejectReimbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await api.post(`/reimbursements/${id}/reject`, { reason });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'reimbursements',
      });
      queryClient.invalidateQueries({ queryKey: ['reimbursement', variables.id] });
    },
  });
};

export const usePayReimbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/reimbursements/${id}/pay`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'reimbursements',
      });
      queryClient.invalidateQueries({ queryKey: ['reimbursement', id] });
    },
  });
};

export const useCancelReimbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/reimbursements/${id}/cancel`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'reimbursements',
      });
      queryClient.invalidateQueries({ queryKey: ['reimbursement', id] });
    },
  });
};

export const useReimbursementAttachments = (id: string) => {
  return useQuery({
    queryKey: ['reimbursement', id, 'attachments'],
    queryFn: async (): Promise<ReimbursementAttachment[]> => {
      const { data } = await api.get(`/reimbursements/${id}/attachments`);
      return data;
    },
    enabled: !!id,
  });
};

export const useAddReimbursementAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/reimbursements/${id}/attachments`, formData);
      return data as ReimbursementAttachment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reimbursement', variables.id, 'attachments'] });
      queryClient.invalidateQueries({ queryKey: ['reimbursement', variables.id] });
    },
  });
};
