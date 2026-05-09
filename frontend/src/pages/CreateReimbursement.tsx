import { Box, Heading, Text, Button, Flex } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ReimbursementForm from '../components/shared/ReimbursementForm';

const CreateReimbursement = () => {
  const navigate = useNavigate();

  return (
    <Box maxW="800px" mx="auto">
      <Flex align="center" gap={4} mb={6}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
        </Button>
        <Box>
          <Heading size="lg" letterSpacing="tight">
            Nova Solicitação
          </Heading>
          <Text color="fg.muted">
            Preencha os dados e, se quiser, selecione comprovantes antes de criar — eles serão enviados junto com o
            rascunho.
          </Text>
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
        <ReimbursementForm stageAttachmentsWithCreate />
      </Box>
    </Box>
  );
};

export default CreateReimbursement;
