import { Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError';
import { sendError } from './httpResponse';

export function handleHttpError(error: unknown, res: Response) {
  if (error instanceof ZodError) {
    return sendError(res, 400, error.issues[0]?.message || 'Dados inválidos');
  }

  if (error instanceof AppError) {
    return sendError(res, error.statusCode, error.message);
  }

  if (error instanceof Error) {
    return sendError(res, 400, error.message);
  }

  console.error('Unhandled error type:', error);
  return sendError(res, 500, 'Erro interno do servidor');
}
