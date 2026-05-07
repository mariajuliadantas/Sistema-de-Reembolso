import request from 'supertest';
import app from '../server';

describe('Endpoints de Autenticação', () => {
  it('deve fazer login com sucesso com credenciais válidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('refreshToken');
    expect(typeof response.body.refreshToken).toBe('string');
    expect(response.body.user.email).toBe('admin@test.com');
  });

  it('deve renovar access token com refresh token válido', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'admin123',
    });
    const { refreshToken } = login.body;

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.message).toBe('Token renovado');
  });

  it('deve falhar no refresh com token inválido', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'token-invalido' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Refresh token inválido ou expirado');
  });

  it('deve falhar no refresh sem corpo válido', async () => {
    const response = await request(app).post('/api/auth/refresh').send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/refresh token/i);
  });

  it('deve rejeitar refresh token usado como Bearer em rota protegida', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'collaborator@test.com',
      password: 'admin123',
    });
    const { refreshToken } = login.body;

    const response = await request(app)
      .get('/api/categories/active')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('refresh');
  });

  it('deve falhar com senha incorreta', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'senha_errada',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Credenciais inválidas');
    expect(response.body.error).toBe('Unauthorized');
  });

  it('deve falhar com usuário inexistente', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'naoexiste@test.com',
        password: 'admin123',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Credenciais inválidas');
    expect(response.body.error).toBe('Unauthorized');
  });

  it('deve falhar com formato de e-mail inválido', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'email-invalido',
        password: 'admin123',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Email inválido');
    expect(response.body.error).toBe('Bad Request');
  });
});
