import type { ReimbursementStatus } from '../types/reimbursement';

export const reimbursementStatusLabelMap: Record<ReimbursementStatus, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
};

export const reimbursementStatusColorMap: Record<ReimbursementStatus, string> = {
  DRAFT: 'gray',
  SUBMITTED: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  PAID: 'blue',
  CANCELLED: 'purple',
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
