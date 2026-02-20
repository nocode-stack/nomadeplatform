import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Discrepancy {
  field: string;
  vehicleValue: string;
  budgetValue: string;
  message: string;
}

interface VehicleSpecsAlertProps {
  discrepancies: Discrepancy[];
  className?: string;
}

export function VehicleSpecsAlert({ discrepancies, className }: VehicleSpecsAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { toast } = useToast();

  if (discrepancies.length === 0 || isDismissed) {
    return null;
  }

  const handleRequestReassignment = () => {
    // Trigger para futura integración con n8n/Slack
    if (import.meta.env.DEV) console.log("🚨 SOLICITUD DE NUEVA ASIGNACIÓN:", {
      discrepancies,
      timestamp: new Date().toISOString(),
      action: "request_vehicle_reassignment"
    });
    
    toast({
      title: "Solicitud enviada",
      description: "Se ha registrado la solicitud de nueva asignación de vehículo.",
    });
  };

  return (
    <Alert className={`border-destructive bg-destructive/5 p-4 ${className}`}>
      {/* Header con icono, texto y botón cerrar */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <AlertTitle className="text-destructive font-semibold text-sm mb-1">
              Vehículo no coincide con presupuesto
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              {discrepancies.length} discrepancia{discrepancies.length > 1 ? 's' : ''} detectada{discrepancies.length > 1 ? 's' : ''}
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDismissed(true)}
          className="h-6 w-6 p-0 hover:bg-destructive/10 ml-2 flex-shrink-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Botón de acción */}
      <div className="flex justify-start">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleRequestReassignment}
          className="text-xs h-8 px-4"
        >
          Solicitar nueva asignación
        </Button>
      </div>
    </Alert>
  );
}