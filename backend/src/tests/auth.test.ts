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
    expect(response.body.user.email).toBe('admin@test.com');
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
