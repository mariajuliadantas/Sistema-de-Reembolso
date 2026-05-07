import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { sendError } from '../utils/httpResponse';

dotenv.config();

interface JwtPayload {
  id: string;
  email?: string;
  role?: string;
  typ?: string;
}

// Popula req.user quando houver Bearer válido; não responde erro se ausente/inválido
export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next();
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (decoded.typ === 'refresh' || !decoded.email || !decoded.role) {
      return next();
    }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch {
    next();
  }
};

// Middleware de autenticação
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Token de autenticação não fornecido ou inválido');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Chave secreta JWT não configurada');
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (decoded.typ === 'refresh') {
      return sendError(res, 401, 'Token de acesso inválido: use o endpoint de refresh');
    }

    if (!decoded.email || !decoded.role) {
      return sendError(res, 401, 'Token inválido ou expirado');
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return sendError(res, 401, 'Token inválido ou expirado');
  }
};

// Middleware para verificar permissões por perfil (RBAC)
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, 'Acesso negado: perfil não autorizado');
    }
    next();
  };
};