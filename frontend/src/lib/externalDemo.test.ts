import axios from 'axios';
import { fetchSampleQuoteWithAxios, fetchSampleTitleWithFetch } from './externalDemo';

describe('externalDemo', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('fetchSampleTitleWithFetch lê o título do JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ title: 'Título de teste' }),
    }) as unknown as typeof fetch;

    await expect(fetchSampleTitleWithFetch()).resolves.toBe('Título de teste');
  });

  it('fetchSampleQuoteWithAxios lê a citação', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({ data: { quote: 'Citação de teste' } });

    await expect(fetchSampleQuoteWithAxios()).resolves.toBe('Citação de teste');
  });
});
