import { Router, Request, Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';
import { sendError } from '../utils/httpResponse';
import { handleHttpError } from '../utils/errorHandler';
import { UserService } from '../services/UserService';

const router = Router();
const userService = new UserService();

router.post('/', authMiddleware, roleMiddleware(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const parsedData = createUserSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendError(res, 400, parsedData.error.issues[0]?.message || 'Dados inválidos');
    }

    const user = await userService.create(parsedData.data);
    return res.status(201).json({
      message: 'Usuário criado com sucesso',
      user,
    });
  } catch (error) {
    return handleHttpError(error, res);
  }
});

router.get('/', authMiddleware, roleMiddleware(['ADMIN']), async (_req: Request, res: Response) => {
  try {
    const users = await userService.getAll();
    return res.status(200).json(users);
  } catch (error) {
    return handleHttpError(error, res);
  }
});

router.get('/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.getById(String(id));
    return res.status(200).json(user);
  } catch (error) {
    return handleHttpError(error, res);
  }
});

router.put('/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsedData = updateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendError(res, 400, parsedData.error.issues[0]?.message || 'Dados inválidos');
    }

    const user = await userService.update(String(id), parsedData.data);
    return res.status(200).json(user);
  } catch (error) {
    return handleHttpError(error, res);
  }
});

router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await userService.delete(String(id));
    return res.status(204).send();
  } catch (error) {
    return handleHttpError(error, res);
  }
});

export default router;
