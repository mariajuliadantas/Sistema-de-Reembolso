import type { ReimbursementHistoryEntry } from '../types/reimbursement';

//Rótulos em português para códigos de ação persistidos no histórico.
export function historyActionLabel(action: ReimbursementHistoryEntry['action'] | string): string {
  const map: Record<string, string> = {
    CREATED: 'Solicitação criada',
    UPDATED: 'Solicitação atualizada',
    SUBMITTED: 'Enviada para análise',
    APPROVED: 'Aprovada',
    REJECTED: 'Rejeitada',
    PAID: 'Pagamento registrado',
    CANCELED: 'Cancelada',
  };
  return map[action] ?? action;
}

// Normaliza observações antigas em inglês (dados já gravados) para exibição em português.
export function formatHistoryObservation(observation: string): string {
  const o = observation.trim();
  const attachment = /^Attachment added:\s*(.+)$/i.exec(o);
  if (attachment) {
    return `Anexo adicionado: ${attachment[1].trim()}`;
  }
  const rejected = /^Rejected:\s*(.+)$/i.exec(o);
  if (rejected) {
    return `Motivo da rejeição: ${rejected[1].trim()}`;
  }
  if (/^Reimbursement draft created\.?$/i.test(o)) {
    return 'Rascunho da solicitação criado.';
  }
  if (/^Reimbursement details updated\.?$/i.test(o)) {
    return 'Detalhes da solicitação atualizados.';
  }
  if (/^Reimbursement submitted for approval\.?$/i.test(o)) {
    return 'Solicitação enviada para análise.';
  }
  if (/^Reimbursement approved\.?$/i.test(o)) {
    return 'Solicitação aprovada.';
  }
  if (/^Reimbursement paid\.?$/i.test(o)) {
    return 'Pagamento registrado.';
  }
  if (/^Reimbursement canceled\.?$/i.test(o)) {
    return 'Solicitação cancelada.';
  }
  return observation;
}
