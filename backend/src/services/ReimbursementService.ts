import { prisma } from '../utils/prisma';
import dayjs from 'dayjs';
import { z } from 'zod';
import { createReimbursementSchema, updateReimbursementSchema, createAttachmentSchema } from '../schemas/reimbursementSchema';

export class ReimbursementService {
  async create(requesterId: string, data: z.infer<typeof createReimbursementSchema>) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || !category.active) {
      throw new Error('Categoria inválida ou inativa');
    }

    const expenseDate = dayjs(data.expenseDate);
    if (expenseDate.isAfter(dayjs())) {
      throw new Error('A data da despesa não pode ser no futuro');
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
      throw new Error('Apenas COLLABORATOR pode atualizar reembolsos');
    }

    const reimbursement = await this.findById(id, user);

    if (reimbursement.requesterId !== user.id) {
      throw new Error('Você só pode editar os seus próprios reembolsos');
    }

    if (reimbursement.status !== 'DRAFT') {
      throw new Error('Apenas reembolsos em DRAFT podem ser editados');
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category || !category.active) {
        throw new Error('Categoria inválida ou inativa');
      }
    }

    if (data.expenseDate) {
      const expenseDate = dayjs(data.expenseDate);
      if (expenseDate.isAfter(dayjs())) {
        throw new Error('A data da despesa não pode ser no futuro');
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

  async getAll(user: { id: string; role: string }) {
    if (user.role === 'COLLABORATOR') {
      return prisma.reimbursement.findMany({
        where: { requesterId: user.id },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'MANAGER') {
      return prisma.reimbursement.findMany({
        where: { status: 'SUBMITTED' },
        include: {
          category: true,
          requester: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'FINANCIAL') {
      return prisma.reimbursement.findMany({
        where: { status: 'APPROVED' },
        include: {
          category: true,
          requester: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'ADMIN') {
      return prisma.reimbursement.findMany({
        include: {
          category: true,
          requester: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    return [];
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
      throw new Error('Reimbursement not found');
    }

    if (user.role === 'COLLABORATOR' && reimbursement.requesterId !== user.id) {
      throw new Error('Acesso negado para este reembolso');
    }

    return reimbursement;
  }

  async submit(id: string, user: { id: string; role: string }) {
    if (user.role !== 'COLLABORATOR') {
      throw new Error('Apenas COLLABORATOR pode enviar reembolsos para aprovação');
    }

    const reimbursement = await this.findById(id, user);

    if (reimbursement.requesterId !== user.id) {
      throw new Error('Acesso negado');
    }

    if (reimbursement.status !== 'DRAFT') {
      throw new Error('Apenas reembolsos em DRAFT podem ser submetidos');
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
      throw new Error('Apenas MANAGER pode aprovar reembolsos');
    }
    const reimbursement = await this.findById(id, user);
    
    if (reimbursement.status !== 'SUBMITTED') {
      throw new Error('Apenas reembolsos em SUBMITTED podem ser aprovados');
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
      throw new Error('Apenas MANAGER pode rejeitar reembolsos');
    }

    const reimbursement = await this.findById(id, user);

    if (reimbursement.status !== 'SUBMITTED') {
      throw new Error('Apenas reembolsos em SUBMITTED podem ser rejeitados');
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
      throw new Error('Apenas FINANCIAL pode pagar reembolsos');
    }
    const reimbursement = await this.findById(id, user);
    
    if (reimbursement.status !== 'APPROVED') {
      throw new Error('Apenas reembolsos APPROVED podem ser pagos');
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
      throw new Error('Apenas COLLABORATOR pode cancelar reembolsos');
    }
    const reimbursement = await this.findById(id, user);

    if (reimbursement.requesterId !== user.id) {
      throw new Error('Você só pode cancelar seus próprios reembolsos');
    }
    if (reimbursement.status !== 'DRAFT' && reimbursement.status !== 'SUBMITTED') {
      throw new Error('Apenas reembolsos DRAFT ou SUBMITTED podem ser cancelados');
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
      throw new Error('Acesso negado');
    }

    if (reimbursement.status !== 'DRAFT' && reimbursement.status !== 'SUBMITTED') {
      throw new Error('Anexos só podem ser adicionados a reembolsos em DRAFT ou SUBMITTED');
    }

    return prisma.attachment.create({
      data: {
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        reimbursementId: id,
      },
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
