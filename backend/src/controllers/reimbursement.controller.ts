import { Request, Response } from 'express';
import { ReimbursementService } from '../services/ReimbursementService';
import { createReimbursementSchema, updateReimbursementSchema, createAttachmentSchema } from '../schemas/reimbursementSchema';
import { handleHttpError } from '../utils/errorHandler';
import { z } from 'zod';

const reimbursementService = new ReimbursementService();

const rejectSchema = z.object({
  reason: z.string().min(5, 'O motivo da rejeição deve ter pelo menos 5 caracteres'),
});

export class ReimbursementController {
  async getAll(req: Request, res: Response) {
    try {
      const reimbursements = await reimbursementService.getAll(req.user!);
      res.status(200).json(reimbursements);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const reimbursement = await reimbursementService.findById(String(id), req.user!);
      res.status(200).json(reimbursement);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const validatedData = createReimbursementSchema.parse(req.body);
      const reimbursement = await reimbursementService.create(req.user!.id, validatedData);
      res.status(201).json(reimbursement);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateReimbursementSchema.parse(req.body);
      const reimbursement = await reimbursementService.update(String(id), validatedData, req.user!);
      res.status(200).json(reimbursement);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  // Ações de Workflow
  async submit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await reimbursementService.submit(String(id), req.user!);
      res.status(200).json(updated);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await reimbursementService.approve(String(id), req.user!);
      res.status(200).json(updated);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = rejectSchema.parse(req.body);
      const updated = await reimbursementService.reject(String(id), reason, req.user!);
      res.status(200).json(updated);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  async pay(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await reimbursementService.pay(String(id), req.user!);
      res.status(200).json(updated);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await reimbursementService.cancel(String(id), req.user!);
      res.status(200).json(updated);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  // Anexos e Histórico
  async addAttachment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = createAttachmentSchema.parse(req.body);
      const attachment = await reimbursementService.addAttachment(String(id), validatedData, req.user!);
      res.status(201).json(attachment);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  async getAttachments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const attachments = await reimbursementService.getAttachments(String(id), req.user!);
      res.status(200).json(attachments);
    } catch (error) {
      handleHttpError(error, res);
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const history = await reimbursementService.getHistory(String(id), req.user!);
      res.status(200).json(history);
    } catch (error) {
      handleHttpError(error, res);
    }
  }
}
