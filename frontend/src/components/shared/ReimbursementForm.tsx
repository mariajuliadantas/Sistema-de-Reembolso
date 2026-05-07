import { Box, Button, Field, Input, Textarea, VStack, HStack } from '@chakra-ui/react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { formatCurrency } from '../../lib/reimbursement';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCategories } from '../../hooks/useCategories';
import {
  useCreateReimbursement,
  useUpdateReimbursement,
} from '../../hooks/useReimbursements';
import { useNavigate } from 'react-router-dom';
import type { Reimbursement } from '../../types/reimbursement';

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
}

const ReimbursementForm = ({ reimbursement }: ReimbursementFormProps) => {
  const { data: categories, isLoading: isLoadingCats } = useCategories();
  const createMutation = useCreateReimbursement();
  const updateMutation = useUpdateReimbursement();
  const navigate = useNavigate();

  const isEditMode = Boolean(reimbursement);
  const isPending = createMutation.isPending || updateMutation.isPending;

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
      } else {
        await createMutation.mutateAsync(payload);
      }

      navigate('/');
    } catch (error) {
      console.error('Erro ao salvar reembolso:', error);
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

        <HStack justify="flex-end" pt={4} gap={4}>
          <Button variant="ghost" onClick={() => navigate('/')}>Cancelar</Button>
          <Button type="submit" colorPalette="brand" loading={isPending} px={8}>
            {isEditMode ? 'Salvar Alterações' : 'Criar Solicitação'}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default ReimbursementForm;
