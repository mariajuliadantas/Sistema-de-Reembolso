// Mensagens do backend ao submeter sem comprovante obrigatório (valor acima do limiar).
export function isAttachmentPolicyMessage(message: string): boolean {
  return /comprovante|anexo|upload|obrigat[oó]rio/i.test(message);
}
