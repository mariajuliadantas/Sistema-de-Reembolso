import { Box, Button, Field, Input, Textarea, VStack, HStack, Text } from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { formatCurrency } from '../../lib/reimbursement';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCategories } from '../../hooks/useCategories';
import {
  useCreateReimbursement,
  useUpdateReimbursement,
  useAddReimbursementAttachment,
} from '../../hooks/useReimbursements';
import { useReimbursementRulesConfig } from '../../hooks/useReimbursementRulesConfig';
import { useNavigate } from 'react-router-dom';
import type { Reimbursement } from '../../types/reimbursement';
import { toaster } from '../../lib/toaster';
import { getApiErrorMessage } from '../../lib/apiError';
import { ActionFeedbackModal } from './ActionFeedbackModal';

export type CreatedDraftSummary = {
  id: string;
  categoryId: string;
  value: number;
  description: string;
  expenseDate: string;
};

const MAX_STAGED_FILES = 8;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png']);

const schema = z.object({
  description: z.string().min(5, 'A descrição deve ter pelo menos 5 caracteres'),
  value: z.number().positive('O valor deve ser positivo'),
  expenseDate: z.string().refine((value) => new Date(value) <= new Date(), {
    message: 'A data não pode ser futura',
  }),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
});

type ReimbursementFormData = z.infer<typeof schema>;

interface ReimbursementFormProps {
  reimbursement?: Reimbursement;
  /** Se definido, após criar o rascunho não redireciona — chama o callback (fluxo legado). Ignorado se `stageAttachmentsWithCreate` for true. */
  onCreated?: (summary: CreatedDraftSummary) => void;
  /** Nova solicitação: permite escolher arquivos no formulário e envia cada um logo após criar o rascunho. */
  stageAttachmentsWithCreate?: boolean;
}

