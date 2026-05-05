import { Response } from 'express';

const getErrorName = (statusCode: number) => {
  if (statusCode === 400) return 'Bad Request';
  if (statusCode === 401) return 'Unauthorized';
  if (statusCode === 403) return 'Forbidden';
  if (statusCode === 404) return 'Not Found';
  if (statusCode === 409) return 'Conflict';
  return 'Internal Server Error';
};

export const sendError = (res: Response, statusCode: number, message: string) => {
  return res.status(statusCode).json({
    message,
    statusCode,
    error: getErrorName(statusCode),
  });
};
