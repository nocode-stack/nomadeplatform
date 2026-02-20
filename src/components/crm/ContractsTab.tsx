import React, { useState } from 'react';
import { Bookmark, Handshake, FileCheck, FileText, ExternalLink, Loader2, Plus, Star, Eye } from 'lucide-react';
import { useOptimizedContractQuery } from '../../hooks/useOptimizedContractQuery';
import { useContractVersioning } from '../../hooks/useContractVersioning';
import { useToggleContractPrimary } from '../../hooks/useToggleContractPrimary';
import { useNewBudgets, useProjectBudgets } from '../../hooks/useNewBudgets';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ContractDetailDialog from '../contracts/ContractDetailDialog';

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

interface ContractsTabProps {
    projectId?: string;
    leadStatus?: string;
}

const ContractsTab = ({ projectId }: ContractsTabProps) => {
    // Get budgets to find the primary one
    const { data: budgets, isLoading: isLoadingBudgets } = useProjectBudgets(projectId || '');
    const primaryBudget = budgets?.find(b => b.is_primary) || budgets?.[0];
    const primaryBudgetId = primaryBudget?.id;

    // Filter contracts by that primary budget
    const { data: contracts = [], isLoading: isLoadingContracts } = useOptimizedContractQuery(projectId || '', primaryBudgetId);

    // Aggregated loading state
    const isLoading = isLoadingBudgets || isLoadingContracts;

    const { generateContract } = useContractVersioning(projectId || '');
    const togglePrimary = useToggleContractPrimary();
    const { toast } = useToast();
    const [creatingType, setCreatingType] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedContractType, setSelectedContractType] = useState<string>('');
    const [projectData, setProjectData] = useState<any>(null);

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
            .from('NEW_Clients')
            .select('*')
            .eq('id', projectId)
            .single();

        if (!client) return null;

        // Fetch primary budget with model/engine options
        const { data: primaryBudget } = await supabase
            .from('NEW_Budget')
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
        let billingData: any = null;
        const { data: billing } = await supabase
            .from('NEW_Billing')
            .select('*')
            .eq('client_id', projectId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        billingData = billing;

        return { id: projectId, new_clients: client, primaryBudget, billingData, new_vehicles: null };
    };

    // Handle creating a new contract
    const handleCreate = async (contractType: string) => {
        if (!projectId) return;
        setCreatingType(contractType);

        try {
            // Get project + client + primary budget data
            const project = await fetchProjectData();
            if (!project) {
                toast({ title: 'Error', description: 'No se pudo obtener los datos del proyecto.', variant: 'destructive' });
                setCreatingType(null);
                return;
            }

            const clientId = project.new_clients?.id || '';
            if (!clientId) {
                toast({ title: 'Error', description: 'El proyecto no tiene un cliente asociado.', variant: 'destructive' });
                setCreatingType(null);
                return;
            }

            const budget = project.primaryBudget;
            if (!budget) {
                toast({ title: 'Aviso', description: 'No hay presupuesto principal. Se creará el contrato con datos parciales.' });
            }

            const billing: any = project.billingData;
            const client: any = project.new_clients;
            const vehicle: any = project.new_vehicles;

            // Build contract data from client + primary budget
            const vehicleModel = budget?.model_option?.name || vehicle?.engine || 'Modelo pendiente';
            const vehicleEngine = budget?.engine_option?.name || vehicle?.engine || '';
            const totalPrice = budget?.total || 0;
            const reservationAmount = budget?.reservation_amount || (contractType === 'reservation' ? 2000 : 0);

            await generateContract.mutateAsync({
                contractData: {
                    project_id: projectId,
                    client_id: clientId,
                    budget_id: budget?.id || '',
                    contract_type: contractType,
                    client_full_name: client?.name || '',
                    client_dni: client?.dni || '',
                    client_email: client?.email || '',
                    client_phone: client?.phone || '',
                    billing_entity_name: billing?.name !== client?.name ? (billing?.name || '') : '',
                    billing_entity_nif: billing?.nif || '',
                    billing_address: billing?.billing_address || client?.address || '',
                    vehicle_model: vehicleModel,
                    vehicle_vin: vehicle?.numero_bastidor || '',
                    vehicle_plate: vehicle?.matricula || '',
                    vehicle_engine: vehicleEngine,
                    total_price: totalPrice,
                    payment_reserve: contractType === 'reservation' ? reservationAmount : 0,
                    payment_conditions: '',
                    iban: 'ES80 0081 7011 1900 0384 8192',
                },
                contractType,
            });

            // Store project data and open dialog
            setProjectData(project);
            setSelectedContractType(contractType);
            setDialogOpen(true);
        } catch (error) {
            console.error('Error creating contract:', error);
            toast({ title: 'Error', description: 'No se pudo crear el contrato.', variant: 'destructive' });
        } finally {
            setCreatingType(null);
        }
    };

    // Handle opening the detail dialog for an existing contract
    const handleView = async (contractType: string) => {
        const project = await fetchProjectData();
        if (!project) {
            toast({ title: 'Error', description: 'No se pudo obtener los datos del proyecto.', variant: 'destructive' });
            return;
        }
        setProjectData(project);
        setSelectedContractType(contractType);
        setDialogOpen(true);
    };

    // Handle toggling is_primary
    const handleTogglePrimary = (contract: any) => {
        if (!contract) return;
        togglePrimary.mutate({
            contractId: contract.id,
            projectId: projectId || '',
            contractType: contract.contract_type,
            isPrimary: !contract.is_primary,
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-sm text-muted-foreground animate-pulse">Cargando contratos...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-foreground">Gestión de Contratos</h3>
                <p className="text-sm text-muted-foreground">Cada proyecto requiere 3 contratos. Crea y gestiona cada uno de forma independiente.</p>
            </div>

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
                                    {/* Star for primary */}
                                    <button
                                        onClick={() => exists && handleTogglePrimary(contract)}
                                        disabled={!exists || togglePrimary.isPending}
                                        className={`p-1 rounded-lg transition-all ${exists
                                            ? 'cursor-pointer hover:scale-110'
                                            : 'cursor-not-allowed opacity-30'
                                            }`}
                                        title={exists ? (contract.is_primary ? 'Quitar como principal' : 'Marcar como principal') : 'No disponible'}
                                    >
                                        <Star
                                            className={`w-4 h-4 transition-all ${exists && contract.is_primary
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-muted-foreground/30'
                                                }`}
                                        />
                                    </button>

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
                                            onClick={() => handleView(type.key)}
                                            className="p-2 rounded-lg border border-border text-primary hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm"
                                            title="Ver contrato"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                    ) : (
                                        /* Create button for non-existing contracts */
                                        <button
                                            onClick={() => handleCreate(type.key)}
                                            disabled={isCreating || !projectId}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-border flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground italic text-center uppercase tracking-wide">
                    Nota: Solo los contratos marcados con ★ se mostrarán como principales en la ficha de contacto.
                </p>
            </div>

            {/* Contract Detail Dialog */}
            {projectData && (
                <ContractDetailDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    project={projectData}
                    contractType={selectedContractType}
                    status={findContract(selectedContractType)?.estado_visual || 'generated'}
                />
            )}
        </div>
    );
};

export default ContractsTab;
