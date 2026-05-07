import request from 'supertest';
import app from '../server';

describe('Categorias', () => {
  let adminToken: string;
  let collaboratorToken: string;

  beforeAll(async () => {
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'admin123',
    });
    adminToken = adminLogin.body.token;

    const collabLogin = await request(app).post('/api/auth/login').send({
      email: 'collaborator@test.com',
      password: 'admin123',
    });
    collaboratorToken = collabLogin.body.token;
  });

  describe('GET /api/categories/active', () => {
    it('lista categorias ativas para usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/categories/active')
        .set('Authorization', `Bearer ${collaboratorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((c: { active: boolean }) => c.active)).toBe(true);
    });

    it('retorna 401 sem token', async () => {
      const response = await request(app).get('/api/categories/active');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/categories (ADMIN)', () => {
    it('lista todas as categorias para ADMIN', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      const names = response.body.map((c: { name: string }) => c.name);
      expect(names).toContain('Alimentação');
      expect(names).toContain('Inativa');
    });

    it('retorna 403 para colaborador', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${collaboratorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/categories (ADMIN)', () => {
    it('cria categoria com nome válido', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Categoria Jest ${Date.now()}` });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.active).toBe(true);
    });

    it('retorna 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/categories/:id (ADMIN)', () => {
    it('permite definir limite máximo por categoria', async () => {
      const create = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Com limite ${Date.now()}`, maxAmount: 99.5 });
      expect(create.status).toBe(201);
      expect(create.body.maxAmount).toBe(99.5);
    });

    it('atualiza nome da categoria', async () => {
      const create = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Editável ${Date.now()}` });
      const id = create.body.id as string;

      const response = await request(app)
        .put(`/api/categories/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Renomeada ${Date.now()}` });

      expect(response.status).toBe(200);
      expect(response.body.name).toContain('Renomeada');
    });
  });
});
