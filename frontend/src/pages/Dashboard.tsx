import { Box, Heading, Table, Skeleton, Stack, Text, Flex, Button, VStack, Center, Badge, HStack, Input } from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { useReimbursements, useSubmitReimbursement, useCancelReimbursement } from '../hooks/useReimbursements';
import StatusBadge from '../components/shared/StatusBadge';
import { Plus, ReceiptText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../lib/reimbursement';
import { useCategories } from '../hooks/useCategories';
import type { ReimbursementStatus } from '../types/reimbursement';

const statusValues: ReimbursementStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'PAID',
  'CANCELLED',
];

const isStatus = (value: string | null): value is ReimbursementStatus =>
  value !== null && statusValues.includes(value as ReimbursementStatus);

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const canCreate = user?.role === 'COLLABORATOR';
  const canSearchRequester = user?.role !== 'COLLABORATOR';
  const { data: categoryCatalog } = useCategories({ includeInactive: true });

  const statusParam = searchParams.get('status');
  const statusFilter = isStatus(statusParam) ? statusParam : 'ALL';
  const categoryFilter = searchParams.get('categoryId') || 'ALL';
  const sortBy = searchParams.get('sortBy') || 'DATE_DESC';
  const requesterSearch = searchParams.get('requester') ?? '';
  const [requesterInput, setRequesterInput] = useState(requesterSearch);

  const apiSortBy = sortBy.startsWith('VALUE') ? 'value' : 'expenseDate';
  const apiSortOrder = sortBy.endsWith('ASC') ? 'asc' : 'desc';

  const { data: reimbursements, isLoading, isError } = useReimbursements({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    categoryId: categoryFilter === 'ALL' ? undefined : categoryFilter,
    requesterSearch: canSearchRequester ? requesterSearch : undefined,
    sortBy: apiSortBy,
    sortOrder: apiSortOrder,
  });
  const submitMutation = useSubmitReimbursement();
  const cancelMutation = useCancelReimbursement();

  const updateQueryParam = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === 'ALL') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    });
  }, [setSearchParams]);

  const categoryOptions = useMemo(() => {
    const categories = categoryCatalog ?? [];
    const unique = new Map(categories.map((category) => [category.id, category]));
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [categoryCatalog]);

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

      <Box mb={6} bg="white" borderRadius="xl" border="1px solid" borderColor="border.muted" p={4}>
        <HStack gap={3} align="end" flexWrap="wrap">
          <Box minW="180px">
            <Text fontSize="sm" mb={1}>Status</Text>
            <select
              value={statusFilter}
              onChange={(event) => updateQueryParam('status', event.target.value)}
              style={{ width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '0 10px' }}
            >
              <option value="ALL">Todos</option>
              <option value="DRAFT">Rascunho</option>
              <option value="SUBMITTED">Enviado</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REJECTED">Rejeitado</option>
              <option value="PAID">Pago</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </Box>

          <Box minW="220px">
            <Text fontSize="sm" mb={1}>Categoria</Text>
            <select
              value={categoryFilter}
              onChange={(event) => updateQueryParam('categoryId', event.target.value)}
              style={{ width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '0 10px' }}
            >
              <option value="ALL">Todas</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Box>

          <Box minW="220px">
            <Text fontSize="sm" mb={1}>Ordenar por</Text>
            <select
              value={sortBy}
              onChange={(event) => updateQueryParam('sortBy', event.target.value)}
              style={{ width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '0 10px' }}
            >
              <option value="DATE_DESC">Data (mais recente)</option>
              <option value="DATE_ASC">Data (mais antiga)</option>
              <option value="VALUE_DESC">Valor (maior)</option>
              <option value="VALUE_ASC">Valor (menor)</option>
            </select>
          </Box>

          {canSearchRequester ? (
            <Box minW="240px" flex="1">
              <Text fontSize="sm" mb={1}>Buscar por colaborador</Text>
              <HStack>
                <Input
                  placeholder="Nome do solicitante"
                  value={requesterInput}
                  onChange={(event) => setRequesterInput(event.target.value)}
                  bg="white"
                />
                <Button
                  type="button"
                  onClick={() => updateQueryParam('requester', requesterInput.trim())}
                >
                  Buscar
                </Button>
              </HStack>
            </Box>
          ) : null}

          <Button
            variant="outline"
            onClick={() => {
              setSearchParams(new URLSearchParams());
              setRequesterInput('');
            }}
          >
            Limpar filtros
          </Button>
        </HStack>
      </Box>

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
