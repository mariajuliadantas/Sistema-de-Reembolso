import { Request, Response } from 'express';
import { ReimbursementService } from '../services/ReimbursementService';
import { createReimbursementSchema, updateReimbursementSchema, createAttachmentSchema } from '../schemas/reimbursementSchema';
import { listReimbursementsQuerySchema } from '../schemas/reimbursementListQuerySchema';
import { handleHttpError } from '../utils/errorHandler';
import { z } from 'zod';
import { AppError } from '../utils/AppError';

const reimbursementService = new ReimbursementService();

const rejectSchema = z.object({
  reason: z.string().min(5, 'O motivo da rejeição deve ter pelo menos 5 caracteres'),
});

const getPublicBaseUrl = (req: Request) => {
  const fromEnv = process.env.PUBLIC_API_URL?.replace(/\/$/, '');
  if (fromEnv) {
    return fromEnv;
  }

  const host = req.get('host');
  if (!host) {
    return 'http://localhost:3000';
  }

  const forwardedProto = req.get('x-forwarded-proto');
  const protocol = forwardedProto?.split(',')[0]?.trim() || req.protocol;
  return `${protocol}://${host}`;
};

const inferFileType = (mimetype: string) => {
  if (mimetype === 'application/pdf') return 'pdf' as const;
  if (mimetype === 'image/jpeg') return 'jpeg' as const;
  if (mimetype === 'image/png') return 'png' as const;
  return null;
};

export class ReimbursementController {
  async getAll(req: Request, res: Response) {
    try {
      const parsed = listReimbursementsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return handleHttpError(parsed.error, res);
      }
      const reimbursements = await reimbursementService.getAll(req.user!, parsed.data);
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
      const file = req.file;

      let validatedData: z.infer<typeof createAttachmentSchema>;

      if (file) {
        const fileType = inferFileType(file.mimetype);
        if (!fileType) {
          throw new AppError('Tipo de arquivo inválido. Use PDF, JPG ou PNG.', 400);
        }

        validatedData = createAttachmentSchema.parse({
          fileName: file.originalname || file.filename,
          fileUrl: `${getPublicBaseUrl(req)}/uploads/${file.filename}`,
          fileType,
        });
      } else {
        const hasJsonPayload =
          req.body &&
          typeof req.body === 'object' &&
          ('fileName' in req.body || 'fileUrl' in req.body || 'fileType' in req.body);

        if (!hasJsonPayload) {
          throw new AppError('Arquivo é obrigatório (campo multipart "file")', 400);
        }

        validatedData = createAttachmentSchema.parse(req.body);
      }

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
