import dayjs from 'dayjs';
import { AppError } from '../../utils/AppError';

export function assertExpenseDateNotFuture(dateInput: string | Date) {
  const expenseDay = dayjs(dateInput).startOf('day');
  const today = dayjs().startOf('day');
  if (expenseDay.isAfter(today)) {
    throw new AppError('A data da despesa não pode ser no futuro', 400);
  }
}

export function assertValueWithinCategoryMax(
  category: { maxAmount?: number | null; name: string },
  value: number,
) {
  if (category.maxAmount != null && value > category.maxAmount) {
    throw new AppError(
      `O valor da solicitação (R$ ${value.toFixed(2)}) excede o limite da categoria "${category.name}" (máx. R$ ${category.maxAmount.toFixed(2)}).`,
      400,
    );
  }
}
