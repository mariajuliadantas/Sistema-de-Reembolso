import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import reimbursementRoutes from './routes/reimbursement.routes';
import userRoutes from './routes/user.routes';
import demoRoutes from './routes/demo.routes';
import configRoutes from './routes/config.routes';
import { authMiddleware, roleMiddleware } from './middlewares/auth.middleware';
import { sendError } from './utils/httpResponse';

const app = express();

const uploadsDir = path.resolve(__dirname, '../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'API do Sistema de Reembolso rodando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reimbursements', reimbursementRoutes);

// Rotas protegidas (exemplo)
app.get('/api/protected', authMiddleware, (req: Request, res: Response) => {
  res.status(200).json({ message: 'Rota protegida acessada com sucesso', user: req.user });
});

// Rota protegida com restrição de perfil (exemplo, apenas para ADMIN)
app.get('/api/admin-only', authMiddleware, roleMiddleware(['ADMIN']), (req: Request, res: Response) => {
  res.status(200).json({ message: 'Rota acessível apenas para ADMIN', user: req.user });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 400, 'Arquivo muito grande (máximo 5MB)');
    }
    return sendError(res, 400, 'Falha no upload do arquivo');
  }

  if (err instanceof Error) {
    console.error(err.stack);
    // Erros comuns do fileFilter do multer
    if (err.message.startsWith('Tipo de arquivo inválido')) {
      return sendError(res, 400, err.message);
    }
    return sendError(res, 500, 'Erro interno do servidor');
  }

  console.error(err);
  return sendError(res, 500, 'Erro interno do servidor');
});

app.use((req: Request, res: Response) => {
  sendError(res, 404, 'Rota não encontrada');
});

export default app;
