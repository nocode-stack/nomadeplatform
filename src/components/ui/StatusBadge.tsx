
import React from 'react';

interface StatusBadgeProps {
  status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'warranty' | 'reportada' | 'fechas_asignadas' | 'en_reparacion' | 'terminada';
  text: string;
  className?: string;
}

const StatusBadge = ({ status, text, className = '' }: StatusBadgeProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
      case 'terminada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
      case 'en_reparacion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warranty':
      case 'fechas_asignadas':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reportada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles()} ${className}`}>
      {text}
    </span>
  );
};

export default StatusBadge;
