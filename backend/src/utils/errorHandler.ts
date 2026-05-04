import { Response } from 'express';
import { ZodError } from 'zod';

export function handleHttpError(error: unknown, res: Response) {
  if (error instanceof ZodError) {
    return res.status(400).json({ errors: error.issues });
  }

  if (error instanceof Error) {
    if (
      error.message.includes('Acesso negado') || 
      error.message.includes('não autorizado') || 
      error.message.includes('só pode') ||
      error.message.toLowerCase().includes('apenas')
    ) {
      return res.status(403).json({ error: error.message });
    }

    if (error.message.toLowerCase().includes('not found') || error.message.toLowerCase().includes('não encontrad')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Já existe')) {
      return res.status(409).json({ error: error.message });
    }

    return res.status(400).json({ error: error.message });
  }

  console.error('Unhandled error type:', error);
  return res.status(500).json({ error: 'Erro interno do servidor' });
}
