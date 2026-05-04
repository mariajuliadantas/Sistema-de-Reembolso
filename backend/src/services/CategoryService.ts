import { prisma } from '../utils/prisma';

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

  async create(data: { name: string; active?: boolean }) {
    const existingCategory = await prisma.category.findUnique({
      where: { name: data.name }
    });

    if (existingCategory) {
      throw new Error('Já existe uma categoria com este nome.');
    }

    return prisma.category.create({
      data: {
        name: data.name,
        active: data.active !== undefined ? data.active : true,
      }
    });
  }

  async update(id: string, data: { name?: string; active?: boolean }) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new Error('Category not found');
    }

    if (data.name && data.name !== category.name) {
      const existing = await prisma.category.findUnique({
        where: { name: data.name }
      });
      if (existing) {
        throw new Error('Já existe outra categoria com este nome.');
      }
    }

    return prisma.category.update({
      where: { id },
      data
    });
  }
}
