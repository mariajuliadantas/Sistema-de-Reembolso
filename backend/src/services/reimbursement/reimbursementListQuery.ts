import type { Prisma } from '@prisma/client';
import type { ListReimbursementsQuery } from '../../schemas/reimbursementListQuerySchema';

export function buildReimbursementListOrderBy(
  filters: ListReimbursementsQuery,
): Prisma.ReimbursementOrderByWithRelationInput {
  const dir = filters.sortOrder;
  if (filters.sortBy === 'expenseDate') {
    return { expenseDate: dir };
  }
  if (filters.sortBy === 'value') {
    return { value: dir };
  }
  return { createdAt: dir };
}

export function buildReimbursementListExtraAnd(
  filters: ListReimbursementsQuery,
  options?: { omitStatus?: boolean },
): Prisma.ReimbursementWhereInput[] {
  const and: Prisma.ReimbursementWhereInput[] = [];
  if (!options?.omitStatus && filters.status) {
    and.push({ status: filters.status });
  }
  if (filters.categoryId) {
    and.push({ categoryId: filters.categoryId });
  }
  if (filters.requesterSearch) {
    and.push({
      requester: {
        OR: [
          { name: { contains: filters.requesterSearch } },
          { email: { contains: filters.requesterSearch } },
        ],
      },
    });
  }
  return and;
}

export function buildReimbursementListBaseWhere(
  user: { id: string; role: string },
  filters: ListReimbursementsQuery,
): Prisma.ReimbursementWhereInput {
  if (user.role === 'COLLABORATOR') {
    const extraAnd = buildReimbursementListExtraAnd(filters);
    return {
      AND: [{ requesterId: user.id }, ...extraAnd],
    };
  }

  if (user.role === 'MANAGER') {
    const extraAnd = buildReimbursementListExtraAnd(filters);
    return {
      AND: [
        {
          OR: [
            { status: 'SUBMITTED' },
            {
              history: {
                some: {
                  userId: user.id,
                  action: { in: ['APPROVED', 'REJECTED'] },
                },
              },
            },
          ],
        },
        ...extraAnd,
      ],
    };
  }

  if (user.role === 'FINANCIAL') {
    const extraAnd = buildReimbursementListExtraAnd(filters, { omitStatus: true });
    return {
      AND: [{ status: 'APPROVED' }, ...extraAnd],
    };
  }

  if (user.role === 'ADMIN') {
    const extraAnd = buildReimbursementListExtraAnd(filters);
    return extraAnd.length ? { AND: extraAnd } : {};
  }

  return { id: '__no-access__' };
}
