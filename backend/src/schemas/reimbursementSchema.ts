import { z } from 'zod';

export const createReimbursementSchema = z.object({
  categoryId: z.string().uuid('Categoria inválida'),
  description: z.string().min(5, 'A descrição deve ter pelo menos 5 caracteres'),
  value: z.number().positive('O valor deve ser maior que zero'),
  expenseDate: z.string().datetime({ message: 'Data inválida, use formato ISO 8601' }),
});

export const updateReimbursementSchema = createReimbursementSchema.partial();

export const createAttachmentSchema = z.object({
  fileName: z.string().min(1, 'Nome do arquivo é obrigatório'),
  fileUrl: z.string().url('URL inválida'),
  fileType: z.enum(['pdf', 'jpg', 'jpeg', 'png'], {
    errorMap: () => ({ message: 'Tipo de arquivo deve ser pdf, jpg, jpeg ou png' })
  }),
});
