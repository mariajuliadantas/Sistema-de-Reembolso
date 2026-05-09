import type { Response } from 'express';
import { handleHttpError } from '../utils/errorHandler';
import { AppError } from '../utils/AppError';
import { z } from 'zod';

const mockStatus = jest.fn();
const mockJson = jest.fn();

const buildRes = () => {
  mockStatus.mockReturnValue({ json: mockJson });
  return {
    status: mockStatus,
  } as unknown as Response;
};

describe('handleHttpError', () => {
  beforeEach(() => {
    mockStatus.mockClear();
    mockJson.mockClear();
  });

  it('retorna 500 para Error genérico sem expor detalhe interno', () => {
    const res = buildRes();
    handleHttpError(new Error('Detalhe interno sensível'), res);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Erro interno do servidor',
        error: 'Internal Server Error',
      }),
    );
  });

  it('preserva status e mensagem de AppError', () => {
    const res = buildRes();
    handleHttpError(new AppError('Não autorizado', 403), res);
    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'Não autorizado',
        error: 'Forbidden',
      }),
    );
  });

  it('retorna 400 para ZodError', () => {
    const res = buildRes();
    const parsed = z.object({ x: z.string() }).safeParse({});
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      handleHttpError(parsed.error, res);
    }
    expect(mockStatus).toHaveBeenCalledWith(400);
  });
});
