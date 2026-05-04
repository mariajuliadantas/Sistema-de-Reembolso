import { Box, Heading, Text } from '@chakra-ui/react';

const HomePage = () => (
  <Box p={8} textAlign="center">
    <Heading as="h1" size="xl" mb={4} color="brand.500">
      Bem-vinda ao Sistema de Reembolso!
    </Heading>
    <Text fontSize="lg">
      Chakra UI e React Router configurados com sucesso.
    </Text>
  </Box>
);

export default HomePage;
