import { z } from 'zod';

const maxAmountField = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : v),
  z.union([z.coerce.number().positive('O limite deve ser um valor positivo'), z.null()]).optional(),
);

export const createCategorySchema = z.object({
  name: z.string().min(1, 'O nome da categoria é obrigatório'),
  active: z.boolean().optional(),
  maxAmount: maxAmountField,
});

export const updateCategorySchema = createCategorySchema.partial();
