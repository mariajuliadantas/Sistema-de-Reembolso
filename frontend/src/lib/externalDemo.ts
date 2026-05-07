import axios from 'axios';

/** Exemplo de consumo externo com `fetch` (API pública, só demonstração). */
export async function fetchSampleTitleWithFetch(): Promise<string> {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts/1');
  if (!res.ok) {
    throw new Error('Falha na requisição externa (fetch)');
  }
  const data = (await res.json()) as { title?: string };
  return String(data.title ?? '');
}

/** Exemplo de consumo externo com `axios` (API pública diferente, só demonstração). */
export async function fetchSampleQuoteWithAxios(): Promise<string> {
  const { data } = await axios.get<{ quote?: string }>('https://dummyjson.com/quotes/1', {
    timeout: 8000,
  });
  return String(data.quote ?? '');
}
