import jwt, { type SignOptions } from 'jsonwebtoken';

export type AccessTokenUser = { id: string; email: string; role: string };

const getAccessSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Chave secreta JWT não configurada no .env');
  }
  return secret;
};

const getRefreshSecret = (): string => {
  return process.env.JWT_REFRESH_SECRET || getAccessSecret();
};

export const signAccessToken = (user: AccessTokenUser): string => {
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES || '1d') as NonNullable<SignOptions['expiresIn']>;
  const signOptions: SignOptions = { expiresIn };
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, typ: 'access' },
    getAccessSecret(),
    signOptions,
  );
};

export const signRefreshToken = (userId: string): string => {
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES || '7d') as NonNullable<SignOptions['expiresIn']>;
  const signOptions: SignOptions = { expiresIn };
  return jwt.sign({ id: userId, typ: 'refresh' }, getRefreshSecret(), signOptions);
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  const decoded = jwt.verify(token, getRefreshSecret()) as { id?: string; typ?: string };
  if (decoded.typ !== 'refresh' || !decoded.id) {
    throw new Error('Invalid refresh token');
  }
  return { userId: decoded.id };
};
