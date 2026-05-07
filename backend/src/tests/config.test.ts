import request from 'supertest';
import app from '../server';

describe('GET /api/config/reimbursement-rules', () => {
  const prev = process.env.REIMBURSEMENT_REQUIRE_ATTACHMENT_ABOVE_VALUE;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.REIMBURSEMENT_REQUIRE_ATTACHMENT_ABOVE_VALUE;
    } else {
      process.env.REIMBURSEMENT_REQUIRE_ATTACHMENT_ABOVE_VALUE = prev;
    }
  });

  it('retorna o limiar alinhado à env (ex.: 750)', async () => {
    process.env.REIMBURSEMENT_REQUIRE_ATTACHMENT_ABOVE_VALUE = '750';
    const response = await request(app).get('/api/config/reimbursement-rules');
    expect(response.status).toBe(200);
    expect(response.body.requireAttachmentAboveValue).toBe(750);
  });

  it('não exige autenticação', async () => {
    const response = await request(app).get('/api/config/reimbursement-rules');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('requireAttachmentAboveValue');
  });
});
