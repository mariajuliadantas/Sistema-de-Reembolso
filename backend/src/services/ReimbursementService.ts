import { prisma } from '../utils/prisma';
import dayjs from 'dayjs';
import { z } from 'zod';
import { createReimbursementSchema, updateReimbursementSchema, createAttachmentSchema } from '../schemas/reimbursementSchema';
import type { ListReimbursementsQuery } from '../schemas/reimbursementListQuerySchema';
import { AppError } from '../utils/AppError';
import {
  getAttachmentRequirementThreshold,
  hasUploadedReceiptEvidence,
} from '../utils/reimbursementRules';
import { assertExpenseDateNotFuture, assertValueWithinCategoryMax } from './reimbursement/reimbursementValidators';
import {
  buildReimbursementListBaseWhere,
  buildReimbursementListOrderBy,
} from './reimbursement/reimbursementListQuery';

export class ReimbursementService {
  async create(requesterId: string, data: z.infer<typeof createReimbursementSchema>) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || !category.active) {
      throw new AppError('Categoria inválida ou inativa', 400);
    }

    assertExpenseDateNotFuture(data.expenseDate);
    assertValueWithinCategoryMax(category, data.value);

    const expenseDate = dayjs(data.expenseDate);

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
          observation: 'Rascunho da solicitação criado.',
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

    const categoryForLimit = data.categoryId
      ? await prisma.category.findUnique({ where: { id: data.categoryId } })
      : reimbursement.category;

    if (data.categoryId) {
      if (!categoryForLimit || !categoryForLimit.active) {
        throw new AppError('Categoria inválida ou inativa', 400);
      }
    }

    const targetValue = data.value !== undefined ? data.value : reimbursement.value;
    if (categoryForLimit) {
      assertValueWithinCategoryMax(categoryForLimit, targetValue);
    }

    if (data.expenseDate) {
      assertExpenseDateNotFuture(data.expenseDate);
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
          observation: 'Detalhes da solicitação atualizados.',
        },
      });

      return updated;
    });
  }

  async getAll(user: { id: string; role: string }, filters: ListReimbursementsQuery) {
    const orderBy = buildReimbursementListOrderBy(filters);
    const requesterSelect = { select: { id: true, name: true, email: true } } as const;
    const where = buildReimbursementListBaseWhere(user, filters);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    const [totalItems, items, aggregatedTotals, statusGrouped] = await Promise.all([
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
      prisma.reimbursement.aggregate({
        where,
        _count: { _all: true },
        _sum: { value: true },
      }),
      prisma.reimbursement.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const statusCounts = {
      DRAFT: 0,
      SUBMITTED: 0,
      APPROVED: 0,
      REJECTED: 0,
      PAID: 0,
      CANCELLED: 0,
    };
    for (const entry of statusGrouped) {
      if (entry.status in statusCounts) {
        statusCounts[entry.status as keyof typeof statusCounts] = entry._count._all;
      }
    }

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
      totals: {
        totalRequests: aggregatedTotals._count._all,
        totalAmount: aggregatedTotals._sum.value ?? 0,
        byStatus: statusCounts,
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

    assertExpenseDateNotFuture(reimbursement.expenseDate);
    assertValueWithinCategoryMax(reimbursement.category, reimbursement.value);

    const attachmentThreshold = getAttachmentRequirementThreshold();
    if (
      attachmentThreshold !== null &&
      reimbursement.value > attachmentThreshold &&
      !hasUploadedReceiptEvidence(reimbursement.attachments)
    ) {
      throw new AppError(
        `Para valores acima de R$ ${attachmentThreshold.toFixed(2)} é obrigatório anexar pelo menos um comprovante (arquivo PDF, JPG ou PNG enviado pelo upload).`,
        400,
      );
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reimbursement.update({
        where: { id },
        data: { status: 'SUBMITTED' }
      });
      await tx.reimbursementHistory.create({
        data: { action: 'SUBMITTED', reimbursementId: id, userId: user.id, observation: 'Solicitação enviada para análise.' }
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
        data: { action: 'APPROVED', reimbursementId: id, userId: user.id, observation: 'Solicitação aprovada.' }
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
          observation: `Motivo da rejeição: ${reason}`,
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
        data: { action: 'PAID', reimbursementId: id, userId: user.id, observation: 'Pagamento registrado.' }
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
        data: { action: 'CANCELED', reimbursementId: id, userId: user.id, observation: 'Solicitação cancelada.' }
      });
      return updated;
    });
  }

  async addAttachment(id: string, data: z.infer<typeof createAttachmentSchema>, user: { id: string; role: string }) {
    const reimbursement = await this.findById(id, user);

    if (reimbursement.requesterId !== user.id) {
      throw new AppError('Acesso negado', 403);
    }

    if (reimbursement.status !== 'DRAFT') {
      throw new AppError('Comprovantes só podem ser enviados enquanto a solicitação estiver em RASCUNHO.', 400);
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
          observation: `Anexo adicionado: ${data.fileName}`,
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
