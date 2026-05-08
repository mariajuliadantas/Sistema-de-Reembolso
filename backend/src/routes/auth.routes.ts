import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendError } from '../utils/httpResponse';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokenSigning';

const router = Router();


const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

const refreshSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token é obrigatório', invalid_type_error: 'Refresh token é obrigatório' })
    .min(1, 'Refresh token é obrigatório'),
});

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

    const token = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = signRefreshToken(user.id);

    return res.status(200).json({
      message: 'Login bem-sucedido',
      token,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, parsed.error.issues[0]?.message || 'Dados inválidos');
    }

    const { userId } = verifyRefreshToken(parsed.data.refreshToken);
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) {
      return sendError(res, 401, 'Refresh token inválido');
    }

    const token = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = signRefreshToken(user.id);

    return res.status(200).json({
      message: 'Token renovado',
      token,
      refreshToken,
    });
  } catch {
    return sendError(res, 401, 'Refresh token inválido ou expirado');
  }
});

export default router;