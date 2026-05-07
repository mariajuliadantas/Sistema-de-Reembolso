import { Router, Request, Response } from 'express';
import { sendError } from '../utils/httpResponse';

const router = Router();

/**
 * Exemplo mínimo de consumo de API HTTP externa (fetch nativo), fora do escopo principal.
 * Útil para documentação / demonstração; não exige autenticação.
 */
router.get('/external-post', async (_req: Request, res: Response) => {
  try {
    const upstream = await fetch('https://jsonplaceholder.typicode.com/posts/1');
    if (!upstream.ok) {
      return sendError(res, 502, 'Serviço externo de exemplo indisponível');
    }
    const data = (await upstream.json()) as { id: number; title: string; userId: number };
    return res.status(200).json({
      message: 'Dados obtidos de API pública de exemplo',
      source: 'jsonplaceholder.typicode.com',
      postId: data.id,
      title: data.title,
      userId: data.userId,
    });
  } catch {
    return sendError(res, 502, 'Falha ao consultar API externa de exemplo');
  }
});

export default router;
