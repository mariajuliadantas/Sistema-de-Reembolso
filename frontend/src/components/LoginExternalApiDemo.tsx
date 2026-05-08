import React, { useEffect, useState } from 'react';
import { Text, Box } from '@chakra-ui/react';
import { fetchSampleQuoteWithAxios, fetchSampleTitleWithFetch } from '../lib/externalDemo';

//demonstra `fetch` e `axios` contra APIs públicas
 
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
    <Box mt={6} p={3} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
      <Text fontSize="xs" color="gray.800" lineHeight="short">
        {line}
      </Text>
    </Box>
  );
};

export default LoginExternalApiDemo;
