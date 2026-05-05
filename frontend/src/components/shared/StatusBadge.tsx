import { Badge, type BadgeProps } from '@chakra-ui/react';
import type { ReimbursementStatus } from '../../types/reimbursement';
import {
  reimbursementStatusColorMap,
  reimbursementStatusLabelMap,
} from '../../lib/reimbursement';

interface StatusBadgeProps extends BadgeProps {
  status: ReimbursementStatus;
}

const StatusBadge = ({ status, ...props }: StatusBadgeProps) => {
  return (
    <Badge
      colorPalette={reimbursementStatusColorMap[status]}
      variant="subtle"
      px={2}
      py={1}
      borderRadius="md"
      {...props}
    >
      {reimbursementStatusLabelMap[status]}
    </Badge>
  );
};

export default StatusBadge;
