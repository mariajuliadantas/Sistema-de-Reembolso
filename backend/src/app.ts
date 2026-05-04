import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import { authMiddleware, roleMiddleware } from './middlewares/auth.middleware';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'API do Sistema de Reembolso rodando' });
});

app.use('/api/auth', authRoutes);

// Rotas protegidas (exemplo)
app.get('/api/protected', authMiddleware, (req: Request, res: Response) => {
  res.status(200).json({ message: 'Rota protegida acessada com sucesso', user: req.user });
});

// Rota protegida com restrição de perfil (exemplo, apenas para ADMIN)
app.get('/api/admin-only', authMiddleware, roleMiddleware(['ADMIN']), (req: Request, res: Response) => {
  res.status(200).json({ message: 'Rota acessível apenas para ADMIN', user: req.user });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

export default app;
