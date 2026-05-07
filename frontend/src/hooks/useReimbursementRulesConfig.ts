import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export type ReimbursementRulesConfig = {
  requireAttachmentAboveValue: number | null;
};

/**
 * Lê a mesma regra configurada no backend (`REIMBURSEMENT_REQUIRE_ATTACHMENT_ABOVE_VALUE`).
 */
export const useReimbursementRulesConfig = () => {
  return useQuery({
    queryKey: ['config', 'reimbursement-rules'],
    queryFn: async (): Promise<ReimbursementRulesConfig> => {
      const { data } = await api.get<ReimbursementRulesConfig>('/config/reimbursement-rules');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
