import React, { useState, useCallback, useEffect } from 'react';
import { Bookmark, Handshake, FileCheck, Loader2, Plus, Eye, ArrowLeft, Save, Send, X, AlertTriangle } from 'lucide-react';
import { useOptimizedContractQuery } from '../../hooks/useOptimizedContractQuery';
import { useContractVersioning } from '../../hooks/useContractVersioning';

import { useProjectBudgets } from '../../hooks/useNewBudgets';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '../ui/button';
import ContractForm from '../contracts/ContractForm';

// The 3 contract types that every project must have
const CONTRACT_TYPES = [
    { key: 'reservation', label: 'Contrato de Reserva', icon: Bookmark, colors: 'bg-blue-100/50 text-blue-600', disabledColors: 'bg-slate-50 text-slate-300' },
    { key: 'purchase_agreement', label: 'Acuerdo de Compraventa', icon: Handshake, colors: 'bg-amber-100/50 text-amber-600', disabledColors: 'bg-slate-50 text-slate-300' },
    { key: 'sale_contract', label: 'Contrato de Compraventa', icon: FileCheck, colors: 'bg-emerald-100/50 text-emerald-600', disabledColors: 'bg-slate-50 text-slate-300' },
];

const getStatusDetails = (status: string) => {
    switch (status) {
        case 'pending_send':
        case 'generated':
            return { label: 'PENDIENTE ENVÍO', color: 'bg-blue-50 text-blue-700 border-blue-200' };
        case 'pending_signature':
        case 'sent':
            return { label: 'ESPERANDO FIRMA', color: 'bg-warning/10 text-warning border-warning/20' };
        case 'signed':
            return { label: 'FIRMADO', color: 'bg-success/10 text-success border-success/20' };
        case 'editing':
            return { label: 'EN EDICIÓN', color: 'bg-orange-50 text-orange-700 border-orange-200' };
        default:
            return { label: 'NO CREADO', color: 'bg-muted text-muted-foreground border-border' };
    }
};

const getContractTitle = (type: string) => {
    switch (type) {
        case 'reservation': return 'Contrato de Reserva';
        case 'purchase_agreement': return 'Acuerdo de Compraventa';
        case 'sale_contract': return 'Contrato de Compraventa';
        default: return 'Contrato';
    }
};

interface ContractsTabProps {
    projectId?: string;
    leadStatus?: string;
    onContractFormOpen?: (isOpen: boolean) => void;
}

