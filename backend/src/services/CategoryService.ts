import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';
import type { z } from 'zod';
import type { createCategorySchema, updateCategorySchema } from '../schemas/categorySchema';

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export class CategoryService {
  async getAll() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async getActive() {
    return prisma.category.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }
    });
  }

  async create(data: CreateCategoryInput) {
    const existingCategory = await prisma.category.findUnique({
      where: { name: data.name }
    });

    if (existingCategory) {
      throw new AppError('Já existe uma categoria com este nome.', 409);
    }

    return prisma.category.create({
      data: {
        name: data.name,
        active: data.active !== undefined ? data.active : true,
        maxAmount: data.maxAmount ?? null,
      }
    });
  }

  async update(id: string, data: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new AppError('Categoria não encontrada', 404);
    }

    if (data.name && data.name !== category.name) {
      const existing = await prisma.category.findUnique({
        where: { name: data.name }
      });
      if (existing) {
        throw new AppError('Já existe outra categoria com este nome.', 409);
      }
    }

    return prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.maxAmount !== undefined && { maxAmount: data.maxAmount }),
      },
    });
  }
}
