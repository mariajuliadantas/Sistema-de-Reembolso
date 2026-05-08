import request from 'supertest';
import app from '../server';

describe('Fluxo de Reembolso', () => {
  let collaboratorToken: string;
  let secondCollaboratorToken: string;
  let managerToken: string;
  let financialToken: string;
  let adminToken: string;

  const FOOD_CATEGORY_ID = '550e8400-e29b-41d4-a716-446655440004';
  const TRANSPORT_CATEGORY_ID = '550e8400-e29b-41d4-a716-446655440005';
  const INACTIVE_CATEGORY_ID = '550e8400-e29b-41d4-a716-446655440006';
  const NON_EXISTENT_ID = '550e8400-e29b-41d4-a716-446655441999';

  const minimalPdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n', 'utf-8');

  const attachPdf = (reimbursementId: string, token: string) =>
    request(app)
      .post(`/api/reimbursements/${reimbursementId}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', minimalPdf, { filename: 'nota.pdf', contentType: 'application/pdf' });

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

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'admin123',
    });
    adminToken = adminLogin.body.token;

    await request(app).post('/api/auth/register').send({
      name: 'Second Collaborator',
      email: 'collaborator2@test.com',
      password: 'admin123',
    });

    const secondCollabLogin = await request(app).post('/api/auth/login').send({
      email: 'collaborator2@test.com',
      password: 'admin123',
    });
    secondCollaboratorToken = secondCollabLogin.body.token;
  });

  const createDraftWith = async (overrides?: {
    categoryId?: string;
    value?: number;
    description?: string;
    expenseDate?: string;
  }) => {
    const response = await request(app)
      .post('/api/reimbursements')
      .set('Authorization', `Bearer ${collaboratorToken}`)
      .send({
        categoryId: overrides?.categoryId ?? FOOD_CATEGORY_ID,
        description: overrides?.description ?? 'Despesa de teste para fluxo',
        value: overrides?.value ?? 120,
        expenseDate: overrides?.expenseDate ?? new Date().toISOString(),
      });

    return { id: response.body.id as string, status: response.status, body: response.body };
  };

  const createDraft = async () => {
    const { id } = await createDraftWith();
    return id;
  };

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
      expect(response.body.message).toBe('Categoria inválida ou inativa');
      expect(response.body.error).toBe('Bad Request');
    });

    it('deve impedir valor acima do limite configurado na categoria', async () => {
      const response = await request(app)
        .post('/api/reimbursements')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          categoryId: TRANSPORT_CATEGORY_ID,
          description: 'Viagem longa',
          value: 400,
          expenseDate: new Date().toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('limite da categoria');
    });

    it('deve impedir data da despesa no futuro', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      const response = await request(app)
        .post('/api/reimbursements')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          categoryId: FOOD_CATEGORY_ID,
          description: 'Despesa com data futura',
          value: 20,
          expenseDate: future.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('futuro');
    });

    it('deve falhar sem autenticação', async () => {
      const response = await request(app).post('/api/reimbursements').send({
        categoryId: FOOD_CATEGORY_ID,
        description: 'Sem token',
        value: 40,
        expenseDate: new Date().toISOString(),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Editar (PUT /api/reimbursements/:id)', () => {
    it('deve permitir edição de reembolso próprio em DRAFT', async () => {
      const reimbursementId = await createDraft();

      const response = await request(app)
        .put(`/api/reimbursements/${reimbursementId}`)
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          description: 'Despesa alterada',
          value: 130,
          expenseDate: new Date().toISOString(),
          categoryId: FOOD_CATEGORY_ID,
        });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Despesa alterada');
    });

    it('deve impedir edição por outro colaborador', async () => {
      const reimbursementId = await createDraft();

      const response = await request(app)
        .put(`/api/reimbursements/${reimbursementId}`)
        .set('Authorization', `Bearer ${secondCollaboratorToken}`)
        .send({ description: 'Tentativa indevida' });

      expect(response.status).toBe(403);
    });

    it('deve impedir edição quando status não for DRAFT', async () => {
      const reimbursementId = await createDraft();
      await request(app)
        .post(`/api/reimbursements/${reimbursementId}/submit`)
        .set('Authorization', `Bearer ${collaboratorToken}`);

      const response = await request(app)
        .put(`/api/reimbursements/${reimbursementId}`)
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({ description: 'Não deveria editar submetido' });

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 ao editar inexistente', async () => {
      const response = await request(app)
        .put(`/api/reimbursements/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({ description: 'Não existe' });

      expect(response.status).toBe(404);
    });
  });

  describe('Fluxo de Estados (Workflow)', () => {
    it('deve seguir o fluxo feliz: DRAFT -> SUBMITTED -> APPROVED -> PAID', async () => {
      const reimbursementId = await createDraft();

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

    it('deve permitir rejeição com justificativa obrigatória', async () => {
      const reimbursementId = await createDraft();
      await request(app)
        .post(`/api/reimbursements/${reimbursementId}/submit`)
        .set('Authorization', `Bearer ${collaboratorToken}`);

      const rejectRes = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/reject`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ reason: 'Falta o anexo legível da nota fiscal' });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.status).toBe('REJECTED');
      expect(rejectRes.body.rejectionReason).toBe('Falta o anexo legível da nota fiscal');
    });

    it('deve falhar ao rejeitar sem justificativa', async () => {
      const reimbursementId = await createDraft();
      await request(app)
        .post(`/api/reimbursements/${reimbursementId}/submit`)
        .set('Authorization', `Bearer ${collaboratorToken}`);

      const response = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/reject`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ reason: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('Cancelamento', () => {
    it('deve permitir cancelamento apenas em DRAFT', async () => {
      const reimbursementId = await createDraft();
      const response = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/cancel`)
        .set('Authorization', `Bearer ${collaboratorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CANCELLED');
    });

    it('deve impedir cancelamento em SUBMITTED', async () => {
      const reimbursementId = await createDraft();
      await request(app)
        .post(`/api/reimbursements/${reimbursementId}/submit`)
        .set('Authorization', `Bearer ${collaboratorToken}`);

      const response = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/cancel`)
        .set('Authorization', `Bearer ${collaboratorToken}`);

      expect(response.status).toBe(400);
    });

    it('deve impedir cancelamento por quem não é dono', async () => {
      const reimbursementId = await createDraft();
      const response = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/cancel`)
        .set('Authorization', `Bearer ${secondCollaboratorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Segurança e Permissões (RBAC)', () => {
    it('não deve permitir que colaborador aprove', async () => {
      const reimbursementId = await createDraft();
      const response = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/approve`)
        .set('Authorization', `Bearer ${collaboratorToken}`);
      expect(response.status).toBe(403);
    });

    it('não deve permitir que colaborador marque como pago', async () => {
      const reimbursementId = await createDraft();
      const response = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/pay`)
        .set('Authorization', `Bearer ${collaboratorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Histórico no banco para gestor', () => {
    it('deve permitir que gestor veja solicitações já tratadas por ele', async () => {
      const reimbursementId = await createDraft();
      await request(app)
        .post(`/api/reimbursements/${reimbursementId}/submit`)
        .set('Authorization', `Bearer ${collaboratorToken}`);
      await request(app)
        .post(`/api/reimbursements/${reimbursementId}/approve`)
        .set('Authorization', `Bearer ${managerToken}`);

      const managerList = await request(app)
        .get('/api/reimbursements')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(managerList.status).toBe(200);
      const hasHandledRequest = managerList.body.items.some((item: { id: string }) => item.id === reimbursementId);
      expect(hasHandledRequest).toBe(true);
    });
  });

  describe('Categorias', () => {
    it('deve impedir colaborador de criar categoria', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({ name: 'Nova categoria' });

      expect(response.status).toBe(403);
    });

    it('deve impedir uso de categoria inexistente', async () => {
      const response = await request(app)
        .post('/api/reimbursements')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          categoryId: NON_EXISTENT_ID,
          description: 'Categoria inexistente',
          value: 25,
          expenseDate: new Date().toISOString(),
        });

      expect(response.status).toBe(400);
    });

    it('deve exigir nome ao criar categoria', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('Anexos e Histórico', () => {
    it('deve validar tipo de anexo e dono da solicitação (upload multipart)', async () => {
      const reimbursementId = await createDraft();

      const invalidTypeRes = await request(app)
        .post(`/api/reimbursements/${reimbursementId}/attachments`)
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .attach('file', Buffer.from('MZ'), { filename: 'bad.exe', contentType: 'application/octet-stream' });
      expect(invalidTypeRes.status).toBe(400);

      const notOwnerRes = await attachPdf(reimbursementId, secondCollaboratorToken);
      expect(notOwnerRes.status).toBe(403);
    });

    it('deve retornar 404 ao anexar em solicitação inexistente', async () => {
      const response = await attachPdf(NON_EXISTENT_ID, collaboratorToken);
      expect(response.status).toBe(404);
    });

    it('deve exigir comprovante por upload para valores acima do limiar ao submeter', async () => {
      const { id, status } = await createDraftWith({ value: 600 });
      expect(status).toBe(201);

      const submitFail = await request(app)
        .post(`/api/reimbursements/${id}/submit`)
        .set('Authorization', `Bearer ${collaboratorToken}`);
      expect(submitFail.status).toBe(400);
      expect(submitFail.body.message).toMatch(/comprovante|upload/i);

      const attachRes = await attachPdf(id, collaboratorToken);
      expect(attachRes.status).toBe(201);

      const submitOk = await request(app)
        .post(`/api/reimbursements/${id}/submit`)
        .set('Authorization', `Bearer ${collaboratorToken}`);
      expect(submitOk.status).toBe(200);
      expect(submitOk.body.status).toBe('SUBMITTED');
    });

    it('deve registrar histórico para ações relevantes', async () => {
      const reimbursementId = await createDraft();

      await request(app)
        .post(`/api/reimbursements/${reimbursementId}/submit`)
        .set('Authorization', `Bearer ${collaboratorToken}`);
      await request(app)
        .post(`/api/reimbursements/${reimbursementId}/approve`)
        .set('Authorization', `Bearer ${managerToken}`);
      await request(app)
        .post(`/api/reimbursements/${reimbursementId}/pay`)
        .set('Authorization', `Bearer ${financialToken}`);

      const historyResponse = await request(app)
        .get(`/api/reimbursements/${reimbursementId}/history`)
        .set('Authorization', `Bearer ${collaboratorToken}`);

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body.length).toBeGreaterThanOrEqual(4);

      const actions = historyResponse.body.map((entry: { action: string }) => entry.action);
      expect(actions).toContain('CREATED');
      expect(actions).toContain('SUBMITTED');
      expect(actions).toContain('APPROVED');
      expect(actions).toContain('PAID');
    });

    it('deve registrar histórico ao adicionar anexo', async () => {
      const reimbursementId = await createDraft();

      const addAttachmentRes = await attachPdf(reimbursementId, collaboratorToken);

      expect(addAttachmentRes.status).toBe(201);

      const historyResponse = await request(app)
        .get(`/api/reimbursements/${reimbursementId}/history`)
        .set('Authorization', `Bearer ${collaboratorToken}`);

      expect(historyResponse.status).toBe(200);
      const hasAttachmentHistory = historyResponse.body.some(
        (entry: { observation?: string }) =>
          (entry.observation || '').includes('Attachment added: nota.pdf'),
      );
      expect(hasAttachmentHistory).toBe(true);
    });
  });
});
