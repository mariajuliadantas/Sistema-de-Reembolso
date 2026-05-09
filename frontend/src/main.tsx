// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; 
import './index.css'; 
import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
  Toaster,
  Toast,
} from '@chakra-ui/react';
import { toaster } from './lib/toaster';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, 
    },
  },
});

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#e6f6ff' },
          100: { value: '#b3e0ff' },
          200: { value: '#80cbff' },
          300: { value: '#4db6ff' },
          400: { value: '#1a9eff' },
          500: { value: '#0084e6' },
          600: { value: '#006bb3' },
          700: { value: '#004f80' },
          800: { value: '#00334d' },
          900: { value: '#001a1a' },
        },
      },
    },
  },
});

const system = createSystem(defaultConfig, config);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <AuthProvider>
          <App />
          <Toaster toaster={toaster}>
            {(toast) => (
              <Toast.Root>
                <Toast.Indicator />
                <Toast.Title>{toast.title}</Toast.Title>
                {toast.description ? <Toast.Description>{toast.description}</Toast.Description> : null}
                <Toast.CloseTrigger />
              </Toast.Root>
            )}
          </Toaster>
        </AuthProvider>
      </ChakraProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);