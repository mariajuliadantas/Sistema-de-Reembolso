import { Box, VStack, Text, Icon, Heading, Flex, HStack } from '@chakra-ui/react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  to: string;
}

const SidebarItem = ({ icon, label, to }: SidebarItemProps) => (
  <RouterNavLink to={to} style={{ width: '100%', textDecoration: 'none' }}>
    {({ isActive }) => (
      <HStack
        p={3}
        borderRadius="md"
        transition="all 0.2s"
        bg={isActive ? 'brand.500' : 'transparent'}
        color={isActive ? 'white' : 'inherit'}
        _hover={{ bg: isActive ? 'brand.500' : 'brand.50', color: isActive ? 'white' : 'brand.600' }}
      >
        <Icon as={icon} size="sm" />
        <Text fontWeight="medium">{label}</Text>
      </HStack>
    )}
  </RouterNavLink>
);

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <Box h="full" p={5}>
      <Flex mb={10} alignItems="center" gap={2}>
        <Box bg="brand.500" p={2} borderRadius="lg">
          <History color="white" size={24} />
        </Box>
        <Heading size="md" letterSpacing="tight">ReembolsoApp</Heading>
      </Flex>

      <VStack align="start" gap={2}>
        <Text fontSize="xs" fontWeight="bold" color="fg.muted" mb={2} textTransform="uppercase">
          Menu Principal
        </Text>
        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
        <SidebarItem icon={PlusCircle} label="Novo Reembolso" to="/reimbursements/new" />
        
        {isAdmin && (
          <>
            <Text fontSize="xs" fontWeight="bold" color="fg.muted" mt={6} mb={2} textTransform="uppercase">
              Administração
            </Text>
            <SidebarItem icon={Tags} label="Categorias" to="/categories" />
            <SidebarItem icon={Users} label="Usuários" to="/users" />
          </>
        )}

        <Box mt="auto" w="full">
          {/* Settings or other bottom items could go here */}
        </Box>
      </VStack>
    </Box>
  );
};

export default Sidebar;
