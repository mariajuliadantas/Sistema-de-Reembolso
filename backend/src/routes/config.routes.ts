import { Router, type Request, type Response } from 'express';
import { getAttachmentRequirementThreshold } from '../utils/reimbursementRules';

const router = Router();

/**
 * Configuração derivada do servidor (mesma lógica usada na validação de submit).
 * Público: permite alinhar avisos da UI sem duplicar variáveis no frontend.
 */
router.get('/reimbursement-rules', (_req: Request, res: Response) => {
  return res.status(200).json({
    requireAttachmentAboveValue: getAttachmentRequirementThreshold(),
  });
});

export default router;
