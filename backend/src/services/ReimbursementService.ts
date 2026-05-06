import { prisma } from '../utils/prisma';
import dayjs from 'dayjs';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { createReimbursementSchema, updateReimbursementSchema, createAttachmentSchema } from '../schemas/reimbursementSchema';
import type { ListReimbursementsQuery } from '../schemas/reimbursementListQuerySchema';
import { AppError } from '../utils/AppError';

export class ReimbursementService {
  async create(requesterId: string, data: z.infer<typeof createReimbursementSchema>) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || !category.active) {
      throw new AppError('Categoria inválida ou inativa', 400);
    }

    const expenseDate = dayjs(data.expenseDate);
    if (expenseDate.isAfter(dayjs())) {
      throw new AppError('A data da despesa não pode ser no futuro', 400);
    }

    return prisma.$transaction(async (tx) => {
      const reimbursement = await tx.reimbursement.create({
        data: {
          description: data.description,
          value: data.value,
          expenseDate: expenseDate.toDate(),
          categoryId: data.categoryId,
          requesterId,
          status: 'DRAFT',
        },
      });

      await tx.reimbursementHistory.create({
        data: {
          action: 'CREATED',
          reimbursementId: reimbursement.id,
          userId: requesterId,
          observation: 'Reimbursement draft created',
        },
      });

      return reimbursement;
    });
  }

  async update(id: string, data: z.infer<typeof updateReimbursementSchema>, user: { id: string; role: string }) {
    if (user.role !== 'COLLABORATOR') {
      throw new AppError('Acesso negado: apenas COLLABORATOR pode atualizar reembolsos', 403);
    }

    const reimbursement = await this.findById(id, user);

    if (reimbursement.requesterId !== user.id) {
      throw new AppError('Acesso negado: você só pode editar os seus próprios reembolsos', 403);
    }

    if (reimbursement.status !== 'DRAFT') {
      throw new AppError('Apenas reembolsos em DRAFT podem ser editados', 400);
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category || !category.active) {
        throw new AppError('Categoria inválida ou inativa', 400);
      }
    }

    if (data.expenseDate) {
      const expenseDate = dayjs(data.expenseDate);
      if (expenseDate.isAfter(dayjs())) {
        throw new AppError('A data da despesa não pode ser no futuro', 400);
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reimbursement.update({
        where: { id },
        data: {
          description: data.description,
          value: data.value,
          expenseDate: data.expenseDate ? dayjs(data.expenseDate).toDate() : undefined,
          categoryId: data.categoryId,
        },
      });

      await tx.reimbursementHistory.create({
        data: {
          action: 'UPDATED',
          reimbursementId: id,
          userId: user.id,
          observation: 'Reimbursement details updated',
        },
      });

      return updated;
    });
  }

  private listOrderBy(filters: ListReimbursementsQuery): Prisma.ReimbursementOrderByWithRelationInput {
    const dir = filters.sortOrder;
    if (filters.sortBy === 'expenseDate') {
      return { expenseDate: dir };
    }
    if (filters.sortBy === 'value') {
      return { value: dir };
    }
    return { createdAt: dir };
  }

  private listExtraAnd(filters: ListReimbursementsQuery, options?: { omitStatus?: boolean }): Prisma.ReimbursementWhereInput[] {
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

  private listBaseWhere(user: { id: string; role: string }, filters: ListReimbursementsQuery): Prisma.ReimbursementWhereInput {
    if (user.role === 'COLLABORATOR') {
      const extraAnd = this.listExtraAnd(filters);
      return {
        AND: [{ requesterId: user.id }, ...extraAnd],
      };
    }

    if (user.role === 'MANAGER') {
      const extraAnd = this.listExtraAnd(filters);
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
      const extraAnd = this.listExtraAnd(filters, { omitStatus: true });
      return {
        AND: [{ status: 'APPROVED' }, ...extraAnd],
      };
    }

    if (user.role === 'ADMIN') {
      const extraAnd = this.listExtraAnd(filters);
      return extraAnd.length ? { AND: extraAnd } : {};
    }

    return { id: '__no-access__' };
  }

  async getAll(user: { id: string; role: string }, filters: ListReimbursementsQuery) {
    const orderBy = this.listOrderBy(filters);
    const requesterSelect = { select: { id: true, name: true, email: true } } as const;
    const where = this.listBaseWhere(user, filters);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    const [totalItems, items] = await Promise.all([
      prisma.reimbursement.count({ where }),
      prisma.reimbursement.findMany({
        where,
        include: {
          category: true,
          requester: requesterSelect,
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };
  }

  async findById(id: string, user: { id: string; role: string }) {
    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id },
      include: {
        category: true,
        requester: { select: { id: true, name: true, email: true } },
        history: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } }
          }
        },
        attachments: true
      }
    });

    if (!reimbursement) {
      throw new AppError('Reembolso não encontrado', 404);
    }

    if (user.role === 'COLLABORATOR' && reimbursement.requesterId !== user.id) {
      throw new AppError('Acesso negado para este reembolso', 403);
    }

    return reimbursement;
  }

  async submit(id: string, user: { id: string; role: string }) {
    if (user.role !== 'COLLABORATOR') {
      throw new AppError('Acesso negado: apenas COLLABORATOR pode enviar reembolsos para aprovação', 403);
    }

    const reimbursement = await this.findById(id, user);

    if (reimbursement.requesterId !== user.id) {
      throw new AppError('Acesso negado', 403);
    }

    if (reimbursement.status !== 'DRAFT') {
      throw new AppError('Apenas reembolsos em DRAFT podem ser submetidos', 400);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reimbursement.update({
        where: { id },
        data: { status: 'SUBMITTED' }
      });
      await tx.reimbursementHistory.create({
        data: { action: 'SUBMITTED', reimbursementId: id, userId: user.id, observation: 'Reimbursement submitted for approval' }
      });
      return updated;
    });
  }

  async approve(id: string, user: { id: string; role: string }) {
    if (user.role !== 'MANAGER') {
      throw new AppError('Acesso negado: apenas MANAGER pode aprovar reembolsos', 403);
    }
    const reimbursement = await this.findById(id, user);
    
    if (reimbursement.status !== 'SUBMITTED') {
      throw new AppError('Apenas reembolsos em SUBMITTED podem ser aprovados', 400);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reimbursement.update({
        where: { id },
        data: { status: 'APPROVED' }
      });
      await tx.reimbursementHistory.create({
        data: { action: 'APPROVED', reimbursementId: id, userId: user.id, observation: 'Reimbursement approved' }
      });
      return updated;
    });
  }

  async reject(id: string, reason: string, user: { id: string; role: string }) {
    if (user.role !== 'MANAGER') {
      throw new AppError('Acesso negado: apenas MANAGER pode rejeitar reembolsos', 403);
    }

    const reimbursement = await this.findById(id, user);

    if (reimbursement.status !== 'SUBMITTED') {
      throw new AppError('Apenas reembolsos em SUBMITTED podem ser rejeitados', 400);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reimbursement.update({
        where: { id },
        data: { status: 'REJECTED', rejectionReason: reason },
      });
      await tx.reimbursementHistory.create({
        data: {
          action: 'REJECTED',
          reimbursementId: id,
          userId: user.id,
          observation: `Rejected: ${reason}`,
        },
      });
      return updated;
    });
  }

  async pay(id: string, user: { id: string; role: string }) {
    if (user.role !== 'FINANCIAL') {
      throw new AppError('Acesso negado: apenas FINANCIAL pode pagar reembolsos', 403);
    }
    const reimbursement = await this.findById(id, user);
    
    if (reimbursement.status !== 'APPROVED') {
      throw new AppError('Apenas reembolsos APPROVED podem ser pagos', 400);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reimbursement.update({
        where: { id },
        data: { status: 'PAID' }
      });
      await tx.reimbursementHistory.create({
        data: { action: 'PAID', reimbursementId: id, userId: user.id, observation: 'Reimbursement paid' }
      });
      return updated;
    });
  }

  async cancel(id: string, user: { id: string; role: string }) {
    if (user.role !== 'COLLABORATOR') {
      throw new AppError('Acesso negado: apenas COLLABORATOR pode cancelar reembolsos', 403);
    }
    const reimbursement = await this.findById(id, user);

    if (reimbursement.requesterId !== user.id) {
      throw new AppError('Acesso negado: você só pode cancelar seus próprios reembolsos', 403);
    }
    if (reimbursement.status !== 'DRAFT') {
      throw new AppError('Apenas reembolsos em DRAFT podem ser cancelados', 400);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reimbursement.update({
        where: { id },
        data: { status: 'CANCELLED' } // No schema está CANCELLED
      });
      await tx.reimbursementHistory.create({
        data: { action: 'CANCELED', reimbursementId: id, userId: user.id, observation: 'Reimbursement canceled' }
      });
      return updated;
    });
  }

  async addAttachment(id: string, data: z.infer<typeof createAttachmentSchema>, user: { id: string; role: string }) {
    const reimbursement = await this.findById(id, user);

    if (reimbursement.requesterId !== user.id) {
      throw new AppError('Acesso negado', 403);
    }

    if (reimbursement.status !== 'DRAFT' && reimbursement.status !== 'SUBMITTED') {
      throw new AppError('Anexos só podem ser adicionados a reembolsos em DRAFT ou SUBMITTED', 400);
    }

    return prisma.$transaction(async (tx) => {
      const attachment = await tx.attachment.create({
        data: {
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          reimbursementId: id,
        },
      });

      await tx.reimbursementHistory.create({
        data: {
          action: 'UPDATED',
          reimbursementId: id,
          userId: user.id,
          observation: `Attachment added: ${data.fileName}`,
        },
      });

      return attachment;
    });
  }

  async getAttachments(id: string, user: { id: string; role: string }) {
    await this.findById(id, user); // validates access

    return prisma.attachment.findMany({
      where: { reimbursementId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getHistory(id: string, user: { id: string; role: string }) {
    await this.findById(id, user); // validates access

    return prisma.reimbursementHistory.findMany({
      where: { reimbursementId: id },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
