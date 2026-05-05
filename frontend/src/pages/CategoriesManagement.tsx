import { Box, Heading, Text, Button, Table, Skeleton, Stack, Flex, VStack, Center, Input, HStack, Switch } from '@chakra-ui/react';
import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory } from '../hooks/useCategories';
import { Plus } from 'lucide-react';

const CategoriesManagement = () => {
  const { data: categories, isLoading, isError } = useCategories({ includeInactive: true });
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [actionError, setActionError] = useState('');

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
      return;
    }

    setActionError('');
    try {
      await createCategoryMutation.mutateAsync({ name: newCategoryName.trim(), active: true });
      setNewCategoryName('');
    } catch {
      setActionError('Não foi possível salvar a categoria. Verifique se o nome já existe.');
    }
  };

  const handleToggleCategory = async (id: string, active: boolean) => {
    setActionError('');
    try {
      await updateCategoryMutation.mutateAsync({ id, payload: { active: !active } });
    } catch {
      setActionError('Não foi possível atualizar a categoria.');
    }
  };

  return (
    <>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="lg" letterSpacing="tight">Gestão de Categorias</Heading>
          <Text color="fg.muted">Gerencie as categorias de despesas permitidas.</Text>
        </Box>
      </Flex>

      <HStack mb={4}>
        <Input
          placeholder="Nome da nova categoria"
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
          bg="white"
        />
        <Button colorPalette="brand" gap={2} loading={createCategoryMutation.isPending} onClick={handleCreateCategory}>
          <Plus size={18} />
          Nova Categoria
        </Button>
      </HStack>
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
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Ações</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {categories?.map((cat) => (
              <Table.Row key={cat.id}>
                <Table.Cell fontWeight="medium">{cat.name}</Table.Cell>
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
