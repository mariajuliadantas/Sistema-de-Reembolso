import React, { useState } from 'react';
import type { AxiosError } from 'axios';
import { 
  Box, 
  Button, 
  Container, 
  Heading, 
  Input, 
  Stack, 
  Text, 
  Link,
  VStack
} from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

interface ApiErrorResponse {
  message?: string;
}

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
      const { user, token } = response.data;

      login(user, token);
      navigate('/');
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      console.error(err);
      setError(error.response?.data?.message || 'Ocorreu um erro ao tentar fazer login.');
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
            <Text color="fg.muted">
              Não tem uma conta? <Link asChild color="brand.500"><RouterLink to="/register">Cadastre-se</RouterLink></Link>
            </Text>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack gap="5">
              <Stack gap="4">
                <Box>
                  <Text mb="2" fontWeight="medium">E-mail</Text>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="seu@email.com"
                    required
                  />
                </Box>
                <Box>
                  <Text mb="2" fontWeight="medium">Senha</Text>
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    required
                  />
                </Box>
              </Stack>
              
              {error && (
                <Text color="red.500" fontSize="sm" textAlign="center">
                  {error}
                </Text>
              )}

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
