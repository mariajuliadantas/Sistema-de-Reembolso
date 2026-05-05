import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  return (
    <Flex h="100dvh" w="100%" overflow="hidden">
      <Box display="block" w="280px" borderRight="1px solid" borderColor="border.muted" bg="white">
        <Sidebar />
      </Box>

      <Flex direction="column" flex="1" overflow="hidden">
        <Header />
        <Box flex="1" overflow="auto" p={8} bg="bg.subtle">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
};

export default AppShell;
