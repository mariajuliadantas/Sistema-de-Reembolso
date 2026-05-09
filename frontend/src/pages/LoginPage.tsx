import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Field,
  Heading,
  Input,
  Stack,
  VStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/apiError';
import api from '../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token, refreshToken } = response.data;

      login(user, token, refreshToken);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Ocorreu um erro ao tentar fazer login.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="md" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <Box
        py={{ base: '0', sm: '8' }}
        px={{ base: '4', sm: '10' }}
        bg={{ base: 'transparent', sm: 'bg-surface' }}
        boxShadow={{ base: 'none', sm: 'md' }}
        borderRadius={{ base: 'none', sm: 'xl' }}
        borderWidth="1px"
      >
        <VStack gap="6" align="stretch">
          <Stack gap="2" textAlign="center">
            <Heading size="md">Faça login na sua conta</Heading>          
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack gap="5">
              <Stack gap="4">
                <Field.Root invalid={!!error}>
                  <Field.Label>E-mail</Field.Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setError('');
                      setEmail(e.target.value);
                    }}
                    placeholder="seu@email.com"
                    required
                  />
                </Field.Root>
                <Field.Root invalid={!!error}>
                  <Field.Label>Senha</Field.Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setError('');
                      setPassword(e.target.value);
                    }}
                    placeholder="********"
                    required
                  />
                  {error ? <Field.ErrorText>{error}</Field.ErrorText> : null}
                </Field.Root>
              </Stack>

              <Button 
                type="submit" 
                colorPalette="blue" 
                size="lg" 
                fontSize="md" 
                loading={isLoading}
              >
                Entrar
              </Button>
            </Stack>
          </form>
        </VStack>
      </Box>
    </Container>
  );
};

export default LoginPage;