const ReimbursementForm = ({
  reimbursement,
  onCreated,
  stageAttachmentsWithCreate = false,
}: ReimbursementFormProps) => {
  const { data: categories, isLoading: isLoadingCats } = useCategories();
  const { data: rulesConfig } = useReimbursementRulesConfig();
  const createMutation = useCreateReimbursement();
  const updateMutation = useUpdateReimbursement();
  const addAttachmentMutation = useAddReimbursementAttachment();
  const navigate = useNavigate();
  const stagedInputRef = useRef<HTMLInputElement | null>(null);

  const isEditMode = Boolean(reimbursement);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isUploadingStaged, setIsUploadingStaged] = useState(false);
  const [saveErrorModal, setSaveErrorModal] = useState<{
    title: string;
    message: string;
    detailId?: string;
  } | null>(null);

  const isPending =
    createMutation.isPending || updateMutation.isPending || addAttachmentMutation.isPending || isUploadingStaged;

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<ReimbursementFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: reimbursement?.description ?? '',
      value: reimbursement?.value ?? 0,
      expenseDate: reimbursement?.expenseDate
        ? new Date(reimbursement.expenseDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      categoryId: reimbursement?.categoryId ?? '',
    },
  });

  /* eslint-disable react-hooks/incompatible-library -- watch necessário para limite por categoria */
  const watchedCategoryId = watch('categoryId');
  const watchedValue = watch('value');
  /* eslint-enable react-hooks/incompatible-library */
  const selectedCategory = categories?.find((c) => c.id === watchedCategoryId);

  const attachmentThreshold = rulesConfig?.requireAttachmentAboveValue ?? null;
  const ruleActive = attachmentThreshold != null && attachmentThreshold > 0;
  const showThresholdHint =
    stageAttachmentsWithCreate &&
    !isEditMode &&
    ruleActive &&
    typeof watchedValue === 'number' &&
    watchedValue > attachmentThreshold;

  const pushStagedFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const incoming = Array.from(list);
    const accepted: File[] = [];
    for (const file of incoming) {
      if (stagedFiles.length + accepted.length >= MAX_STAGED_FILES) {
        toaster.error({
          title: 'Limite de arquivos',
          description: `Você pode adicionar no máximo ${MAX_STAGED_FILES} arquivos por vez.`,
        });
        break;
      }
      if (file.size > MAX_FILE_BYTES) {
        toaster.error({
          title: 'Arquivo muito grande',
          description: `${file.name} ultrapassa 5MB.`,
        });
        continue;
      }
      if (!ALLOWED_MIME.has(file.type)) {
        toaster.error({
          title: 'Tipo não permitido',
          description: `${file.name}: use PDF, JPG ou PNG.`,
        });
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length) {
      setStagedFiles((prev) => [...prev, ...accepted]);
    }
    if (stagedInputRef.current) {
      stagedInputRef.current.value = '';
    }
  };

  const removeStagedAt = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit: SubmitHandler<ReimbursementFormData> = async (data) => {
    const cat = categories?.find((c) => c.id === data.categoryId);
    if (cat?.maxAmount != null && data.value > cat.maxAmount) {
      setError('value', {
        type: 'manual',
        message: `O valor não pode ultrapassar o limite da categoria (${formatCurrency(cat.maxAmount)}).`,
      });
      return;
    }

    const payload = {
      ...data,
      expenseDate: new Date(`${data.expenseDate}T00:00:00.000Z`).toISOString(),
    };

    try {
      if (isEditMode && reimbursement) {
        await updateMutation.mutateAsync({ id: reimbursement.id, payload });
        toaster.success({
          title: 'Alterações salvas',
          description: 'A solicitação em rascunho foi atualizada.',
        });
        navigate('/');
        return;
      }

      const created = await createMutation.mutateAsync(payload);
      const raw = created as Record<string, unknown>;
      const id = typeof raw?.id === 'string' && raw.id.length > 0 ? raw.id : undefined;

      if (!id) {
        setSaveErrorModal({
          title: 'Resposta inesperada',
          message:
            'O servidor não retornou o identificador do rascunho. Atualize a página ou tente novamente. Se persistir, verifique a API.',
        });
        return;
      }

      if (stageAttachmentsWithCreate && stagedFiles.length > 0) {
        const attachmentCount = stagedFiles.length;
        setIsUploadingStaged(true);
        try {
          for (const file of stagedFiles) {
            await addAttachmentMutation.mutateAsync({ id, file });
          }
          setStagedFiles([]);
          toaster.success({
            title: 'Solicitação criada',
            description: `Rascunho salvo com ${attachmentCount} anexo(s). Você pode enviá-lo pelo painel quando quiser.`,
          });
          navigate('/');
        } catch (uploadErr) {
          setSaveErrorModal({
            title: 'Rascunho salvo, falha no anexo',
            message: `${getApiErrorMessage(uploadErr, 'Não foi possível enviar um ou mais arquivos.')}. Você pode abrir a solicitação e tentar anexar de novo.`,
            detailId: id,
          });
        } finally {
          setIsUploadingStaged(false);
        }
        return;
      }

      if (onCreated && !stageAttachmentsWithCreate) {
        onCreated({
          id,
          categoryId: data.categoryId,
          value: data.value,
          description: data.description,
          expenseDate: data.expenseDate,
        });
        return;
      }

      toaster.success({
        title: 'Solicitação criada',
        description: 'O rascunho foi salvo. Você pode enviá-lo quando estiver pronto.',
      });
      navigate('/');
    } catch (err) {
      setSaveErrorModal({
        title: 'Não foi possível salvar',
        message: getApiErrorMessage(err, 'Verifique os dados e tente novamente.'),
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} w="full">
      <VStack gap={6} align="stretch">
        <HStack gap={4}>
          <Field.Root invalid={!!errors.categoryId} w={{ base: 'full', md: '300px' }}>
            <Field.Label>Categoria</Field.Label>
            <select
              {...register('categoryId')}
              disabled={isLoadingCats}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="">
                {isLoadingCats ? 'Carregando categorias...' : 'Selecione uma categoria'}
              </option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <Field.ErrorText>{errors.categoryId?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.expenseDate} flex="1">
            <Field.Label>Data da Despesa</Field.Label>
            <Input type="date" {...register('expenseDate')} bg="white" />
            <Field.ErrorText>{errors.expenseDate?.message}</Field.ErrorText>
          </Field.Root>
        </HStack>

        <HStack gap={4}>
          <Field.Root invalid={!!errors.value} flex="1">
            <Field.Label>Valor (R$)</Field.Label>
            <Input
              type="number"
              step="0.01"
              {...register('value', { valueAsNumber: true })}
              placeholder="0.00"
              bg="white"
            />
            <Field.ErrorText>{errors.value?.message}</Field.ErrorText>
            {selectedCategory?.maxAmount != null &&
            typeof watchedValue === 'number' &&
            watchedValue > 0 ? (
              <Box as="p" fontSize="xs" color="fg.muted" mt={1}>
                Limite desta categoria: {formatCurrency(selectedCategory.maxAmount)}
              </Box>
            ) : null}
          </Field.Root>
        </HStack>

        <Field.Root invalid={!!errors.description}>
          <Field.Label>Descrição Detalhada</Field.Label>
          <Textarea
            {...register('description')}
            placeholder="Descreva o motivo da despesa..."
            rows={4}
            bg="white"
          />
          <Field.ErrorText>{errors.description?.message}</Field.ErrorText>
        </Field.Root>

        {stageAttachmentsWithCreate && !isEditMode ? (
          <Field.Root>
            <Field.Label>Comprovantes (opcional)</Field.Label>
            <Text fontSize="sm" color="fg.muted" mb={2}>
              Selecione um ou mais arquivos antes de criar a solicitação. Eles serão enviados automaticamente após o
              rascunho ser salvo (PDF, JPG ou PNG, máx. 5MB cada, até {MAX_STAGED_FILES} arquivos).
            </Text>
            {showThresholdHint ? (
              <Box
                mb={3}
                borderRadius="md"
                bg="orange.50"
                borderWidth="1px"
                borderColor="orange.200"
                px={3}
                py={2}
              >
                <Text fontSize="sm" color="fg.muted">
                  Valor acima de {formatCurrency(attachmentThreshold!)}: ao enviar para aprovação o sistema exigirá
                  pelo menos um comprovante por upload — você já pode anexar aqui.
                </Text>
              </Box>
            ) : null}
            <Input
              ref={stagedInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              bg="white"
              borderRadius="md"
              onChange={(e) => pushStagedFiles(e.target.files)}
            />
            {stagedFiles.length > 0 ? (
              <VStack align="stretch" gap={2} mt={3}>
                {stagedFiles.map((file, index) => (
                  <HStack key={`${file.name}-${file.size}-${index}`} justify="space-between" bg="white" px={3} py={2} borderRadius="md" borderWidth="1px" borderColor="border.muted">
                    <Text fontSize="sm" lineClamp={1}>
                      {file.name}{' '}
                      <Box as="span" fontSize="xs" color="fg.muted">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </Box>
                    </Text>
                    <Button type="button" size="xs" variant="ghost" onClick={() => removeStagedAt(index)}>
                      Remover
                    </Button>
                  </HStack>
                ))}
              </VStack>
            ) : null}
          </Field.Root>
        ) : null}

        <HStack justify="flex-end" pt={4} gap={4}>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Cancelar
          </Button>
          <Button type="submit" colorPalette="brand" loading={isPending} px={8}>
            {isEditMode ? 'Salvar Alterações' : 'Criar Solicitação'}
          </Button>
        </HStack>
      </VStack>

      <ActionFeedbackModal
        open={!!saveErrorModal}
        title={saveErrorModal?.title ?? ''}
        description={saveErrorModal?.message ?? ''}
        tone="danger"
        primary={{
          label: 'Entendi',
          onClick: () => setSaveErrorModal(null),
        }}
        secondary={
          saveErrorModal?.detailId
            ? {
                label: 'Abrir solicitação',
                onClick: () => {
                  const target = saveErrorModal.detailId;
                  setSaveErrorModal(null);
                  if (target) navigate(`/reimbursements/${target}`);
                },
              }
            : undefined
        }
      />
    </Box>
  );
};

export default ReimbursementForm;
