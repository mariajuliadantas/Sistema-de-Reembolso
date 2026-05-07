import {
  Box,
  Heading,
  Text,
  Button,
  Table,
  Skeleton,
  Stack,
  Flex,
  VStack,
  Center,
  Input,
  HStack,
  Switch,
} from '@chakra-ui/react';
import { useState, useMemo } from 'react';
import type { AxiosError } from 'axios';
import { useCategories, useCreateCategory, useUpdateCategory } from '../hooks/useCategories';
import { Plus } from 'lucide-react';

interface ApiErrorBody {
  message?: string;
}

const CategoriesManagement = () => {
  const { data: categories, isLoading, isError } = useCategories({ includeInactive: true });
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryMax, setNewCategoryMax] = useState('');
  const [limitDraftOverrides, setLimitDraftOverrides] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState('');

  const limitDraft = useMemo(() => {
    if (!categories) {
      return {};
    }
    const base: Record<string, string> = {};
    for (const c of categories) {
      base[c.id] = c.maxAmount != null && c.maxAmount !== undefined ? String(c.maxAmount) : '';
    }
    return { ...base, ...limitDraftOverrides };
  }, [categories, limitDraftOverrides]);

  if (isLoading) {
    return (
      <>
        <Skeleton h="40px" w="300px" mb={8} />
        <Stack gap={4}>
          <Skeleton h="60px" />
          <Skeleton h="60px" />
          <Skeleton h="60px" />
        </Stack>
      </>
    );
  }

  if (isError) {
    return (
      <Center h="50vh">
        <VStack>
          <Text color="red.500">Erro ao carregar categorias.</Text>
          <Button onClick={() => window.location.reload()}>Recarregar</Button>
        </VStack>
      </Center>
    );
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setActionError('Informe um nome para a categoria.');
      return;
    }

    let maxAmount: number | null | undefined;
    const maxRaw = newCategoryMax.trim();
    if (maxRaw !== '') {
      const n = Number(maxRaw);
      if (!Number.isFinite(n) || n <= 0) {
        setActionError('Limite inválido (número positivo ou deixe vazio para sem limite).');
        return;
      }
      maxAmount = n;
    }

    setActionError('');
    try {
      await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
        active: true,
        ...(maxAmount !== undefined ? { maxAmount } : {}),
      });
      setNewCategoryName('');
      setNewCategoryMax('');
    } catch (err) {
      const ax = err as AxiosError<ApiErrorBody>;
      setActionError(
        ax.response?.data?.message ||
          'Não foi possível salvar a categoria. Verifique sua conexão, permissões de ADMIN ou se o nome já existe.',
      );
    }
  };

  const handleToggleCategory = async (id: string, active: boolean) => {
    setActionError('');
    try {
      await updateCategoryMutation.mutateAsync({ id, payload: { active: !active } });
    } catch (err) {
      const ax = err as AxiosError<ApiErrorBody>;
      setActionError(ax.response?.data?.message || 'Não foi possível atualizar a categoria.');
    }
  };

  const saveCategoryLimit = async (id: string) => {
    const raw = (limitDraft[id] ?? '').trim();
    if (raw !== '') {
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) {
        setActionError('Limite inválido (número positivo ou vazio para sem limite).');
        return;
      }
    }

    setActionError('');
    try {
      const maxAmount = raw === '' ? null : Number(raw);
      await updateCategoryMutation.mutateAsync({ id, payload: { maxAmount } });
      setLimitDraftOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      const ax = err as AxiosError<ApiErrorBody>;
      setActionError(ax.response?.data?.message || 'Não foi possível salvar o limite.');
    }
  };

  return (
    <>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="lg" letterSpacing="tight">
            Gestão de Categorias
          </Heading>
          <Text color="fg.muted">Gerencie as categorias de despesas permitidas e o valor máximo por solicitação.</Text>
        </Box>
      </Flex>

      <HStack mb={2} flexWrap="wrap" gap={3} align="flex-end">
        <Box minW="200px" flex="1">
          <Text fontSize="sm" mb={1} fontWeight="medium">
            Nome
          </Text>
          <Input
            placeholder="Nome da nova categoria"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            bg="white"
          />
        </Box>
        <Box w={{ base: 'full', md: '140px' }}>
          <Text fontSize="sm" mb={1} fontWeight="medium">
            Limite (R$)
          </Text>
          <Input
            placeholder="Sem limite"
            type="number"
            step="0.01"
            min={0}
            value={newCategoryMax}
            onChange={(event) => setNewCategoryMax(event.target.value)}
            bg="white"
          />
        </Box>
        <Button
          type="button"
          colorPalette="brand"
          gap={2}
          loading={createCategoryMutation.isPending}
          onClick={handleCreateCategory}
        >
          <Plus size={18} />
          Nova Categoria
        </Button>
      </HStack>
      <Text fontSize="xs" color="fg.muted" mb={4}>
        Deixe &quot;Limite&quot; vazio para não aplicar teto por categoria. O bloqueio de despesas futuras e a exigência de
        comprovante acima de um valor são validados no envio da solicitação.
      </Text>
      {actionError ? (
        <Text color="red.500" mb={4}>
          {actionError}
        </Text>
      ) : null}

      <Box bg="white" borderRadius="xl" boxShadow="sm" overflow="hidden" border="1px solid" borderColor="border.muted">
        <Table.Root variant="line">
          <Table.Header bg="bg.subtle">
            <Table.Row>
              <Table.ColumnHeader>Nome</Table.ColumnHeader>
              <Table.ColumnHeader>Limite (R$)</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Ações</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {categories?.map((cat) => (
              <Table.Row key={cat.id}>
                <Table.Cell fontWeight="medium">{cat.name}</Table.Cell>
                <Table.Cell>
                  <HStack gap={2}>
                    <Input
                      w="120px"
                      type="number"
                      step="0.01"
                      min={0}
                      size="sm"
                      bg="white"
                      placeholder="—"
                      value={limitDraft[cat.id] ?? ''}
                      onChange={(e) =>
                        setLimitDraftOverrides((prev) => ({
                          ...prev,
                          [cat.id]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      loading={updateCategoryMutation.isPending}
                      onClick={() => saveCategoryLimit(cat.id)}
                    >
                      Salvar limite
                    </Button>
                  </HStack>
                </Table.Cell>
                <Table.Cell color={cat.active ? 'green.600' : 'gray.500'}>
                  {cat.active ? 'Ativa' : 'Inativa'}
                </Table.Cell>
                <Table.Cell textAlign="right">
                  <Switch.Root
                    checked={cat.active}
                    onCheckedChange={() => handleToggleCategory(cat.id, cat.active)}
                    disabled={updateCategoryMutation.isPending}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label>{cat.active ? 'Desativar' : 'Ativar'}</Switch.Label>
                  </Switch.Root>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </>
  );
};

export default CategoriesManagement;
