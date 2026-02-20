import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Mail, RefreshCw, AlertCircle } from 'lucide-react';

interface AccountActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onResendEmail: () => Promise<{ success: boolean; error?: string }>;
}

const AccountActivationDialog: React.FC<AccountActivationDialogProps> = ({
  open,
  onOpenChange,
  email,
  onResendEmail
}) => {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const result = await onResendEmail();
      if (result.success) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      } else {
        console.error('Error reenviando email:', result.error);
      }
    } catch (error) {
      console.error('Error reenviando email:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Activación de Cuenta Requerida
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-900 mb-1">
                  Cuenta Pendiente de Activación
                </h3>
                <p className="text-sm text-amber-700">
                  Tu cuenta existe pero necesita ser activada. Por seguridad, debes establecer una nueva contraseña.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Hemos enviado un email de restablecimiento de contraseña a:
            </p>
            <p className="font-medium text-gray-900 bg-gray-50 p-2 rounded border">
              {email}
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>Pasos a seguir:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Revisa tu bandeja de entrada</li>
                <li>Haz clic en el enlace del email</li>
                <li>Establece tu nueva contraseña</li>
                <li>Vuelve aquí para vincular tu perfil</li>
              </ol>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {resendSuccess && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm text-center">
                ✅ Email reenviado correctamente
              </div>
            )}
            
            <Button
              onClick={handleResend}
              disabled={isResending}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Reenviar Email
                </>
              )}
            </Button>

            <Button
              onClick={() => onOpenChange(false)}
              variant="secondary"
              className="w-full"
            >
              Entendido
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Si no recibes el email en unos minutos, revisa tu carpeta de spam
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountActivationDialog;