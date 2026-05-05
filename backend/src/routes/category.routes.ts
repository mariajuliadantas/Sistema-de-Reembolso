import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const categoryRoutes = Router();
const categoryController = new CategoryController();

categoryRoutes.use(authMiddleware);

categoryRoutes.get('/', roleMiddleware(['ADMIN']), categoryController.getAll);
categoryRoutes.get('/active', categoryController.getActive);

categoryRoutes.post('/', roleMiddleware(['ADMIN']), categoryController.create);
categoryRoutes.patch('/:id', roleMiddleware(['ADMIN']), categoryController.update);
categoryRoutes.put('/:id', roleMiddleware(['ADMIN']), categoryController.update);

export default categoryRoutes;
