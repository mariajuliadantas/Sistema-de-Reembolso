import { Box, Heading, Table, Skeleton, Stack, Text, Flex, Button, VStack, Center, Badge, HStack } from '@chakra-ui/react';
import { useReimbursements, useSubmitReimbursement, useCancelReimbursement } from '../hooks/useReimbursements';
import StatusBadge from '../components/shared/StatusBadge';
import { Plus, ReceiptText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../lib/reimbursement';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: reimbursements, isLoading, isError } = useReimbursements();
  const submitMutation = useSubmitReimbursement();
  const cancelMutation = useCancelReimbursement();
  const canCreate = user?.role === 'COLLABORATOR';

  if (isLoading) {
    return (
      <Box>
        <Flex justify="space-between" align="center" mb={8}>
          <Skeleton h="40px" w="200px" />
          {canCreate ? <Skeleton h="40px" w="150px" /> : null}
        </Flex>
        <Stack gap={4}>
          <Skeleton h="60px" />
          <Skeleton h="60px" />
          <Skeleton h="60px" />
          <Skeleton h="60px" />
          <Skeleton h="60px" />
        </Stack>
      </Box>
    );
  }

  if (isError) {
    return (
      <Center h="50vh">
        <VStack>
          <Text color="red.500">Erro ao carregar reembolsos. Tente novamente mais tarde.</Text>
          <Button onClick={() => window.location.reload()}>Recarregar</Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="lg" letterSpacing="tight">Dashboard de Reembolsos</Heading>
          <Text color="fg.muted">Acompanhe solicitações e o andamento por perfil.</Text>
        </Box>
        {canCreate ? (
          <Button colorPalette="brand" gap={2} onClick={() => navigate('/reimbursements/new')}>
            <Plus size={18} />
            Novo Reembolso
          </Button>
        ) : null}
      </Flex>

      {reimbursements && reimbursements.length > 0 ? (
        <Box 
          bg="white" 
          borderRadius="xl" 
          boxShadow="sm" 
          overflowX="auto"
          border="1px solid"
          borderColor="border.muted"
        >
          <Table.Root variant="line">
            <Table.Header bg="bg.subtle">
              <Table.Row>
                <Table.ColumnHeader>Descrição</Table.ColumnHeader>
                {user?.role !== 'COLLABORATOR' ? <Table.ColumnHeader>Solicitante</Table.ColumnHeader> : null}
                <Table.ColumnHeader>Categoria</Table.ColumnHeader>
                <Table.ColumnHeader>Data</Table.ColumnHeader>
                <Table.ColumnHeader>Valor</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Ações</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {reimbursements.map((item) => (
                <Table.Row key={item.id} _hover={{ bg: 'bg.subtle' }} transition="bg 0.2s">
                  <Table.Cell>
                    <Text fontWeight="medium" lineClamp="1">{item.description}</Text>
                  </Table.Cell>
                  {user?.role !== 'COLLABORATOR' ? (
                    <Table.Cell>{item.requester?.name ?? '-'}</Table.Cell>
                  ) : null}
                  <Table.Cell>
                    <Badge variant="outline">{item.category.name}</Badge>
                  </Table.Cell>
                  <Table.Cell>{format(new Date(item.expenseDate), 'dd/MM/yyyy', { locale: ptBR })}</Table.Cell>
                  <Table.Cell fontWeight="bold">{formatCurrency(item.value)}</Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={item.status} />
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <HStack justify="flex-end">
                      {canCreate && item.status === 'DRAFT' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={submitMutation.isPending}
                          onClick={() => submitMutation.mutate(item.id)}
                        >
                          Enviar
                        </Button>
                      ) : null}
                      {canCreate && item.status === 'DRAFT' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          colorPalette="red"
                          loading={cancelMutation.isPending}
                          onClick={() => cancelMutation.mutate(item.id)}
                        >
                          Cancelar
                        </Button>
                      ) : null}
                      {canCreate && item.status === 'DRAFT' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/reimbursements/${item.id}/edit`)}
                        >
                          Editar
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/reimbursements/${item.id}`)}
                      >
                        Ver Detalhes
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      ) : (
        <Box py={20} textAlign="center" bg="white" borderRadius="xl" border="2px dashed" borderColor="border.muted">
          <VStack gap={4}>
            <ReceiptText size={48} color="gray" />
            <Box>
              <Heading size="md">Nenhum reembolso encontrado</Heading>
              <Text color="fg.muted">
                {canCreate
                  ? 'Você ainda não possui solicitações registradas.'
                  : 'Nenhuma solicitação disponível para o seu perfil no momento.'}
              </Text>
            </Box>
            {canCreate ? (
              <Button colorPalette="brand" variant="outline" mt={2} onClick={() => navigate('/reimbursements/new')}>
                Criar Primeiro Reembolso
              </Button>
            ) : null}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
