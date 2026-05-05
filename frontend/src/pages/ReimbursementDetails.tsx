import { Box, Heading, Text, Button, Flex, Grid, GridItem, VStack, HStack, Icon, Separator, Skeleton, Center, Input } from '@chakra-ui/react';
import { useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useReimbursement,
  useSubmitReimbursement,
  useApproveReimbursement,
  useRejectReimbursement,
  usePayReimbursement,
  useCancelReimbursement,
  useReimbursementAttachments,
  useAddReimbursementAttachment,
} from '../hooks/useReimbursements';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/shared/StatusBadge';
import { ArrowLeft, Calendar, Tag, DollarSign, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../lib/reimbursement';

interface ApiErrorBody {
  message?: string;
}

const ReimbursementDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: reimbursement, isLoading, isError } = useReimbursement(id!);
  const submitMutation = useSubmitReimbursement();
  const approveMutation = useApproveReimbursement();
  const rejectMutation = useRejectReimbursement();
  const payMutation = usePayReimbursement();
  const cancelMutation = useCancelReimbursement();
  const { data: attachments = [] } = useReimbursementAttachments(id!);
  const addAttachmentMutation = useAddReimbursementAttachment();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachmentError, setAttachmentError] = useState('');

  const canEdit =
    user?.role === 'COLLABORATOR' &&
    reimbursement?.requesterId === user.id &&
    reimbursement?.status === 'DRAFT';
  const canSubmit = canEdit;
  const canCancel =
    user?.role === 'COLLABORATOR' &&
    reimbursement?.requesterId === user.id &&
    reimbursement?.status === 'DRAFT';
  const canApprove = user?.role === 'MANAGER' && reimbursement?.status === 'SUBMITTED';
  const canPay = user?.role === 'FINANCIAL' && reimbursement?.status === 'APPROVED';
  const canManageAttachments = user?.role === 'COLLABORATOR' && reimbursement?.requesterId === user.id;

  const handleAddAttachment = async () => {
    setAttachmentError('');
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setAttachmentError('Selecione um arquivo (PDF, JPG ou PNG).');
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setAttachmentError('Arquivo muito grande (máximo 5MB).');
      return;
    }

    try {
      await addAttachmentMutation.mutateAsync({
        id: id!,
        file,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const ax = err as AxiosError<ApiErrorBody>;
      setAttachmentError(ax.response?.data?.message || 'Não foi possível adicionar o anexo.');
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Informe o motivo da rejeição (mínimo 5 caracteres):');
    if (!reason || reason.trim().length < 5) {
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id: id!, reason: reason.trim() });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  if (isLoading) {
    return (
      <Box w="full">
        <Skeleton h="40px" w="300px" mb={8} />
        <Grid templateColumns={{ base: '1fr', md: '2fr 1fr' }} gap={8}>
          <GridItem><Skeleton h="400px" /></GridItem>
          <GridItem><Skeleton h="400px" /></GridItem>
        </Grid>
      </Box>
    );
  }

  if (isError || !reimbursement) {
    return (
      <Center h="50vh">
        <VStack>
          <Text color="red.500">Reembolso não encontrado.</Text>
          <Button onClick={() => navigate('/')}>Voltar para o Dashboard</Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box w="full">
      <Flex align="center" gap={4} mb={8}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
        </Button>
        <Box>
          <Heading size="lg" letterSpacing="tight">Detalhes do Reembolso</Heading>
          <Text color="fg.muted">Protocolo: #{reimbursement.id.substring(0, 8)}</Text>
        </Box>
      </Flex>

      <Grid templateColumns={{ base: '1fr', md: '2fr 1fr' }} gap={8}>
        <GridItem>
          <VStack align="stretch" gap={6}>
            <Box bg="white" p={8} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="border.muted">
              <HStack justify="space-between" mb={6}>
                <Heading size="md">Solicitação de Reembolso</Heading>
                <StatusBadge status={reimbursement.status} size="lg" />
              </HStack>

              <Grid templateColumns="1fr 1fr" gap={6} mb={8}>
                <HStack gap={3}>
                  <Icon as={DollarSign} color="brand.500" />
                  <Box>
                    <Text fontSize="xs" color="fg.muted">Valor</Text>
                    <Text fontWeight="bold" fontSize="lg">{formatCurrency(reimbursement.value)}</Text>
                  </Box>
                </HStack>
                <HStack gap={3}>
                  <Icon as={Calendar} color="brand.500" />
                  <Box>
                    <Text fontSize="xs" color="fg.muted">Data da Despesa</Text>
                    <Text fontWeight="medium">{format(new Date(reimbursement.expenseDate), 'dd/MM/yyyy', { locale: ptBR })}</Text>
                  </Box>
                </HStack>
                <HStack gap={3}>
                  <Icon as={Tag} color="brand.500" />
                  <Box>
                    <Text fontSize="xs" color="fg.muted">Categoria</Text>
                    <Text fontWeight="medium">{reimbursement.category.name}</Text>
                  </Box>
                </HStack>
                <HStack gap={3}>
                  <Icon as={FileText} color="brand.500" />
                  <Box>
                    <Text fontSize="xs" color="fg.muted">Solicitante</Text>
                    <Text fontWeight="medium">{reimbursement.requester?.name ?? 'Você'}</Text>
                  </Box>
                </HStack>
              </Grid>

              <Separator mb={6} />

              <Box>
                <Text fontWeight="bold" mb={2}>Descrição</Text>
                <Text color="fg.muted" lineHeight="tall">{reimbursement.description}</Text>
              </Box>
            </Box>

            <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="border.muted">
              <Heading size="sm" mb={4}>Anexos</Heading>
              <VStack align="stretch" gap={3} mb={canManageAttachments ? 6 : 0}>
                {attachments.length === 0 ? (
                  <Text color="fg.muted" fontSize="sm">Nenhum anexo cadastrado.</Text>
                ) : (
                  attachments.map((attachment) => (
                    <HStack key={attachment.id} justify="space-between">
                      <Box>
                        <Text fontWeight="medium">{attachment.fileName}</Text>
                        <Text fontSize="xs" color="fg.muted">{attachment.fileType.toUpperCase()}</Text>
                      </Box>
                      <Button asChild size="sm" variant="outline">
                        <a href={attachment.fileUrl} target="_blank" rel="noreferrer">Abrir</a>
                      </Button>
                    </HStack>
                  ))
                )}
              </VStack>

              {canManageAttachments ? (
                <VStack align="stretch" gap={3}>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                    bg="white"
                  />
                  <Text fontSize="xs" color="fg.muted">
                    Envie um arquivo PDF, JPG ou PNG (máx. 5MB). O backend valida o tipo e armazena em `/uploads`.
                  </Text>
                  {attachmentError ? <Text color="red.500" fontSize="sm">{attachmentError}</Text> : null}
                  <Button loading={addAttachmentMutation.isPending} onClick={handleAddAttachment}>
                    Enviar anexo
                  </Button>
                </VStack>
              ) : null}
            </Box>

            <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="border.muted">
              <Heading size="sm" mb={4}>Ações Disponíveis</Heading>
              <VStack align="stretch">
                {canEdit ? (
                  <Button variant="outline" onClick={() => navigate(`/reimbursements/${reimbursement.id}/edit`)}>
                    Editar Rascunho
                  </Button>
                ) : null}
                {canSubmit ? (
                  <Button loading={submitMutation.isPending} onClick={() => submitMutation.mutate(reimbursement.id)}>
                    Enviar para Aprovação
                  </Button>
                ) : null}
                {canApprove ? (
                  <HStack>
                    <Button
                      colorPalette="green"
                      flex="1"
                      gap={2}
                      loading={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(reimbursement.id)}
                    >
                      <CheckCircle size={16} />
                      Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      colorPalette="red"
                      flex="1"
                      loading={rejectMutation.isPending}
                      onClick={handleReject}
                    >
                      Rejeitar
                    </Button>
                  </HStack>
                ) : null}
                {canPay ? (
                  <Button colorPalette="blue" loading={payMutation.isPending} onClick={() => payMutation.mutate(reimbursement.id)}>
                    Marcar como Pago
                  </Button>
                ) : null}
                {canCancel ? (
                  <Button variant="outline" colorPalette="red" loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate(reimbursement.id)}>
                    Cancelar Solicitação
                  </Button>
                ) : null}
              </VStack>
            </Box>
          </VStack>
        </GridItem>

        <GridItem>
          <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="border.muted">
            <Heading size="sm" mb={6}>Linha do Tempo</Heading>

            <VStack align="stretch" gap={6} position="relative">
              <Box position="absolute" left="11px" top="0" bottom="0" w="2px" bg="bg.muted" zIndex={0} />
              {(reimbursement.history ?? []).map((entry) => (
                <HStack key={entry.id} align="flex-start" gap={4} zIndex={1}>
                  <Box bg="brand.500" p={1.5} borderRadius="full">
                    <CheckCircle size={12} color="white" />
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">{entry.action}</Text>
                    <Text fontSize="xs" color="fg.muted">
                      {format(new Date(entry.createdAt), "dd MMM 'às' HH:mm", { locale: ptBR })}
                    </Text>
                    <Text fontSize="xs" mt={1}>{entry.observation}</Text>
                  </Box>
                </HStack>
              ))}
            </VStack>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default ReimbursementDetails;
