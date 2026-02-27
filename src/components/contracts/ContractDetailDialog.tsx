import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Send, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useContractVersioning } from '../../hooks/useContractVersioning';
import { useToast } from '../../hooks/use-toast';
import ContractForm from './ContractForm';

interface ContractDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formData, setFormData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();
    const { generateContract, sendContract } = useContractVersioning(project?.id || '');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFormDataChange = useCallback((data: any) => {
        setFormData(data);
    }, []);

    const handleSave = async () => {
        if (!formData || !project?.id) return;
        setIsSaving(true);
        try {
            await generateContract.mutateAsync({
                contractData: {
                    ...formData,
                    project_id: project.id,
                    client_id: project.clients?.id || formData.client_id || '',
                    contract_type: contractType,
                    contract_status: 'generado',
                },
                contractType,
            });
            toast({ title: 'Contrato guardado', description: 'Los cambios se han guardado correctamente.' });
        } catch (error) {
            console.error('Error saving contract:', error);
            toast({ title: 'Error', description: 'No se pudo guardar el contrato.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSend = async () => {
        if (!project?.id) return;
        setIsSending(true);
        try {
            if (formData) {
                await generateContract.mutateAsync({
                    contractData: {
                        ...formData,
                        project_id: project.id,
                        client_id: project.clients?.id || formData.client_id || '',
                        contract_type: contractType,
                        contract_status: 'generado',
                    },
                    contractType,
                });
            }
            await sendContract.mutateAsync(contractType);
        } catch (error) {
            console.error('Error sending contract:', error);
            toast({ title: 'Error', description: 'No se pudo enviar el contrato.', variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = useCallback(() => {
        if (isSaving || isSending) return;
        onOpenChange(false);
    }, [isSaving, isSending, onOpenChange]);

    // Escape key handler (capture phase, before parent dialog)
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                e.preventDefault();
                handleClose();
            }
        };
        document.addEventListener('keydown', onKey, true);
        return () => document.removeEventListener('keydown', onKey, true);
    }, [open, handleClose]);

    // CRITICAL: Radix Dialog sets pointer-events:none on <body> when modal.
    // We must override it so our portal content is interactive.
    useEffect(() => {
        if (!open) return;

        // Persistently override Radix Dialog's pointer-events:none on body
        // Use MutationObserver because Radix may set it AFTER our useEffect
        const observer = new MutationObserver(() => {
            if (document.body.style.pointerEvents === 'none') {
                document.body.style.pointerEvents = 'auto';
            }
        });
        document.body.style.pointerEvents = 'auto';
        observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

        return () => {
            observer.disconnect();
        };
    }, [open]);

    if (!open) return null;

    const modal = (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'auto' }}>
            {/* Backdrop */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    pointerEvents: 'auto',
                }}
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
            />

            {/* Centered modal panel */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto',
                }}
            >
                <div
                    className="flex flex-col shadow-2xl rounded-2xl bg-card text-foreground border border-border"
                    style={{
                        width: 'calc(100vw - 2rem)',
                        maxWidth: '56rem',
                        height: '85vh',
                        pointerEvents: 'auto',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-muted/30 border-b border-border p-6 rounded-t-2xl shrink-0 relative">
                        <h2 className="text-xl font-bold text-foreground">{getContractTitle(contractType)}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Información completa del contrato. Todos los campos son editables.
                        </p>
                        <button
                            onClick={handleClose}
                            className="absolute right-4 top-4 p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-muted transition-all"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Scrollable form */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <ContractForm
                            project={project}
                            contractType={contractType}
                            status={status}
                            isEditMode={true}
                            onFormDataChange={handleFormDataChange}
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center p-6 bg-muted/20 border-t border-border rounded-b-2xl shrink-0">
                        <p className="text-[10px] text-muted-foreground italic uppercase tracking-wide">
                            Recuerda guardar los cambios antes de enviar.
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSaving || isSending}>
                                Cerrar
                            </Button>
                            <Button type="button" variant="outline" onClick={handleSave} disabled={isSaving || isSending} className="flex items-center gap-2">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </Button>
                            <Button type="button" onClick={handleSend} disabled={isSaving || isSending} className="flex items-center gap-2">
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                {isSending ? 'Enviando...' : 'Enviar a DocuSeal'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
};

export default ContractDetailDialog;
