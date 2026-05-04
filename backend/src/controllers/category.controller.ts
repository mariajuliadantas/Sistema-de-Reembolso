import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';
import { createCategorySchema, updateCategorySchema } from '../schemas/categorySchema';
import { handleHttpError } from '../utils/errorHandler';

const categoryService = new CategoryService();

export class CategoryController {
  async getAll(req: Request, res: Response) {
    try {
      const categories = await categoryService.getAll();
      res.status(200).json(categories);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  async getActive(req: Request, res: Response) {
    try {
      const categories = await categoryService.getActive();
      res.status(200).json(categories);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const validatedData = createCategorySchema.parse(req.body);
      const category = await categoryService.create(validatedData);
      res.status(201).json(category);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateCategorySchema.parse(req.body);
      const category = await categoryService.update(String(id), validatedData);
      res.status(200).json(category);
    } catch (error) {
      handleHttpError(error, res);
    }
  }
}
