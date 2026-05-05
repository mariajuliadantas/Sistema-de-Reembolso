import { Box, Heading, Text, Button, Flex, Center, VStack } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ReimbursementForm from '../components/shared/ReimbursementForm';
import { useReimbursement } from '../hooks/useReimbursements';

const EditReimbursement = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: reimbursement, isLoading, isError } = useReimbursement(id);

  if (isLoading) {
    return <Text>Carregando reembolso...</Text>;
  }

  if (isError || !reimbursement) {
    return (
      <Center h="50vh">
        <VStack>
          <Text color="red.500">Não foi possível carregar o reembolso.</Text>
          <Button onClick={() => navigate('/')}>Voltar</Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box maxW="800px" mx="auto">
      <Flex align="center" gap={4} mb={6}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
        </Button>
        <Box>
          <Heading size="lg" letterSpacing="tight">Editar Solicitação</Heading>
          <Text color="fg.muted">Ajuste os dados do reembolso em rascunho.</Text>
        </Box>
      </Flex>

      <Box
        bg="white"
        p={{ base: 6, md: 8 }}
        borderRadius="xl"
        boxShadow="sm"
        border="1px solid"
        borderColor="border.muted"
      >
        <ReimbursementForm reimbursement={reimbursement} />
      </Box>
    </Box>
  );
};

export default EditReimbursement;
