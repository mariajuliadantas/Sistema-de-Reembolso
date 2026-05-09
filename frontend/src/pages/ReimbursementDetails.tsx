import { Box, Heading, Text, Button, Flex, Grid, GridItem, VStack, HStack, Icon, Separator, Skeleton, Center, Input, Textarea } from '@chakra-ui/react';
import { useCallback, useRef, useState } from 'react';
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
import { useReimbursementRulesConfig } from '../hooks/useReimbursementRulesConfig';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/shared/StatusBadge';
import { ArrowLeft, Calendar, Tag, DollarSign, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../lib/reimbursement';
import { formatHistoryObservation, historyActionLabel } from '../lib/reimbursementHistory';
import { toaster } from '../lib/toaster';
import { getApiErrorMessage } from '../lib/apiError';
import { isAttachmentPolicyMessage } from '../lib/reimbursementSubmitGuards';
import { ActionFeedbackModal } from '../components/shared/ActionFeedbackModal';

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
  const { data: reimbursementRules } = useReimbursementRulesConfig();
  const addAttachmentMutation = useAddReimbursementAttachment();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentsBlockRef = useRef<HTMLDivElement | null>(null);
  const [attachmentError, setAttachmentError] = useState('');
  const [workflowError, setWorkflowError] = useState<{
    open: boolean;
    title: string;
    message: string;
    tone: 'danger' | 'warning';
    attachmentFlow?: boolean;
  }>({ open: false, title: '', message: '', tone: 'danger' });

  const closeWorkflowError = () => setWorkflowError((s) => ({ ...s, open: false }));

  const focusAttachmentsSection = () => {
    closeWorkflowError();
    window.requestAnimationFrame(() => {
      attachmentsBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => fileInputRef.current?.focus(), 350);
    });
  };
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

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
  const canManageAttachments =
    user?.role === 'COLLABORATOR' &&
    reimbursement?.requesterId === user.id &&
    reimbursement?.status === 'DRAFT';

  const attachmentRuleThreshold = reimbursementRules?.requireAttachmentAboveValue ?? null;
  const attachmentRuleActive =
    attachmentRuleThreshold != null && Number.isFinite(attachmentRuleThreshold) && attachmentRuleThreshold > 0;
  const hasUploadedReceipt = attachments.some(
    (a) => typeof a.fileUrl === 'string' && a.fileUrl.includes('/uploads/'),
  );
  const showAttachmentRequirementHint =
    attachmentRuleActive &&
    reimbursement &&
    reimbursement.value > attachmentRuleThreshold &&
    !hasUploadedReceipt &&
    reimbursement.status === 'DRAFT';

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
      toaster.success({
        title: 'Anexo enviado',
        description: 'O comprovante foi anexado à solicitação.',
      });
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Não foi possível adicionar o anexo.');
      setAttachmentError(msg);
      toaster.error({ title: 'Falha no anexo', description: msg });
    }
  };

  const openRejectModal = () => {
    setRejectReason('');
    setRejectError('');
    setIsRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
    setRejectReason('');
    setRejectError('');
  };

  const handleConfirmReject = async () => {
    const reason = rejectReason.trim();
    if (reason.length < 5) {
      setRejectError('Informe um motivo com pelo menos 5 caracteres.');
      return;
    }

    try {
      await rejectMutation.mutateAsync({ id: id!, reason });
      closeRejectModal();
      toaster.success({
        title: 'Solicitação rejeitada',
        description: 'A solicitação foi marcada como rejeitada e o solicitante será notificado pelo histórico.',
      });
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Não foi possível rejeitar a solicitação. Tente novamente.');
      setRejectError(msg);
      toaster.error({ title: 'Falha ao rejeitar', description: msg });
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!reimbursement) return;
    try {
      await submitMutation.mutateAsync(reimbursement.id);
      toaster.success({
        title: 'Enviado para análise',
        description: 'A solicitação foi enviada ao gestor.',
      });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Verifique anexos obrigatórios e dados da solicitação.');
      const attachmentFlow = isAttachmentPolicyMessage(message);
      setWorkflowError({
        open: true,
        title: attachmentFlow ? 'Comprovante obrigatório' : 'Não foi possível enviar',
        message,
        tone: attachmentFlow ? 'warning' : 'danger',
        attachmentFlow,
      });
    }
  }, [reimbursement, submitMutation]);

  const handleApprove = useCallback(async () => {
    if (!reimbursement) return;
    try {
      await approveMutation.mutateAsync(reimbursement.id);
      toaster.success({ title: 'Aprovado', description: 'A solicitação foi aprovada.' });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Tente novamente.');
      setWorkflowError({
        open: true,
        title: 'Não foi possível aprovar',
        message,
        tone: 'danger',
        attachmentFlow: false,
      });
    }
  }, [reimbursement, approveMutation]);

  const handlePay = useCallback(async () => {
    if (!reimbursement) return;
    try {
      await payMutation.mutateAsync(reimbursement.id);
      toaster.success({ title: 'Pagamento registrado', description: 'A solicitação foi marcada como paga.' });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Tente novamente.');
      setWorkflowError({
        open: true,
        title: 'Não foi possível marcar como pago',
        message,
        tone: 'danger',
        attachmentFlow: false,
      });
    }
  }, [reimbursement, payMutation]);

  const handleCancel = useCallback(async () => {
    if (!reimbursement) return;
    try {
      await cancelMutation.mutateAsync(reimbursement.id);
      toaster.success({ title: 'Cancelado', description: 'A solicitação em rascunho foi cancelada.' });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Tente novamente.');
      setWorkflowError({
        open: true,
        title: 'Não foi possível cancelar',
        message,
        tone: 'danger',
        attachmentFlow: false,
      });
    }
  }, [reimbursement, cancelMutation]);

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

            <Box
              ref={attachmentsBlockRef}
              bg="white"
              p={6}
              borderRadius="xl"
              boxShadow="sm"
              border="1px solid"
              borderColor="border.muted"
              scrollMarginTop="88px"
            >
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
                      <HStack>
                        <Button asChild size="sm" variant="outline">
                          <a href={attachment.fileUrl} target="_blank" rel="noreferrer">Preview</a>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <a href={attachment.fileUrl} download={attachment.fileName}>Download</a>
                        </Button>
                      </HStack>
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
                {showAttachmentRequirementHint ? (
                  <Box bg="orange.50" borderWidth="1px" borderColor="orange.200" borderRadius="md" p={3}>
                    <Text fontSize="sm" color="fg.muted">
                      Valor acima de {formatCurrency(attachmentRuleThreshold)}: é obrigatório enviar pelo menos um
                      comprovante (arquivo PDF, JPG ou PNG) antes de enviar para aprovação.
                    </Text>
                  </Box>
                ) : null}
                {canSubmit ? (
                  <Button loading={submitMutation.isPending} onClick={handleSubmit}>
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
                      onClick={handleApprove}
                    >
                      <CheckCircle size={16} />
                      Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      colorPalette="red"
                      flex="1"
                      loading={rejectMutation.isPending}
                      onClick={openRejectModal}
                    >
                      Rejeitar
                    </Button>
                  </HStack>
                ) : null}
                {canPay ? (
                  <Button colorPalette="blue" loading={payMutation.isPending} onClick={handlePay}>
                    Marcar como Pago
                  </Button>
                ) : null}
                {canCancel ? (
                  <Button variant="outline" colorPalette="red" loading={cancelMutation.isPending} onClick={handleCancel}>
                    Cancelar Solicitação
                  </Button>
                ) : null}
              </VStack>
            </Box>
          </VStack>
        </GridItem>

        <GridItem>
          <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="border.muted">
            <Heading size="sm" mb={6}>Linha do tempo</Heading>

            <VStack align="stretch" gap={6} position="relative">
              <Box position="absolute" left="11px" top="0" bottom="0" w="2px" bg="bg.muted" zIndex={0} />
              {(reimbursement.history ?? []).map((entry) => (
                <HStack key={entry.id} align="flex-start" gap={4} zIndex={1}>
                  <Box bg="brand.500" p={1.5} borderRadius="full">
                    <CheckCircle size={12} color="white" />
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">{historyActionLabel(entry.action)}</Text>
                    <Text fontSize="xs" color="fg.muted">
                      {format(new Date(entry.createdAt), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      {' · '}
                      por {entry.user?.name ?? '—'}
                    </Text>
                    <Text fontSize="xs" mt={1}>{formatHistoryObservation(entry.observation)}</Text>
                  </Box>
                </HStack>
              ))}
            </VStack>
          </Box>
        </GridItem>
      </Grid>

      {isRejectModalOpen ? (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1400}
          p={4}
        >
          <Box
            w="full"
            maxW="560px"
            bg="white"
            borderRadius="xl"
            boxShadow="xl"
            border="1px solid"
            borderColor="border.muted"
            p={6}
          >
            <Heading size="sm" mb={3}>Rejeitar Solicitação</Heading>
            <Text fontSize="sm" color="fg.muted" mb={4}>
              Informe o motivo da rejeição (mínimo 5 caracteres). Esse texto será salvo no histórico.
            </Text>
            <Textarea
              value={rejectReason}
              onChange={(event) => {
                setRejectReason(event.target.value);
                if (rejectError) setRejectError('');
              }}
              placeholder="Ex.: Nota ilegível ou documento incompleto"
              rows={4}
              bg="white"
            />
            {rejectError ? (
              <Text color="red.500" fontSize="sm" mt={2}>{rejectError}</Text>
            ) : null}
            <HStack justify="flex-end" mt={5}>
              <Button variant="ghost" onClick={closeRejectModal} disabled={rejectMutation.isPending}>
                Cancelar
              </Button>
              <Button
                colorPalette="red"
                onClick={handleConfirmReject}
                loading={rejectMutation.isPending}
              >
                Confirmar rejeição
              </Button>
            </HStack>
          </Box>
        </Box>
      ) : null}

      <ActionFeedbackModal
        open={workflowError.open}
        title={workflowError.title}
        description={workflowError.message}
        tone={workflowError.tone}
        primary={
          workflowError.attachmentFlow
            ? { label: 'Anexar comprovante', onClick: focusAttachmentsSection }
            : { label: 'Entendi', onClick: closeWorkflowError }
        }
        secondary={
          workflowError.attachmentFlow
            ? { label: 'Fechar', onClick: closeWorkflowError }
            : undefined
        }
      />
    </Box>
  );
};

export default ReimbursementDetails;
