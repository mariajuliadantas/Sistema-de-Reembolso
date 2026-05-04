import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';
import { createCategorySchema, updateCategorySchema } from '../schemas/categorySchema';
import { ZodError } from 'zod';

const categoryService = new CategoryService();

export class CategoryController {
  async getAll(req: Request, res: Response) {
    try {
      const categories = await categoryService.getAll();
      res.status(200).json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getActive(req: Request, res: Response) {
    try {
      const categories = await categoryService.getActive();
      res.status(200).json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const validatedData = createCategorySchema.parse(req.body);
      const category = await categoryService.create(validatedData);
      res.status(201).json(category);
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.issues });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateCategorySchema.parse(req.body);
      const category = await categoryService.update(String(id), validatedData);
      res.status(200).json(category);
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.issues });
      } else if (error.message === 'Category not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }
}
