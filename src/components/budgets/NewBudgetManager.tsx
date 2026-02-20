import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Eye, Edit2, Trash2, Plus, Star, Download, Loader2 } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { UnifiedProject } from '../../types/database';
import { useNewBudgets, useDeleteNewBudget, useSetPrimaryBudget } from '../../hooks/useNewBudgets';
import { useToast } from '../../hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { JoinedNewBudget } from '../../types/budgets';
import NewBudgetDialog from './NewBudgetDialog';
import BudgetDetailModal from './BudgetDetailModal';

interface NewBudgetManagerProps {
  project: UnifiedProject;
}

const NewBudgetManager = ({ project }: NewBudgetManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [primaryDialogOpen, setPrimaryDialogOpen] = useState(false);
  const [budgetToPrimary, setBudgetToPrimary] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [budgetToView, setBudgetToView] = useState<JoinedNewBudget | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: budgets = [], isLoading } = useNewBudgets(project.id);
  const deleteBudget = useDeleteNewBudget();
  const setPrimaryBudget = useSetPrimaryBudget();
  const queryClient = useQueryClient();

  const handleViewDetail = (budget: JoinedNewBudget) => {
    setBudgetToView(budget);
    setDetailDialogOpen(true);
  };


  const handleDelete = async (budgetId: string) => {
    try {
      await deleteBudget.mutateAsync(budgetId);
      toast({
        title: "Éxito",
        description: "Presupuesto eliminado correctamente.",
      });
      setDeleteDialogOpen(false);
      setBudgetToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el presupuesto.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (budgetId: string) => {
    setSelectedBudgetId(budgetId);
    setEditDialogOpen(true);
  };

  const handleSetPrimary = (budgetId: string) => {
    setBudgetToPrimary(budgetId);
    setPrimaryDialogOpen(true);
  };

  const handleDownloadPdf = async (budgetId: string, budgetCode: string) => {
    setDownloadingPdf(budgetId);

    try {
      const { data, error } = await supabase.functions.invoke('generate-budget-pdf', {
        body: { budgetId }
      });

      if (error) throw error;

      if (data.success && data.html) {
        // Crear un elemento temporal invisible para generar el PDF
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        document.body.appendChild(iframe);

        // Escribir el contenido HTML en el iframe
        iframe.contentDocument?.open();
        iframe.contentDocument?.write(data.html);
        iframe.contentDocument?.close();

        // Esperar un poco para que se cargue y luego activar la descarga
        setTimeout(() => {
          iframe.contentWindow?.print();

          // Limpiar el iframe después de un tiempo
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);

        toast({
          title: "Descarga iniciada",
          description: "El PDF del presupuesto se está descargando.",
        });
      }
    } catch (error: unknown) {
      console.error('Error generando PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF del presupuesto.",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(null);
    }
  };

  const confirmSetPrimary = async () => {
    if (!budgetToPrimary) return;

    try {
      await setPrimaryBudget.mutateAsync({ budgetId: budgetToPrimary, confirmed: true });

      // Invalidar todas las queries relacionadas para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ['unified-project', project.id] });
      await queryClient.invalidateQueries({ queryKey: ['primary-budget', project.id] });
      await queryClient.invalidateQueries({ queryKey: ['new-projects', project.id] });
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      await queryClient.invalidateQueries({ queryKey: ['vehicle', project.id] });

      toast({
        title: "Éxito",
        description: "Presupuesto marcado como primario. Los datos del proyecto y vehículo se han actualizado automáticamente.",
      });
      setPrimaryDialogOpen(false);
      setBudgetToPrimary(null);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'CONFIRMATION_REQUIRED') {
        // Esto no debería ocurrir aquí
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo marcar el presupuesto como primario.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Presupuestos del Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!budgets || budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Presupuestos del Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No hay presupuestos creados para este proyecto.
            </p>
            <Button
              onClick={() => {
                if (import.meta.env.DEV) console.log('🔘 Botón "Crear Primer Presupuesto" clickeado');
                setCreateDialogOpen(true);
                if (import.meta.env.DEV) console.log('📂 Estado createDialogOpen establecido a true');
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Presupuesto
            </Button>
          </div>

          {/* Dialog para crear presupuesto */}
          <NewBudgetDialog
            project={project}
            budgetId={null}
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Presupuestos del Proyecto</CardTitle>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => handleViewDetail(budget)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{budget.budget_code}</h3>
                    {budget.is_primary && (
                      <Badge variant="default" className="bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest px-3">
                        Actual
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Subtotal:</span>{' '}
                      {budget.subtotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <div>
                      <span className="font-medium">Total:</span>{' '}
                      {budget.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <div>
                      <span className="font-medium">Creado:</span>{' '}
                      {budget.created_at ? new Date(budget.created_at).toLocaleDateString('es-ES') : '-'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(budget.id);
                    }}
                    className={`p-2 ${budget.is_primary
                      ? 'text-green-600 hover:text-green-700'
                      : 'text-gray-400 hover:text-green-600'
                      }`}
                    title={budget.is_primary ? 'Presupuesto primario' : 'Marcar como primario'}
                  >
                    <Star
                      className={`h-4 w-4 ${budget.is_primary ? 'fill-current' : ''}`}
                    />
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetail(budget);
                    }}
                    title="Ver detalle"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPdf(budget.id, budget.budget_code);
                    }}
                    disabled={downloadingPdf === budget.id}
                    title="Descargar PDF"
                  >
                    {downloadingPdf === budget.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(budget.id);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBudgetToDelete(budget.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NewBudgetDialog
        project={project}
        budgetId={null}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <NewBudgetDialog
        project={project}
        budgetId={selectedBudgetId}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedBudgetId(null);
        }}
      />

      <BudgetDetailModal
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        budget={budgetToView}
        project={project}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El presupuesto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => budgetToDelete && handleDelete(budgetToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Primary Budget Confirmation Dialog */}
      <AlertDialog open={primaryDialogOpen} onOpenChange={setPrimaryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⭐ Cambiar Presupuesto Principal</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>¿Estás seguro de que quieres marcar este presupuesto como principal?</strong>
              </p>
              <p className="text-sm">
                Al hacer esto, automáticamente se actualizará:
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <strong>Todos los contratos</strong> del proyecto con el nuevo total</li>
                <li>• <strong>Información del proyecto</strong> (modelo, especificaciones)</li>
                <li>• <strong>Datos del vehículo</strong> asociado al proyecto</li>
              </ul>
              <p className="text-sm font-medium text-amber-600">
                ⚠️ El presupuesto principal anterior dejará de serlo automáticamente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBudgetToPrimary(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSetPrimary}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              ⭐ Sí, marcar como principal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NewBudgetManager;