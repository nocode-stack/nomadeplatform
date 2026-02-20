
import React from 'react';
import { QualityInspection } from '../../types/quality';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  AlertTriangle,
  Camera,
  FileText
} from 'lucide-react';

interface InspectionCardProps {
  inspection: QualityInspection;
  onClick?: (inspection: QualityInspection) => void;
}

const InspectionCard = ({ inspection, onClick }: InspectionCardProps) => {
  const getStatusBadge = (status: QualityInspection['status']) => {
    const variants = {
      'draft': { variant: 'secondary' as const, icon: FileText, text: 'Borrador' },
      'in_progress': { variant: 'default' as const, icon: Clock, text: 'En Progreso' },
      'completed': { variant: 'outline' as const, icon: CheckCircle, text: 'Completada' },
      'approved': { variant: 'default' as const, icon: CheckCircle, text: 'Aprobada' },
      'rejected': { variant: 'destructive' as const, icon: XCircle, text: 'Rechazada' }
    };
    
    const config = variants[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getPhaseBadge = (phase: QualityInspection['phase']) => {
    const phases = {
      'pre_production': 'Pre-Producción',
      'in_process': 'En Proceso',
      'final': 'Final',
      'packaging': 'Embalaje'
    };
    
    return (
      <Badge variant="outline">
        {phases[phase]}
      </Badge>
    );
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        onClick ? 'hover:bg-gray-50' : ''
      }`}
      onClick={() => onClick?.(inspection)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{inspection.projectCode}</CardTitle>
          <div className="flex gap-2">
            {getPhaseBadge(inspection.phase)}
            {getStatusBadge(inspection.status)}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {inspection.inspectorName}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(inspection.startedAt).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getPassRateColor(inspection.passRate)}`}>
              {inspection.passRate}%
            </div>
            <div className="text-xs text-gray-500">Tasa de Aprobación</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {inspection.checks.length}
            </div>
            <div className="text-xs text-gray-500">Controles</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {inspection.defectsFound}
            </div>
            <div className="text-xs text-gray-500">Defectos</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {inspection.criticalDefects}
            </div>
            <div className="text-xs text-gray-500">Críticos</div>
          </div>
        </div>

        {inspection.defectsFound > 0 && (
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-800">
              {inspection.defectsFound} defecto(s) encontrado(s)
              {inspection.criticalDefects > 0 && ` (${inspection.criticalDefects} crítico(s))`}
            </span>
          </div>
        )}

        {inspection.photos.length > 0 && (
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
            <Camera className="w-4 h-4" />
            {inspection.photos.length} foto(s) adjunta(s)
          </div>
        )}

        {inspection.overallNotes && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
            <strong>Notas:</strong> {inspection.overallNotes}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InspectionCard;
