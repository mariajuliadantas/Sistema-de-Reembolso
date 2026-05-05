import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type {
  Reimbursement,
  CreateReimbursementDTO,
  UpdateReimbursementDTO,
  ReimbursementAttachment,
} from '../types/reimbursement';

export const useReimbursements = () => {
  return useQuery({
    queryKey: ['reimbursements'],
    queryFn: async (): Promise<Reimbursement[]> => {
      const { data } = await api.get('/reimbursements');
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
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
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
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
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
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
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
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
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
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
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
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
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
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
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
