import { getAttachmentRequirementThreshold, hasUploadedReceiptEvidence } from '../utils/reimbursementRules';

describe('reimbursementRules', () => {
  const prev = process.env.REIMBURSEMENT_REQUIRE_ATTACHMENT_ABOVE_VALUE;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.REIMBURSEMENT_REQUIRE_ATTACHMENT_ABOVE_VALUE;
    } else {
      process.env.REIMBURSEMENT_REQUIRE_ATTACHMENT_ABOVE_VALUE = prev;
    }
  });

  it('retorna 500 por padrão quando a env não está definida', () => {
    delete process.env.REIMBURSEMENT_REQUIRE_ATTACHMENT_ABOVE_VALUE;
    expect(getAttachmentRequirementThreshold()).toBe(500);
  });

  it('retorna null quando configurado como 0', () => {
    process.env.REIMBURSEMENT_REQUIRE_ATTACHMENT_ABOVE_VALUE = '0';
    expect(getAttachmentRequirementThreshold()).toBeNull();
  });

  it('hasUploadedReceiptEvidence reconhece /uploads/', () => {
    expect(hasUploadedReceiptEvidence([{ fileUrl: 'http://x/uploads/a.pdf' }])).toBe(true);
    expect(hasUploadedReceiptEvidence([{ fileUrl: 'https://x.com/a.pdf' }])).toBe(false);
  });
});
