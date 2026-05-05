import { useState } from 'react';
import type { AxiosError } from 'axios';
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
} from '@chakra-ui/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import type { ManagedUser, UserRole } from '../types/user';
import { useAuth } from '../hooks/useAuth';

interface ApiErrorBody {
  message?: string;
}

const roleLabels: Record<UserRole, string> = {
  COLLABORATOR: 'Colaborador',
  MANAGER: 'Gestor',
  FINANCIAL: 'Financeiro',
  ADMIN: 'Administrador',
};

const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, isError } = useUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const [actionError, setActionError] = useState('');

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('COLLABORATOR');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('COLLABORATOR');

  const getErrorMessage = (err: unknown, fallback: string) => {
    const ax = err as AxiosError<ApiErrorBody>;
    return ax.response?.data?.message || fallback;
  };

  const startEdit = (u: ManagedUser) => {
    setEditingId(u.id);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword('');
    setEditRole(u.role);
    setActionError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPassword('');
    setActionError('');
  };

  const handleCreate = async () => {
    setActionError('');
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setActionError('Preencha nome, e-mail e senha.');
      return;
    }
    try {
      await createUserMutation.mutateAsync({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('COLLABORATOR');
    } catch (err) {
      setActionError(getErrorMessage(err, 'Não foi possível criar o usuário.'));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setActionError('');
    try {
      await updateUserMutation.mutateAsync({
        id: editingId,
        payload: {
          name: editName.trim(),
          email: editEmail.trim(),
          ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
          role: editRole,
        },
      });
      cancelEdit();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Não foi possível atualizar o usuário.'));
    }
  };

  const handleDelete = async (u: ManagedUser) => {
    if (u.id === currentUser?.id) {
      setActionError('Você não pode excluir o próprio usuário logado.');
      return;
    }
    if (!window.confirm(`Excluir o usuário ${u.name}?`)) {
      return;
    }
    setActionError('');
    try {
      await deleteUserMutation.mutateAsync(u.id);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Não foi possível excluir o usuário.'));
    }
  };

  if (isLoading) {
    return (
      <>
        <Skeleton h="40px" w="300px" mb={8} />
        <Stack gap={4}>
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
          <Text color="red.500">Erro ao carregar usuários.</Text>
          <Button onClick={() => window.location.reload()}>Recarregar</Button>
        </VStack>
      </Center>
    );
  }

  return (
    <>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="lg" letterSpacing="tight">
            Gestão de Usuários
          </Heading>
          <Text color="fg.muted">CRUD mínimo para administradores (conforme documento).</Text>
        </Box>
      </Flex>

      <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="border.muted" mb={8}>
        <Heading size="sm" mb={4}>
          Novo usuário
        </Heading>
        <Stack gap={3}>
          <HStack flexWrap="wrap">
            <Input placeholder="Nome" value={newName} onChange={(e) => setNewName(e.target.value)} bg="white" />
            <Input
              type="email"
              placeholder="E-mail"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              bg="white"
            />
            <Input
              type="password"
              placeholder="Senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              bg="white"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
            >
              {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </HStack>
          <Button
            colorPalette="brand"
            gap={2}
            w="fit-content"
            loading={createUserMutation.isPending}
            onClick={handleCreate}
          >
            <Plus size={18} />
            Criar usuário
          </Button>
        </Stack>
      </Box>

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
              <Table.ColumnHeader>E-mail</Table.ColumnHeader>
              <Table.ColumnHeader>Perfil</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Ações</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users?.map((u) => (
              <Table.Row key={u.id}>
                {editingId === u.id ? (
                  <>
                    <Table.Cell>
                      <Input size="sm" value={editName} onChange={(e) => setEditName(e.target.value)} bg="white" />
                    </Table.Cell>
                    <Table.Cell>
                      <Input size="sm" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} bg="white" />
                    </Table.Cell>
                    <Table.Cell>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '100%' }}
                      >
                        {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                          <option key={role} value={role}>
                            {roleLabels[role]}
                          </option>
                        ))}
                      </select>
                      <Input
                        size="sm"
                        mt={2}
                        type="password"
                        placeholder="Nova senha (opcional)"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        bg="white"
                      />
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <HStack justify="flex-end">
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          Cancelar
                        </Button>
                        <Button size="sm" loading={updateUserMutation.isPending} onClick={handleSaveEdit}>
                          Salvar
                        </Button>
                      </HStack>
                    </Table.Cell>
                  </>
                ) : (
                  <>
                    <Table.Cell fontWeight="medium">{u.name}</Table.Cell>
                    <Table.Cell>{u.email}</Table.Cell>
                    <Table.Cell>{roleLabels[u.role]}</Table.Cell>
                    <Table.Cell textAlign="right">
                      <HStack justify="flex-end">
                        <Button size="sm" variant="outline" gap={1} onClick={() => startEdit(u)}>
                          <Pencil size={14} />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          colorPalette="red"
                          gap={1}
                          loading={deleteUserMutation.isPending}
                          onClick={() => handleDelete(u)}
                        >
                          <Trash2 size={14} />
                          Excluir
                        </Button>
                      </HStack>
                    </Table.Cell>
                  </>
                )}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </>
  );
};

export default UsersManagement;
