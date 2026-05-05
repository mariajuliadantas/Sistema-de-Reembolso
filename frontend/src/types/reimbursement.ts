export type ReimbursementStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'CANCELLED';

export interface Category {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Requester {
  id: string;
  name: string;
  email: string;
}

export interface ReimbursementHistoryEntry {
  id: string;
  action: 'CREATED' | 'UPDATED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELED';
  observation: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export interface Reimbursement {
  id: string;
  description: string;
  value: number;
  status: ReimbursementStatus;
  expenseDate: string;
  rejectionReason?: string | null;
  categoryId: string;
  category: Category;
  requesterId: string;
  requester?: Requester;
  history?: ReimbursementHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReimbursementDTO {
  description: string;
  value: number;
  expenseDate: string;
  categoryId: string;
}

export type UpdateReimbursementDTO = Partial<CreateReimbursementDTO>;
