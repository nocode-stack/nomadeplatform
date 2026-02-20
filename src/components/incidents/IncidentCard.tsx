
import React, { useState } from 'react';
import { Calendar, MapPin, Camera, User, Clock, CalendarCheck, Eye, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { NewIncident } from '../../hooks/useNewIncidents';
import { useAuth } from '../../hooks/useAuth';
import { useDeleteNewIncident } from '../../hooks/useNewIncidents';
import NewStatusUpdateDialog from './NewStatusUpdateDialog';
import NewIncidentDetail from './NewIncidentDetail';
import IncidentEditFormAdvanced from './IncidentEditFormAdvanced';
import DeleteIncidentDialog from '../ui/DeleteIncidentDialog';

interface IncidentCardProps {
  incident: NewIncident;
  onStatusChange?: (incidentId: string, newStatusId: string) => void;
  userRole?: string;
}

const IncidentCard = ({
  incident,
  onStatusChange,
  userRole
}: IncidentCardProps) => {
  const { user } = useAuth();
  const deleteIncident = useDeleteNewIncident();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getStatusColor = (statusCode?: string) => {
    switch (statusCode) {
      case 'reportada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'en_revision':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'asignada':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_reparacion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reparada':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cerrada':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    return incident.status?.label || 'Sin estado';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  // Permitir todas las acciones a todos los usuarios autenticados
  const canManageStatus = !!user;
  const canEdit = !!user;
  const canDelete = !!user;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setShowDetailDialog(true);
  };

  const handleDelete = async () => {
    try {
      await deleteIncident.mutateAsync(incident.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting incident:', error);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-white shadow-sm border border-gray-200" onClick={handleCardClick}>
        <CardContent className="p-4">
          {/* Header Section - más compacto */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <div className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                  {incident.project?.client?.name || incident.project?.client_name || 'Sin cliente'}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="font-medium text-gray-800">{incident.project?.project_code || 'Sin código'}</span>
                  {incident.reference_number && (
                    <span className="text-blue-600 font-mono text-xs bg-blue-50 px-2 py-1 rounded">
                      {incident.reference_number}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${getStatusColor(incident.status?.status_code)} font-medium border text-xs px-2 py-1`}>
                  {getStatusText()}
                </Badge>
                <span className="text-xs text-gray-600 font-medium">{incident.category}</span>
              </div>
            </div>
            
            {/* Botones de acción - más compactos */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetailDialog(true);
                }} 
                className="bg-gray-600 hover:bg-gray-500 text-white border-gray-600 text-xs px-2 py-1 h-7"
                title="Ver detalles"
              >
                <Eye className="h-3 w-3" />
              </Button>

              {canEdit && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditDialog(true);
                  }} 
                  className="bg-blue-600 hover:bg-blue-500 text-white border-blue-600 text-xs px-2 py-1 h-7"
                  title="Editar incidencia completa"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}

              {canManageStatus && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStatusDialog(true);
                  }} 
                  className="text-xs px-2 py-1 h-7"
                  title="Gestionar estado y fechas"
                >
                  <CalendarCheck className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Información principal en grid más compacto */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <div className="text-xs text-gray-500 font-medium mb-1">Taller</div>
              <div className="text-gray-900 flex items-center text-sm">
                <MapPin className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                <span className="truncate text-xs">{incident.workshop}</span>
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-500 font-medium mb-1">Incidencia</div>
              <div className="flex items-center text-gray-900 text-sm">
                <Calendar className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                <span className="truncate text-xs">{formatDate(incident.incident_date)}</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 font-medium mb-1">Entrada</div>
              <div className="flex items-center text-gray-900 text-sm">
                <Clock className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                <span className="text-xs">
                  {incident.repair_entry_date ? formatDate(incident.repair_entry_date) : 'Pendiente'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 font-medium mb-1">Salida</div>
              <div className="flex items-center text-gray-900 text-sm">
                <Clock className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                <span className="text-xs">
                  {incident.repair_exit_date ? formatDate(incident.repair_exit_date) : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* Fotos y botón de eliminar */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center">
              <Camera className="h-3 w-3 mr-1 text-gray-400" />
              <span>{incident.photos?.length || 0} fotos</span>
            </div>
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600 rounded-full h-6 w-6 p-0"
                title="Eliminar incidencia"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* NewStatusUpdateDialog - Solo para gestión de estado y fechas */}
      <NewStatusUpdateDialog 
        incident={incident} 
        open={showStatusDialog} 
        onOpenChange={setShowStatusDialog} 
      />

      {/* NewIncidentDetail - Para ver detalles completos */}
      <NewIncidentDetail 
        incident={incident} 
        open={showDetailDialog} 
        onOpenChange={setShowDetailDialog} 
      />

      {/* IncidentEditFormAdvanced - Para edición completa de la incidencia */}
      <IncidentEditFormAdvanced 
        incident={incident} 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
      />

      {/* DeleteIncidentDialog - Para confirmación de eliminación */}
      <DeleteIncidentDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={deleteIncident.isPending}
      />
    </>
  );
};

export default IncidentCard;
