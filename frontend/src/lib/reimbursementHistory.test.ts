import { formatHistoryObservation, historyActionLabel } from './reimbursementHistory';

describe('reimbursementHistory', () => {
  it('traduz códigos de ação para português', () => {
    expect(historyActionLabel('CREATED')).toBe('Solicitação criada');
    expect(historyActionLabel('SUBMITTED')).toBe('Enviada para análise');
    expect(historyActionLabel('CANCELED')).toBe('Cancelada');
  });

  it('normaliza observações legadas em inglês', () => {
    expect(formatHistoryObservation('Attachment added: nota.pdf')).toBe('Anexo adicionado: nota.pdf');
    expect(formatHistoryObservation('Rejected: falta legível')).toBe('Motivo da rejeição: falta legível');
    expect(formatHistoryObservation('Rascunho da solicitação criado.')).toBe('Rascunho da solicitação criado.');
  });
});
