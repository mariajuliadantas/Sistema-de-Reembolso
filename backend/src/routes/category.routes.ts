import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const categoryRoutes = Router();
const categoryController = new CategoryController();

// Aplicação Global do authMiddleware para evitar repetição em todas as rotas
categoryRoutes.use(authMiddleware);

// Rotas de leitura
categoryRoutes.get('/', roleMiddleware(['ADMIN']), categoryController.getAll);
categoryRoutes.get('/active', categoryController.getActive);

// Rotas de escrita (apenas ADMIN)
categoryRoutes.post('/', roleMiddleware(['ADMIN']), categoryController.create);
categoryRoutes.patch('/:id', roleMiddleware(['ADMIN']), categoryController.update);

export default categoryRoutes;
