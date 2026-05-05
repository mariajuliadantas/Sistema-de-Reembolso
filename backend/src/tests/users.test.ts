import request from 'supertest';
import app from '../server';
import { prisma } from '../utils/prisma';

describe('Usuários (CRUD admin + cadastro público)', () => {
  let adminToken: string;

  beforeAll(async () => {
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'admin123',
    });
    adminToken = adminLogin.body.token;
  });

  it('POST /api/users sem token não permite enviar role', async () => {
    const email = `public_user_${Date.now()}@test.com`;
    const res = await request(app).post('/api/users').send({
      name: 'Usuário Público',
      email,
      password: 'senha123',
      role: 'ADMIN',
    });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('definir o perfil');

    const dbUser = await prisma.user.findUnique({ where: { email } });
    expect(dbUser).toBeNull();
  });

  it('POST /api/users sem token cria colaborador quando role não é enviada', async () => {
    const email = `public_user_ok_${Date.now()}@test.com`;
    const res = await request(app).post('/api/users').send({
      name: 'Usuário Público',
      email,
      password: 'senha123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('COLLABORATOR');
  });

  it('POST /api/users com token de admin pode definir perfil', async () => {
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
