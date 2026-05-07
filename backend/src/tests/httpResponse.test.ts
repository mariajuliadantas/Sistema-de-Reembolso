import { sendError } from '../utils/httpResponse';
import type { Response } from 'express';

const mockStatus = jest.fn();
const mockJson = jest.fn();

const buildRes = () => {
  mockStatus.mockReturnValue({ json: mockJson });
  return {
    status: mockStatus,
  } as unknown as Response;
};

describe('sendError', () => {
  beforeEach(() => {
    mockStatus.mockClear();
    mockJson.mockClear();
  });

  it('formata corpo padrão', () => {
    const res = buildRes();
    sendError(res, 404, 'Não encontrado');
    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Não encontrado',
      statusCode: 404,
      error: 'Not Found',
    });
  });
});
