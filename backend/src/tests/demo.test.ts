import request from 'supertest';
import app from '../server';

describe('Demo API externa', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('GET /api/demo/external-post retorna payload quando o fetch externo funciona', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, userId: 7, title: 'sunt aut facere' }),
    }) as unknown as typeof fetch;

    const response = await request(app).get('/api/demo/external-post');

    expect(response.status).toBe(200);
    expect(response.body.postId).toBe(1);
    expect(response.body.title).toBe('sunt aut facere');
    expect(response.body.userId).toBe(7);
    expect(response.body.source).toContain('jsonplaceholder');
  });

  it('GET /api/demo/external-post retorna 502 quando upstream falha', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    const response = await request(app).get('/api/demo/external-post');

    expect(response.status).toBe(502);
    expect(response.body.statusCode).toBe(502);
    expect(response.body.error).toBe('Bad Gateway');
  });
});
