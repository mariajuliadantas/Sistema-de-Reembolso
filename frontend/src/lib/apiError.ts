import type { AxiosError } from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as AxiosError<{ message?: string }>;
  return err.response?.data?.message ?? fallback;
}
