import request from 'supertest';
import app from '../server';

describe('Fluxo de Reembolso', () => {
  let collaboratorToken: string;
  let managerToken: string;
  let financialToken: string;

  // IDs em formato UUID para passar na validação do Zod
  const FOOD_CATEGORY_ID = '550e8400-e29b-41d4-a716-446655440004';
  const INACTIVE_CATEGORY_ID = '550e8400-e29b-41d4-a716-446655440006';

  beforeAll(async () => {
    const collabLogin = await request(app).post('/api/auth/login').send({
      email: 'collaborator@test.com',
      password: 'admin123',
    });
    collaboratorToken = collabLogin.body.token;

    const managerLogin = await request(app).post('/api/auth/login').send({
      email: 'manager@test.com',
      password: 'admin123',
    });
    managerToken = managerLogin.body.token;

    const financialLogin = await request(app).post('/api/auth/login').send({
      email: 'financial@test.com',
      password: 'admin123',
    });
    financialToken = financialLogin.body.token;
  });

  describe('Criação de Reembolso (POST /api/reimbursements)', () => {
    it('deve permitir que um colaborador crie uma solicitação de reembolso', async () => {
      const response = await request(app)
        .post('/api/reimbursements')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          categoryId: FOOD_CATEGORY_ID,
          description: 'Almoço com cliente em prospecção',
          value: 50.5,
          expenseDate: new Date().toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('DRAFT');
      expect(response.body.value).toBe(50.5);
    });

    it('deve impedir a criação de reembolso com valor negativo', async () => {
      const response = await request(app)
        .post('/api/reimbursements')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          categoryId: FOOD_CATEGORY_ID,
          description: 'Almoço de equipe',
          value: -10,
          expenseDate: new Date().toISOString(),
        });

      expect(response.status).toBe(400);
    });

    it('deve impedir a criação de reembolso vinculado a uma categoria inativa', async () => {
      const response = await request(app)
        .post('/api/reimbursements')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          categoryId: INACTIVE_CATEGORY_ID,
          description: 'Despesa genérica',
          value: 10,
          expenseDate: new Date().toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Categoria inválida ou inativa');
    });
  });

  describe('Fluxo de Estados (Workflow)', () => {
    it('deve seguir o fluxo feliz: RASCUNHO -> ENVIADO -> APROVADO -> PAGO', async () => {
      const createRes = await request(app)
        .post('/api/reimbursements')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          categoryId: FOOD_CATEGORY_ID,
          description: 'Viagem técnica para treinamento especializado',
          value: 100,
          expenseDate: new Date().toISOString(),
        });
      const reimbursementId = createRes.body.id;

      const submitRes = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/submit`)
        .set('Authorization', `Bearer ${collaboratorToken}`);
      expect(submitRes.status).toBe(200);
      expect(submitRes.body.status).toBe('SUBMITTED');

      const approveRes = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/approve`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.status).toBe('APPROVED');

      const payRes = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/pay`)
        .set('Authorization', `Bearer ${financialToken}`);
      expect(payRes.status).toBe(200);
      expect(payRes.body.status).toBe('PAID');
    });

    it('deve permitir que o gestor rejeite uma solicitação enviando uma justificativa', async () => {
       const createRes = await request(app)
       .post('/api/reimbursements')
       .set('Authorization', `Bearer ${collaboratorToken}`)
       .send({
         categoryId: FOOD_CATEGORY_ID,
         description: 'Compra de suprimentos de escritório',
         value: 20,
         expenseDate: new Date().toISOString(),
       });
       const reimbursementId = createRes.body.id;
       await request(app).post(`/api/reimbursements/${reimbursementId}/submit`).set('Authorization', `Bearer ${collaboratorToken}`);

       const rejectRes = await request(app)
         .post(`/api/reimbursements/${reimbursementId}/reject`)
         .set('Authorization', `Bearer ${managerToken}`)
         .send({ reason: 'Falta o anexo legível da nota fiscal' });
       
       expect(rejectRes.status).toBe(200);
       expect(rejectRes.body.status).toBe('REJECTED');
       expect(rejectRes.body.rejectionReason).toBe('Falta o anexo legível da nota fiscal');
    });
  });

  describe('Segurança e Permissões (RBAC)', () => {
    it('não deve permitir que um colaborador aprove reembolsos', async () => {
      const response = await request(app)
        .post(`/api/reimbursements/550e8400-e29b-41d4-a716-446655440000/approve`)
        .set('Authorization', `Bearer ${collaboratorToken}`);

      expect(response.status).toBe(403);
    });

    it('não deve permitir que um colaborador marque solicitações como pagas', async () => {
      const response = await request(app)
        .post(`/api/reimbursements/550e8400-e29b-41d4-a716-446655440000/pay`)
        .set('Authorization', `Bearer ${collaboratorToken}`);

      expect(response.status).toBe(403);
    });
  });
});
