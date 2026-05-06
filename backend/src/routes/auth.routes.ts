import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendError } from '../utils/httpResponse';
import { UserService } from '../services/UserService';
import { handleHttpError } from '../utils/errorHandler';
import { createUserSchema } from '../schemas/user.schema';

const router = Router();


const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

const userService = new UserService();

router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validação de entrada usando Zod
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendError(res, 400, parsedData.error.issues[0]?.message || 'Dados inválidos');
    }

    const { email, password } = parsedData.data;

    const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) {
      return sendError(res, 401, 'Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return sendError(res, 401, 'Credenciais inválidas');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Chave secreta JWT não configurada no .env');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Login bem-sucedido',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const parsedData = createUserSchema
      .pick({ name: true, email: true, password: true })
      .safeParse(req.body);
    if (!parsedData.success) {
      return sendError(res, 400, parsedData.error.issues[0]?.message || 'Dados inválidos');
    }

    const { name, email, password } = parsedData.data;
    const user = await userService.create({ name, email, password, role: 'COLLABORATOR' });

    return res.status(201).json({
      message: 'Conta criada com sucesso',
      user,
    });
  } catch (error) {
    return handleHttpError(error, res);
  }
});

export default router;