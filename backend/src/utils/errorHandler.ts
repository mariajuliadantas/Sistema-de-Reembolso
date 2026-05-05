import { Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError';

export function handleHttpError(error: unknown, res: Response) {
  if (error instanceof ZodError) {
    return res.status(400).json({ errors: error.issues });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  if (error instanceof Error) {
    return res.status(400).json({ error: error.message });
  }

  console.error('Unhandled error type:', error);
  return res.status(500).json({ error: 'Erro interno do servidor' });
}
