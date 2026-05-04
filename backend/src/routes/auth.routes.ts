import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const router = Router();


const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});


router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validação de entrada usando Zod
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ errors: parsedData.error.format() });
    }

    const { email, password } = parsedData.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const secret = process.env.JWT_SECRET;
    console.log('JWT_SECRET no login:', secret ? 'Chave secreta carregada' : 'Chave secreta NÃO carregada'); // Log de depuração
    if (!secret) {
      throw new Error('Chave secreta JWT não configurada no .env');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '1d' }
    );

    console.log('Token gerado:', token); // Log de depuração

    return res.status(200).json({
      message: 'Login bem-sucedido',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;