const ContractsTab = ({ projectId, onContractFormOpen }: ContractsTabProps) => {
    // Get budgets to find the primary one
    const { data: budgets, isLoading: isLoadingBudgets } = useProjectBudgets(projectId || '');
    const primaryBudget = budgets?.find(b => b.is_primary) || budgets?.[0];
    const primaryBudgetId = primaryBudget?.id;

    // Filter contracts by that primary budget
    const { data: contracts = [], isLoading: isLoadingContracts } = useOptimizedContractQuery(projectId || '', primaryBudgetId);

    // Aggregated loading state
    const isLoading = isLoadingBudgets || isLoadingContracts;

    // Block contract creation when there is no associated budget
    const noBudget = !isLoading && !primaryBudgetId;

    const { generateContract, sendContract } = useContractVersioning(projectId || '');

    const { toast } = useToast();
    const [creatingType, setCreatingType] = useState<string | null>(null);

    // Inline form state — when set, shows the form instead of the list
    const [activeForm, setActiveForm] = useState<{ contractType: string; project: any } | null>(null);
    const [formData, setFormData] = useState<any>(null);
    const [formProgress, setFormProgress] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Notify parent when contract form is opened/closed
    useEffect(() => {
        onContractFormOpen?.(!!activeForm);
    }, [activeForm, onContractFormOpen]);

    // Find an existing contract for the given type
    const findContract = (type: string) => {
        return (contracts as any[]).find((c: any) => c.contract_type === type);
    };

    // Fetch client data + primary budget for the detail dialog and contract creation
    // Note: projectId prop now carries the client_id
    const fetchProjectData = async () => {
        if (!projectId) return null;

        // Fetch client directly (projectId is now clientId)
        const { data: client } = await supabase
            .from('clients')
            .select('*')
            .eq('id', projectId)
            .single();

        if (!client) return null;

        // Fetch primary budget with model/engine options
        const { data: budget } = await supabase
            .from('budget')
            .select(`
                *,
                model_option:model_options(name),
                engine_option:engine_options(name)
            `)
            .eq('client_id', projectId)
            .eq('is_primary', true)
            .limit(1)
            .maybeSingle();

        // Fetch billing data
        const { data: billing } = await supabase
            .from('billing')
            .select('*')
            .eq('client_id', projectId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        return { id: projectId, clients: client, primaryBudget: budget, billingData: billing, vehicles: null };
    };

    // Open the inline form
    const openForm = async (contractType: string) => {
        if (noBudget) {
            toast({ title: 'Sin presupuesto', description: 'Debes crear un presupuesto antes de generar un contrato.', variant: 'destructive' });
            return;
        }
        setCreatingType(contractType);
        try {
            const project = await fetchProjectData();
            if (!project) {
                toast({ title: 'Error', description: 'No se pudo obtener los datos del proyecto.', variant: 'destructive' });
                return;
            }
            setFormData(null);
            setActiveForm({ contractType, project });
        } catch (error) {
            console.error('Error fetching project data:', error);
            toast({ title: 'Error', description: 'No se pudo obtener los datos.', variant: 'destructive' });
        } finally {
            setCreatingType(null);
        }
    };

    // Close the inline form
    const closeForm = () => {
        setActiveForm(null);
        setFormData(null);
    };

    // Save contract
    const handleSave = async () => {
        if (!formData || !activeForm) return;
        if (noBudget) {
            toast({ title: 'Sin presupuesto', description: 'No se puede guardar un contrato sin presupuesto asociado.', variant: 'destructive' });
            return;
        }
        setIsSaving(true);
        try {
            await generateContract.mutateAsync({
                contractData: {
                    ...formData,
                    project_id: projectId,
                    client_id: activeForm.project.clients?.id || formData.client_id || '',
                    budget_id: primaryBudgetId,
                    contract_type: activeForm.contractType,
                    contract_status: 'generado',
                },
                contractType: activeForm.contractType,
            });
            toast({ title: 'Contrato guardado', description: 'Los cambios se han guardado correctamente.' });
        } catch (error) {
            console.error('Error saving contract:', error);
            toast({ title: 'Error', description: 'No se pudo guardar el contrato.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    // Send contract
    const handleSend = async () => {
        if (!activeForm) return;
        if (noBudget) {
            toast({ title: 'Sin presupuesto', description: 'No se puede enviar un contrato sin presupuesto asociado.', variant: 'destructive' });
            return;
        }
        setIsSending(true);
        try {
            // Save first if there's form data
            if (formData) {
                await generateContract.mutateAsync({
                    contractData: {
                        ...formData,
                        project_id: projectId,
                        client_id: activeForm.project.clients?.id || formData.client_id || '',
                        budget_id: primaryBudgetId,
                        contract_type: activeForm.contractType,
                        contract_status: 'generado',
                    },
                    contractType: activeForm.contractType,
                });
            }
            await sendContract.mutateAsync(activeForm.contractType);
            toast({ title: 'Contrato enviado', description: 'El contrato ha sido enviado al cliente.' });
        } catch (error) {
            console.error('Error sending contract:', error);
            toast({ title: 'Error', description: 'No se pudo enviar el contrato.', variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    const handleFormDataChange = useCallback((data: any) => {
        setFormData(data);
    }, []);

    const handleProgressChange = useCallback((progress: number) => {
        setFormProgress(progress);
    }, []);


    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-sm text-muted-foreground animate-pulse">Cargando contratos...</p>
            </div>
        );
    }

    // ==========================================
    // INLINE FORM VIEW — shows the contract form
    // ==========================================
    if (activeForm) {
        const contract = findContract(activeForm.contractType);
        const contractStatus = contract?.estado_visual || 'generated';

        return (
            <div className="animate-fade-in-up">
                {/* Header with back button — sticky, flush with parent edges */}
                <div className="flex items-center justify-between sticky top-0 z-10 bg-card py-4 border-b border-border -mx-8 px-8">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={closeForm}
                            disabled={isSaving || isSending}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">
                                {getContractTitle(activeForm.contractType)}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Todos los campos son editables
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={closeForm}
                            disabled={isSaving || isSending}
                        >
                            <X className="w-4 h-4 mr-1" />
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving || isSending}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSend}
                            disabled={isSaving || isSending || formProgress < 100}
                            title={formProgress < 100 ? `Completa todos los campos (${formProgress}% completado)` : undefined}
                        >
                            {isSending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                            {isSending ? 'Enviando...' : `Enviar a DocuSeal${formProgress < 100 ? ` (${formProgress}%)` : ''}`}
                        </Button>
                    </div>
                </div>

                {/* The actual form */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mt-6">
                    <ContractForm
                        key={`${activeForm.contractType}-${activeForm.project.id}`}
                        project={activeForm.project}
                        contractType={activeForm.contractType}
                        status={contractStatus}
                        isEditMode={true}
                        onFormDataChange={handleFormDataChange}
                        onProgressChange={handleProgressChange}
                    />
                </div>
            </div>
        );
    }

    // ==========================================
    // LIST VIEW — shows the 3 contract types
    // ==========================================
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-foreground">Gestión de Contratos</h3>
                <p className="text-sm text-muted-foreground">Cada proyecto requiere 3 contratos. Crea y gestiona cada uno de forma independiente.</p>
            </div>

            {noBudget && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                    <div>
                        <p className="text-sm font-semibold">No hay presupuesto asociado</p>
                        <p className="text-xs text-amber-700">Para crear contratos, primero debes crear y aprobar un presupuesto en la pestaña de Presupuestos.</p>
                    </div>
                </div>
            )}

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="divide-y divide-border/50">
                    {CONTRACT_TYPES.map((type) => {
                        const contract = findContract(type.key);
                        const exists = !!contract;
                        const status = exists ? (contract.estado_visual || 'generated') : 'not_created';
                        const details = getStatusDetails(status);
                        const Icon = type.icon;
                        const isCreating = creatingType === type.key;

                        return (
                            <div
                                key={type.key}
                                className={`p-4 flex items-center justify-between transition-colors group ${exists ? 'hover:bg-slate-50/50' : 'bg-muted/10'}`}
                            >
                                <div className="flex items-center space-x-4">
                                    {/* Contract type icon */}
                                    <div className={`p-3 rounded-xl ${exists ? type.colors : type.disabledColors}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    {/* Contract info */}
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h4 className={`font-bold text-sm ${exists ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                                                {type.label}
                                            </h4>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                            {exists
                                                ? `${contract.version ? `VERSIÓN ${contract.version}` : 'SIN CÓDIGO'} • Actualizado ${new Date(contract.updated_at || contract.created_at).toLocaleDateString()}`
                                                : 'CONTRATO NO CREADO AÚN'
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    {/* Status badge */}
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${details.color}`}>
                                        {details.label}
                                    </span>

                                    {exists ? (
                                        /* View button for existing contracts */
                                        <button
                                            type="button"
                                            onClick={() => openForm(type.key)}
                                            className="p-2 rounded-lg border border-border text-primary hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm"
                                            title="Ver contrato"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                    ) : (
                                        /* Create button for non-existing contracts */
                                        <button
                                            type="button"
                                            onClick={() => openForm(type.key)}
                                            disabled={isCreating || !projectId || noBudget}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={noBudget ? 'Crea un presupuesto primero' : undefined}
                                        >
                                            {isCreating ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Plus className="w-3.5 h-3.5" />
                                            )}
                                            <span>{isCreating ? 'Creando...' : 'Crear'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


        </div>
    );
};

export default ContractsTab;
