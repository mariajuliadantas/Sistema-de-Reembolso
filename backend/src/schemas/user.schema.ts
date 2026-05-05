import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ADMIN', 'MANAGER', 'FINANCIAL', 'COLLABORATOR']).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'FINANCIAL', 'COLLABORATOR']).optional(),
});
