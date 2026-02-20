
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Zap, Users, ArrowRight } from 'lucide-react';

interface PhaseValidationDialogProps {
  isOpen: boolean;
  phaseName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PhaseValidationDialog: React.FC<PhaseValidationDialogProps> = ({
  isOpen,
  phaseName,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="h-5 w-5" />
            Validar Fase del Proyecto
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="text-sm">
              Estás a punto de marcar como completada la fase:
            </p>
            <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
              <p className="font-medium text-blue-900">"{phaseName}"</p>
            </div>
            
            <div className="bg-amber-50 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-amber-800">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Atención</span>
              </div>
              <p className="text-sm text-amber-700">
                Esta acción puede activar automáticamente:
              </p>
              <ul className="text-sm text-amber-700 space-y-1 ml-4">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Notificaciones a otros departamentos
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Cambios en el flujo de trabajo
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Actualización del estado del proyecto
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Users className="h-4 w-4 mr-2" />
            Validar y Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
