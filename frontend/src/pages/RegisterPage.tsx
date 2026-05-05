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
import api from '../services/api';

interface ApiErrorResponse {
  message?: string;
}

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/users', { name, email, password });

      navigate('/login');
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      setError(error.response?.data?.message || 'Ocorreu um erro ao criar sua conta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="md" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <Box
        py={{ base: '0', sm: '8' }}
        px={{ base: '4', sm: '10' }}
        boxShadow={{ base: 'none', sm: 'md' }}
        borderRadius={{ base: 'none', sm: 'xl' }}
        borderWidth="1px"
      >
        <VStack gap="6" align="stretch">
          <Stack gap="2" textAlign="center">
            <Heading size="md">Crie sua conta</Heading>
            <Text color="fg.muted">
              Já tem uma conta? <Link asChild color="brand.500"><RouterLink to="/login">Faça login</RouterLink></Link>
            </Text>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack gap="5">
              <Stack gap="4">
                <Box>
                  <Text mb="2" fontWeight="medium">Nome Completo</Text>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Seu nome"
                    required
                  />
                </Box>
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
                <Box>
                  <Text mb="2" fontWeight="medium">Confirmar Senha</Text>
                  <Input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                loading={isLoading}
              >
                Cadastrar
              </Button>
            </Stack>
          </form>
        </VStack>
      </Box>
    </Container>
  );
};

export default RegisterPage;
