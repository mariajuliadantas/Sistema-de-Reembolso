import React, { useEffect, useState } from 'react';
import { Text, Box } from '@chakra-ui/react';
import { fetchSampleQuoteWithAxios, fetchSampleTitleWithFetch } from '../lib/externalDemo';

/**
 * Bloco opcional na tela de login: demonstra `fetch` e `axios` contra APIs públicas,
 * sem interferir no fluxo principal de autenticação.
 */
const LoginExternalApiDemo: React.FC = () => {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [title, quote] = await Promise.all([
          fetchSampleTitleWithFetch(),
          fetchSampleQuoteWithAxios(),
        ]);
        if (!cancelled) {
          setLine(`Exemplo externo — fetch: “${title.slice(0, 48)}…” | axios: “${quote.slice(0, 72)}…”`);
        }
      } catch {
        if (!cancelled) {
          setLine(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!line) {
    return null;
  }

  return (
    <Box mt={6} p={3} bg="bg.subtle" borderRadius="md" borderWidth="1px" borderColor="border.muted">
      <Text fontSize="xs" color="fg.muted" lineHeight="short">
        {line}
      </Text>
    </Box>
  );
};

export default LoginExternalApiDemo;
