import { Box, Button, Heading, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { useReimbursementAttachments, useAddReimbursementAttachment } from '../../hooks/useReimbursements';
import { toaster } from '../../lib/toaster';
import { getApiErrorMessage } from '../../lib/apiError';

interface ReimbursementAttachmentsSectionProps {
  reimbursementId: string;
  canUpload: boolean;
  title?: string;
  placeholderMessage?: string;
}

const ReimbursementAttachmentsSection = ({
  reimbursementId,
  canUpload,
  title = 'Anexos',
  placeholderMessage,
}: ReimbursementAttachmentsSectionProps) => {
  const hasId = Boolean(reimbursementId?.trim());
  const { data: attachments = [], isLoading } = useReimbursementAttachments(reimbursementId);
  const addAttachmentMutation = useAddReimbursementAttachment();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localError, setLocalError] = useState('');

  const handleUpload = async () => {
    setLocalError('');
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setLocalError('Selecione um arquivo (PDF, JPG ou PNG).');
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setLocalError('Arquivo muito grande (máximo 5MB).');
      return;
    }
    try {
      await addAttachmentMutation.mutateAsync({ id: reimbursementId, file });
      if (fileInputRef.current) fileInputRef.current.value = '';
      toaster.success({
        title: 'Anexo enviado',
        description: 'O arquivo foi vinculado à solicitação.',
      });
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Não foi possível enviar o anexo.');
      setLocalError(msg);
      toaster.error({ title: 'Falha no envio', description: msg });
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="xl"
      p={{ base: 5, md: 6 }}
      bg="bg.subtle"
    >
      <Heading size="sm" mb={4}>
        {title}
      </Heading>
      <Text fontSize="sm" color="fg.muted" mb={4}>
        PDF, JPG ou PNG até 5MB. Você pode anexar comprovantes em qualquer rascunho.
      </Text>

      {!hasId && placeholderMessage ? (
        <Box
          borderRadius="md"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border.muted"
          bg="white"
          py={8}
          px={4}
          textAlign="center"
        >
          <Text fontSize="sm" color="fg.muted">
            {placeholderMessage}
          </Text>
        </Box>
      ) : null}

      <VStack align="stretch" gap={3} mb={canUpload && hasId ? 4 : 0}>
        {!hasId ? null : isLoading ? (
          <Text fontSize="sm" color="fg.muted">
            Carregando anexos…
          </Text>
        ) : attachments.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            Nenhum anexo ainda.
          </Text>
        ) : (
          attachments.map((attachment) => (
            <HStack key={attachment.id} justify="space-between" flexWrap="wrap" gap={2}>
              <Box minW={0}>
                <Text fontWeight="medium" fontSize="sm" lineClamp={1}>
                  {attachment.fileName}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {attachment.fileType.toUpperCase()}
                </Text>
              </Box>
              <HStack flexShrink={0}>
                <Button asChild size="sm" variant="outline">
                  <a href={attachment.fileUrl} target="_blank" rel="noreferrer">
                    Abrir
                  </a>
                </Button>
              </HStack>
            </HStack>
          ))
        )}
      </VStack>

      {canUpload && hasId ? (
        <VStack align="stretch" gap={3}>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            bg="white"
            borderRadius="md"
          />
          {localError ? (
            <Text color="red.500" fontSize="sm">
              {localError}
            </Text>
          ) : null}
          <Button
            colorPalette="brand"
            loading={addAttachmentMutation.isPending}
            onClick={handleUpload}
            alignSelf="flex-start"
          >
            Enviar arquivo
          </Button>
        </VStack>
      ) : null}
    </Box>
  );
};

export default ReimbursementAttachmentsSection;
