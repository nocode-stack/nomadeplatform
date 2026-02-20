
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Loader2, Save, FileText, X, CheckCircle2, AlertCircle, Wallet } from 'lucide-react';

interface SaveLeadConfirmationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirmGenerateBudget: () => void;
    onConfirmGenerateAll: () => void;
    isLoading?: boolean;
    isNewLead?: boolean;
}

const SaveLeadConfirmationModal = ({
    open,
    onOpenChange,
    onConfirmGenerateBudget,
    onConfirmGenerateAll,
    isLoading = false,
    isNewLead = false,
}: SaveLeadConfirmationModalProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 border-none shadow-2xl rounded-2xl bg-card text-foreground animate-scale-in overflow-hidden">
                <div className="bg-primary/5 border-b border-border/50 p-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                            <Save className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-xl font-bold">
                            {isNewLead ? 'Registrar Nuevo Lead' : 'Guardar Cambios'}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="mt-2 text-muted-foreground">
                        Selecciona cómo deseas proceder con el registro de la información.
                    </DialogDescription>
                </div>

                <div className="p-6 space-y-4">
                    <div
                        className="group p-4 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
                        onClick={!isLoading ? onConfirmGenerateBudget : undefined}
                    >
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-background border border-primary/20 rounded-lg text-primary group-hover:bg-primary/5 transition-colors">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-primary">Guardar proyecto</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    Se guardará el lead, el proyecto y se generará un <span className="font-bold text-foreground/80">presupuesto</span> actualizado.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        className="group p-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
                        onClick={!isLoading ? onConfirmGenerateAll : undefined}
                    >
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-primary rounded-lg text-primary-foreground shadow-lg shadow-primary/20">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-primary">Guardar proyecto y generar contratos</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    Además de guardar el lead, proyecto y presupuesto, se generarán los <span className="font-bold text-foreground/80">3 contratos</span> (reserva, compra y venta).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-2 flex flex-col sm:flex-row-reverse gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="w-full sm:w-auto rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                        Cancelar
                    </Button>
                    {isLoading && (
                        <div className="flex items-center justify-center py-2 px-4 bg-muted/20 rounded-xl">
                            <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                            <span className="text-xs font-medium text-muted-foreground tracking-tight">Procesando solicitud...</span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SaveLeadConfirmationModal;
