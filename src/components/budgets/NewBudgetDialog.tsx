import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UnifiedProject } from '@/types/database';
import { useNewBudget } from '@/hooks/useNewBudgets';
import { NewBudgetForm } from './NewBudgetForm';

interface NewBudgetDialogProps {
  project: UnifiedProject;
  budgetId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewBudgetDialog: React.FC<NewBudgetDialogProps> = ({
  project,
  budgetId,
  open,
  onOpenChange,
}) => {
  const { data: budget, isLoading } = useNewBudget(budgetId || '');

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {budgetId ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {budgetId && isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Cargando presupuesto...</div>
            </div>
          ) : (
            <NewBudgetForm 
              project={project} 
              budget={budgetId ? budget : null}
              onSuccess={handleClose} 
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewBudgetDialog;