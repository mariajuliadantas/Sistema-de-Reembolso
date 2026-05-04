import { Router } from 'express';
import { ReimbursementController } from '../controllers/reimbursement.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const reimbursementRoutes = Router();
const reimbursementController = new ReimbursementController();

reimbursementRoutes.use(authMiddleware);

reimbursementRoutes.get('/', reimbursementController.getAll);
reimbursementRoutes.get('/:id', reimbursementController.getById);
reimbursementRoutes.post('/', roleMiddleware(['COLLABORATOR']), reimbursementController.create);
reimbursementRoutes.patch('/:id', reimbursementController.update);
reimbursementRoutes.delete('/:id', reimbursementController.cancel);

//Fluxo
reimbursementRoutes.post('/:id/submit', reimbursementController.submit);
reimbursementRoutes.post('/:id/approve', reimbursementController.approve);
reimbursementRoutes.post('/:id/reject', reimbursementController.reject);
reimbursementRoutes.post('/:id/pay', reimbursementController.pay);
reimbursementRoutes.post('/:id/cancel', reimbursementController.cancel);

reimbursementRoutes.post('/:id/attachments', reimbursementController.addAttachment);
reimbursementRoutes.get('/:id/attachments', reimbursementController.getAttachments);

reimbursementRoutes.get('/:id/history', reimbursementController.getHistory);

export default reimbursementRoutes;
