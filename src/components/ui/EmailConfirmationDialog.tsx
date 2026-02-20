
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Mail } from 'lucide-react';

interface EmailConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

const EmailConfirmationDialog = ({ open, onOpenChange, email }: EmailConfirmationDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">
            ¡Confirma tu email!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            <p>
              Hemos enviado un email de confirmación a:
            </p>
            <p className="font-medium text-gray-900">
              {email}
            </p>
            <p>
              Por favor, revisa tu bandeja de entrada y haz clic en el enlace de confirmación para activar tu cuenta.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              <p className="text-amber-800 text-sm">
                💡 <strong>Tip:</strong> Si no ves el email, revisa tu carpeta de spam o correo no deseado.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Entendido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EmailConfirmationDialog;
