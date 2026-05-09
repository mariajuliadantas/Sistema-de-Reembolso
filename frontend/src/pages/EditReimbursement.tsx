import { Box, Heading, Text, Button, Flex, Center, VStack } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ReimbursementForm from '../components/shared/ReimbursementForm';
import ReimbursementAttachmentsSection from '../components/shared/ReimbursementAttachmentsSection';
import { useReimbursement } from '../hooks/useReimbursements';
import { useAuth } from '../hooks/useAuth';

const EditReimbursement = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: reimbursement, isLoading, isError } = useReimbursement(id);

  const canUploadAttachments =
    user?.role === 'COLLABORATOR' && reimbursement?.requesterId === user.id && reimbursement.status === 'DRAFT';

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

  if (reimbursement.status !== 'DRAFT') {
    return (
      <Box maxW="800px" mx="auto">
        <Flex align="center" gap={4} mb={6}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </Button>
          <Box>
            <Heading size="lg" letterSpacing="tight">
              Edição não disponível
            </Heading>
            <Text color="fg.muted">
              Só é possível editar solicitações em rascunho. Esta solicitação já foi enviada ou
              processada.
            </Text>
          </Box>
        </Flex>
        <Center
          py={12}
          px={6}
          bg="white"
          borderRadius="xl"
          boxShadow="sm"
          border="1px solid"
          borderColor="border.muted"
        >
          <VStack gap={4}>
            <Text textAlign="center" color="fg.muted">
              Abra os detalhes para acompanhar o fluxo ou use o painel para outras ações.
            </Text>
            <Button colorPalette="brand" onClick={() => navigate(`/reimbursements/${id}`)}>
              Ver detalhes
            </Button>
          </VStack>
        </Center>
      </Box>
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

      <VStack align="stretch" gap={8}>
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

        <Box
          bg="white"
          p={{ base: 6, md: 8 }}
          borderRadius="xl"
          boxShadow="sm"
          border="1px solid"
          borderColor="border.muted"
        >
          <ReimbursementAttachmentsSection
            reimbursementId={reimbursement.id}
            canUpload={canUploadAttachments}
          />
        </Box>
      </VStack>
    </Box>
  );
};

export default EditReimbursement;
