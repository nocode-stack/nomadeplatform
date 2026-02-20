import React from 'react';
import { Badge } from '../ui/badge';
import { Search, User } from 'lucide-react';

interface ClientStatusBadgeProps {
  status?: 'prospect' | 'client';
  className?: string;
}

const ClientStatusBadge = ({ status = 'client', className }: ClientStatusBadgeProps) => {
  if (status === 'prospect') {
    return (
      <Badge variant="secondary" className={`bg-blue-100 text-blue-800 hover:bg-blue-200 ${className}`}>
        <Search className="h-3 w-3 mr-1" />
        Prospect
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`bg-green-100 text-green-800 hover:bg-green-200 ${className}`}>
      <User className="h-3 w-3 mr-1" />
      Cliente
    </Badge>
  );
};

export default ClientStatusBadge;