import { Box, Button, Heading, Text, HStack, Icon } from '@chakra-ui/react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface ActionFeedbackModalProps {
  open: boolean;
  title: string;
  description: string;
  tone?: 'danger' | 'warning' | 'success' | 'neutral';
  primary: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
}

export function ActionFeedbackModal({
  open,
  title,
  description,
  tone = 'neutral',
  primary,
  secondary,
}: ActionFeedbackModalProps) {
  if (!open) return null;

  const palette =
    tone === 'danger' ? 'red' : tone === 'warning' ? 'orange' : tone === 'success' ? 'green' : 'brand';
  const iconColor = `${palette}.600`;
  const iconBg = `${palette}.50`;
  const IconComponent = tone === 'success' ? CheckCircle2 : AlertTriangle;

  return (
    <Box
      position="fixed"
      inset={0}
      bg="blackAlpha.600"
      backdropFilter="blur(4px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={2000}
      p={4}
    >
      <Box
        w="full"
        maxW="480px"
        bg="white"
        borderRadius="2xl"
        boxShadow="2xl"
        border="1px solid"
        borderColor="border.muted"
        p={{ base: 6, md: 8 }}
        position="relative"
        onClick={(e) => e.stopPropagation()}
      >
        <HStack align="flex-start" gap={4} mb={5}>
          <Box
            flexShrink={0}
            rounded="full"
            p={3}
            bg={iconBg}
            border="1px solid"
            borderColor={`${palette}.100`}
          >
            <Icon as={IconComponent} boxSize={7} color={iconColor} strokeWidth={2} />
          </Box>
          <Box flex="1" minW={0}>
            <Heading size="md" letterSpacing="tight" mb={1}>
              {title}
            </Heading>
            <Text fontSize="sm" color="fg.muted" lineHeight="tall" whiteSpace="pre-wrap">
              {description}
            </Text>
          </Box>
        </HStack>

        <HStack justify="flex-end" gap={3} flexWrap="wrap">
          {secondary ? (
            <Button variant="ghost" size="md" onClick={secondary.onClick}>
              {secondary.label}
            </Button>
          ) : null}
          <Button colorPalette={palette} size="md" px={6} onClick={primary.onClick}>
            {primary.label}
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}
