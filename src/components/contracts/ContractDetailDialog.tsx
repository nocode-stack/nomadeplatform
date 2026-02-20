import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../ui/dialog';
import ContractForm from './ContractForm';

interface ContractDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: any;
    contractType: string;
    status: string;
}

const getContractTitle = (type: string) => {
    switch (type) {
        case 'reservation': return 'Contrato de Reserva';
        case 'purchase_agreement': return 'Acuerdo de Compraventa';
        case 'sale_contract': return 'Contrato de Compraventa';
        default: return 'Contrato';
    }
};

const ContractDetailDialog = ({ open, onOpenChange, project, contractType, status }: ContractDetailDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl h-[85vh] flex flex-col p-0 border-none shadow-2xl rounded-2xl bg-card text-foreground">
                <div className="bg-muted/30 border-b border-border p-6 rounded-t-2xl shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-foreground">
                            {getContractTitle(contractType)}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-1">
                            Información completa del contrato. Los datos se pre-rellenan automáticamente desde el proyecto.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <ContractForm
                        project={project}
                        contractType={contractType}
                        status={status}
                        isEditMode={false}
                    />
                </div>

                <div className="flex justify-between items-center p-6 bg-muted/20 border-t border-border rounded-b-2xl shrink-0">
                    <p className="text-[10px] text-muted-foreground italic uppercase tracking-wide">
                        Nota: La integración con DocuSeal se habilitará próximamente.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="px-6 py-2.5 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                        >
                            Cerrar
                        </button>
                        <button
                            disabled
                            className="px-6 py-2.5 text-sm font-bold rounded-xl bg-primary/30 text-primary-foreground/50 cursor-not-allowed shadow-sm"
                        >
                            Enviar a DocuSeal
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ContractDetailDialog;
