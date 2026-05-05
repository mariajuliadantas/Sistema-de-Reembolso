import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  reimbursementStatusLabelMap,
  reimbursementStatusColorMap,
} from './reimbursement';

describe('reimbursement utils', () => {
  it('formats currency in BRL format', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });

  it('maps all statuses to a label and color', () => {
    expect(reimbursementStatusLabelMap.DRAFT).toBe('Rascunho');
    expect(reimbursementStatusLabelMap.PAID).toBe('Pago');
    expect(reimbursementStatusColorMap.SUBMITTED).toBe('orange');
  });
});
