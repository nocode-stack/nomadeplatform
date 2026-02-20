import React from 'react';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { UserCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ConvertProspectButtonProps {
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
}

const ConvertProspectButton = ({ 
  clientId, 
  clientName, 
  onSuccess 
}: ConvertProspectButtonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const convertMutation = useMutation({
    mutationFn: async () => {
      if (import.meta.env.DEV) console.log('🔄 Converting prospect to client:', clientId);
      
      const { data, error } = await supabase
        .from('NEW_Clients')
        .update({ 
          client_status: 'client',
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error converting prospect:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Prospect converted successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Prospect convertido",
        description: `${clientName} ha sido convertido a cliente con código: ${data.client_code}`,
      });
      
      // Invalidar las queries relacionadas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['unified-projects'] });
      queryClient.invalidateQueries({ queryKey: ['unified-project'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error('❌ Error converting prospect:', error);
      toast({
        title: "Error al convertir",
        description: "No se pudo convertir el prospect a cliente. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Convertir a Cliente
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Convertir prospect a cliente?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Estás a punto de convertir a <strong>{clientName}</strong> de prospect a cliente.
            </p>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Esto activará:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Nuevo código de cliente (CL_25_XXX)</li>
                <li>• Asignación de vehículos</li>
                <li>• Slots de producción</li>
                <li>• Gestión de incidencias</li>
                <li>• Todas las funcionalidades de cliente</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Nota:</strong> Una vez convertido a cliente, no se puede volver a prospect.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={convertMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => convertMutation.mutate()}
            disabled={convertMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {convertMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Convirtiendo...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Sí, convertir a cliente
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConvertProspectButton;