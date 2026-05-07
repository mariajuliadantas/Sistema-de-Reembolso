/**
 * Valor acima do qual é obrigatório pelo menos um comprovante enviado por upload (URL contendo `/uploads/`).
 * Configure `REIMBURSEMENT_REQUIRE_ATTACHMENT_ABOVE_VALUE`: número positivo (ex.: 500), ou 0 para desativar a regra.
 * Se a variável não existir, o padrão é 500.
 */
export const getAttachmentRequirementThreshold = (): number | null => {
  const raw = process.env.REIMBURSEMENT_REQUIRE_ATTACHMENT_ABOVE_VALUE?.trim();
  if (raw === undefined || raw === '') {
    return 500;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
};

export const hasUploadedReceiptEvidence = (attachments: { fileUrl: string }[]): boolean => {
  return attachments.some((a) => typeof a.fileUrl === 'string' && a.fileUrl.includes('/uploads/'));
};
