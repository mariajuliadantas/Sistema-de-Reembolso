// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // Note o .tsx
import './index.css'; // Mantenha o CSS global do Vite
import { ChakraProvider, createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import { AuthProvider } from './contexts/AuthContext';

// No Chakra UI v3, as customizações são feitas através de tokens dentro do defineConfig
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
    <ChakraProvider value={system}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ChakraProvider>
  </React.StrictMode>,
);