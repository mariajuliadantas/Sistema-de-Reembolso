import { z } from 'zod';

const reimbursementStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'PAID',
  'CANCELLED',
]);

export const listReimbursementsQuerySchema = z.object({
  status: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    reimbursementStatusEnum.optional(),
  ),
  categoryId: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().uuid().optional(),
  ),
  sortBy: z.enum(['expenseDate', 'value', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  requesterSearch: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : undefined),
    z.string().min(1).max(200).optional(),
  ),
  page: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().int().positive().optional().default(1),
  ),
  limit: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().int().positive().max(100).optional().default(10),
  ),
});

export type ListReimbursementsQuery = z.infer<typeof listReimbursementsQuerySchema>;
