import { 
  Flex, 
  Box, 
  Text, 
  Avatar, 
  MenuRoot, 
  MenuTrigger, 
  MenuContent, 
  MenuItem, 
  IconButton,
  Heading
} from '@chakra-ui/react';
import { LogOut, User, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <Flex 
      h="70px" 
      px={{ base: 4, md: 8 }} 
      align="center" 
      justify="space-between" 
      bg="white" 
      borderBottom="1px solid" 
      borderColor="border.muted"
    >
      <Box display={{ base: 'block', md: 'none' }}>
        <Heading size="md">Reembolso</Heading>
      </Box>
      <Box /> {/* Spacer for flex justify */}

      <Flex align="center" gap={4}>
        <IconButton variant="ghost" aria-label="Notifications" size="sm">
          <Bell size={20} />
        </IconButton>

        <MenuRoot>
          <MenuTrigger asChild>
            <Flex align="center" gap={3} cursor="pointer" p={1} borderRadius="lg" _hover={{ bg: 'bg.subtle' }}>
              <Box textAlign="right" display={{ base: 'none', md: 'block' }}>
                <Text fontSize="sm" fontWeight="bold">{user?.name}</Text>
                <Text fontSize="xs" color="fg.muted">{user?.role}</Text>
              </Box>
              <Avatar.Root size="sm">
                <Avatar.Fallback name={user?.name} />
              </Avatar.Root>
            </Flex>
          </MenuTrigger>
          <MenuContent>
            <MenuItem value="profile">
              <User size={16} style={{ marginRight: '8px' }} />
              Perfil
            </MenuItem>
            <MenuItem value="logout" color="red.500" onClick={logout}>
              <LogOut size={16} style={{ marginRight: '8px' }} />
              Sair
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      </Flex>
    </Flex>
  );
};

export default Header;
