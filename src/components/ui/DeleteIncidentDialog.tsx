
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
} from './alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface DeleteIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteIncidentDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  isDeleting 
}: DeleteIncidentDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Incidencia Definitivamente
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="text-gray-700">
              <strong>⚠️ ADVERTENCIA IMPORTANTE:</strong>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <p className="text-red-800 font-medium mb-2">
                Esta acción eliminará PERMANENTEMENTE la incidencia de la base de datos:
              </p>
              <ul className="list-disc list-inside text-red-700 space-y-1">
                <li>Se perderán todos los datos de la incidencia</li>
                <li>Se eliminarán todos los conceptos a reparar asociados</li>
                <li>No se podrá recuperar la información</li>
                <li>Afectará las estadísticas y reportes históricos</li>
              </ul>
            </div>
            <div className="text-gray-700">
              <strong>¿Estás completamente seguro de que quieres continuar?</strong>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? 'Eliminando...' : 'Sí, Eliminar Definitivamente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteIncidentDialog;
