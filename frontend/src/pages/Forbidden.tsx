import { Center, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <Center h="100vh">
      <VStack gap={4}>
        <Heading size="2xl" color="red.500">403</Heading>
        <Heading size="lg">Acesso Negado</Heading>
        <Text>Você não tem permissão para acessar esta página.</Text>
        <Button colorPalette="blue" onClick={() => navigate('/')}>
          Voltar para o Início
        </Button>
      </VStack>
    </Center>
  );
};

export default Forbidden;
