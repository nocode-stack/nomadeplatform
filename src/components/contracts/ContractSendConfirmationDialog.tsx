import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertTriangle, CheckCircle, Send, X } from 'lucide-react';

interface ContractSendConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contractType: string;
  missingFields: string[];
  isLoading?: boolean;
}

const fieldLabels: Record<string, string> = {
  client_full_name: 'Nombre completo del cliente',
  client_email: 'Email del cliente',
  client_phone: 'Teléfono del cliente',
  client_dni: 'DNI del cliente',
  billing_address: 'Dirección de facturación',
  vehicle_model: 'Modelo del vehículo',
  vehicle_vin: 'Número de bastidor',
  vehicle_plate: 'Matrícula',
  vehicle_engine: 'Motor',
  total_price: 'Precio total',
  payment_reserve: 'Importe de reserva',
  billing_entity_name: 'Nombre de la entidad de facturación',
  billing_entity_nif: 'NIF de la entidad de facturación',
  iban: 'Cuenta bancaria (IBAN)',
  payment_first_percentage: 'Primer pago (porcentaje)',
  payment_first_amount: 'Primer pago (importe)',
  payment_second_percentage: 'Segundo pago (porcentaje)',
  payment_second_amount: 'Segundo pago (importe)',
  payment_third_percentage: 'Tercer pago (porcentaje)',
  payment_third_amount: 'Tercer pago (importe)',
};

const contractTypeLabels: Record<string, string> = {
  reservation: 'Contrato de Reserva',
  purchase_agreement: 'Acuerdo de Compraventa',
  sale_contract: 'Contrato de Compraventa',
};

const ContractSendConfirmationDialog: React.FC<ContractSendConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contractType,
  missingFields,
  isLoading = false,
}) => {
  const contractTypeName = contractTypeLabels[contractType] || contractType;
  const hasMissingFields = missingFields.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasMissingFields ? (
              <AlertTriangle className="h-5 w-5 text-warning" />
            ) : (
              <CheckCircle className="h-5 w-5 text-success" />
            )}
            Confirmar envío de contrato
          </DialogTitle>
          <DialogDescription>
            Estás a punto de enviar el <strong>{contractTypeName}</strong>.
            {hasMissingFields ? (
              " Se han detectado campos incompletos."
            ) : (
              " Todos los campos requeridos están completos."
            )}
          </DialogDescription>
        </DialogHeader>

        {hasMissingFields && (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="mb-2">
                <strong>Campos faltantes o incompletos:</strong>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {missingFields.map((field) => (
                  <li key={field} className="text-sm">
                    {fieldLabels[field] || field}
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-sm">
                Puedes enviar el contrato con campos incompletos, pero se recomienda completar toda la información antes del envío.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!hasMissingFields && (
          <Alert className="my-4 border-success/20 bg-success/10">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              Todos los campos requeridos están completos. El contrato está listo para ser enviado.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            variant={hasMissingFields ? "destructive" : "default"}
            className="w-full sm:w-auto"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? (
              "Enviando..."
            ) : hasMissingFields ? (
              "Enviar de todas formas"
            ) : (
              "Confirmar envío"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractSendConfirmationDialog;