import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'MANAGER' | 'FINANCIAL' | 'COLLABORATOR';
};

type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: 'ADMIN' | 'MANAGER' | 'FINANCIAL' | 'COLLABORATOR';
};

export class UserService {
  async create(data: CreateUserInput) {
    const existingUser = await prisma.user.findFirst({ where: { email: data.email, deletedAt: null } });
    if (existingUser) {
      throw new AppError('Já existe um usuário com este e-mail', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role ?? 'COLLABORATOR',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return user;
  }

  async getById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }
    return user;
  }

  async getAll() {
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: UpdateUserInput) {
    await this.getById(id);

    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, deletedAt: null, NOT: { id } },
      });
      if (existing) {
        throw new AppError('Já existe um usuário com este e-mail', 409);
      }
    }

    const passwordHash =
      data.password !== undefined ? await bcrypt.hash(data.password, 10) : undefined;

    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(passwordHash !== undefined ? { passwordHash } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    const currentUser = await this.getById(id);

    const related = await prisma.reimbursement.count({ where: { requesterId: id } });
    if (related > 0) {
      throw new AppError('Não é possível excluir usuário com solicitações de reembolso vinculadas', 409);
    }

    const historyCount = await prisma.reimbursementHistory.count({ where: { userId: id } });
    if (historyCount > 0) {
      throw new AppError('Não é possível excluir usuário com histórico de ações vinculado', 409);
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        email: `${currentUser.email}#deleted#${Date.now()}`,
      },
    });
  }
}
