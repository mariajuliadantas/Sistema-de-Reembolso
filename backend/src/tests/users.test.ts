import request from 'supertest';
import app from '../server';
describe('Usuários (CRUD restrito a admin)', () => {
  let adminToken: string;
  let collaboratorToken: string;

  beforeAll(async () => {
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'admin123',
    });
    adminToken = adminLogin.body.token;

    const collaboratorLogin = await request(app).post('/api/auth/login').send({
      email: 'collaborator@test.com',
      password: 'admin123',
    });
    collaboratorToken = collaboratorLogin.body.token;
  });

  it('POST /api/users sem token é bloqueado', async () => {
    const email = `user_no_token_${Date.now()}@test.com`;
    const res = await request(app).post('/api/users').send({
      name: 'Usuário Sem Token',
      email,
      password: 'senha123',
      role: 'COLLABORATOR',
    });

    expect(res.status).toBe(401);
  });

  it('POST /api/users com token de colaborador é bloqueado', async () => {
    const email = `user_collab_forbidden_${Date.now()}@test.com`;
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${collaboratorToken}`)
      .send({
        name: 'Usuário Bloqueado',
        email,
        password: 'senha123',
        role: 'COLLABORATOR',
      });

    expect(res.status).toBe(403);
  });

  it('POST /api/users com token de admin pode criar usuário e definir perfil', async () => {
    const email = `manager_created_${Date.now()}@test.com`;
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Gestor Criado',
        email,
        password: 'senha123',
        role: 'MANAGER',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('MANAGER');
  });

  it('POST /api/users com token de admin e body inválido retorna 400', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'ad',
        email: 'invalido',
        password: '123',
        role: 'MANAGER',
      });

    expect(res.status).toBe(400);
  });

  it('GET /api/users lista usuários para ADMIN', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/users nega acesso sem token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});
