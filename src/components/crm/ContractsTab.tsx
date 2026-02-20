import { Bookmark, Handshake, FileCheck, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { useOptimizedContractQuery } from '../../hooks/useOptimizedContractQuery';

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'Contrato Reserva':
        case 'reservation':
            return <Bookmark className="w-5 h-5" />;
        case 'Acuerdo de Compraventa':
        case 'purchase_agreement':
            return <Handshake className="w-5 h-5" />;
        case 'Contrato de Compraventa':
        case 'sale_contract':
            return <FileCheck className="w-5 h-5" />;
        default:
            return <FileText className="w-5 h-5" />;
    }
};

const getTypeColors = (type: string) => {
    switch (type) {
        case 'Contrato Reserva':
        case 'reservation':
            return 'bg-blue-100/50 text-blue-600';
        case 'Acuerdo de Compraventa':
        case 'purchase_agreement':
            return 'bg-amber-100/50 text-amber-600';
        case 'Contrato de Compraventa':
        case 'sale_contract':
            return 'bg-emerald-100/50 text-emerald-600';
        default:
            return 'bg-slate-100 text-slate-600';
    }
};

const getTypeName = (type: string) => {
    switch (type) {
        case 'reservation':
            return 'Contrato Reserva';
        case 'purchase_agreement':
            return 'Acuerdo de Compraventa';
        case 'sale_contract':
            return 'Contrato de Compraventa';
        default:
            return type;
    }
};

const getStatusDetails = (status: string) => {
    switch (status) {
        case 'pending_send':
            return {
                label: 'PENDIENTE ENVÍO',
                color: 'bg-blue-50 text-blue-700 border-blue-200',
            };
        case 'pending_signature':
            return {
                label: 'ESPERANDO FIRMA',
                color: 'bg-warning/10 text-warning border-warning/20',
            };
        case 'signed':
            return {
                label: 'FIRMADO',
                color: 'bg-success/10 text-success border-success/20',
            };
        default:
            return {
                label: 'ESTADO DESCONOCIDO',
                color: 'bg-muted text-muted-foreground border-border',
            };
    }
};

const ContractItem = ({ name, status, date, code }: { name: string; status: string; date?: string; code?: string }) => {
    const details = getStatusDetails(status);
    const displayName = getTypeName(name);

    return (
        <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${getTypeColors(name)}`}>
                    {getTypeIcon(name)}
                </div>
                <div>
                    <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-foreground text-sm">{displayName}</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {code || 'SIN CÓDIGO'} • {date ? `Actualizado ${new Date(date).toLocaleDateString()}` : 'Fecha pendiente'}
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${details.color}`}>
                    {details.label}
                </span>
                <button
                    disabled
                    className="p-2 rounded-lg border border-border text-muted-foreground/40 cursor-not-allowed opacity-50 shadow-sm"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

const ContractsTab = ({ projectId }: { projectId?: string; leadStatus?: string }) => {
    const { data: contracts = [], isLoading } = useOptimizedContractQuery(projectId || '');

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
                <p className="text-sm text-muted-foreground">Visualiza el estado actual de la documentación contractual.</p>
            </div>

            {contracts.length > 0 ? (
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="divide-y divide-border/50">
                        {contracts.map((contract: any, index: number) => (
                            <ContractItem
                                key={index}
                                name={contract.contract_type}
                                status={contract.estado_visual}
                                date={contract.updated_at || contract.created_at}
                                code={contract.version ? `VERSIÓN ${contract.version}` : undefined}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-12 bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-background rounded-full border border-border">
                        <FileText className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <div className="max-w-[280px]">
                        <p className="text-sm font-bold text-foreground">No hay contratos generados</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Para generar los contratos, utiliza la opción "Generar todos los documentos" al guardar.
                        </p>
                    </div>
                </div>
            )}

            <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-border flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground italic text-center uppercase tracking-wide">
                    Nota: Los cambios en los contratos se reflejan automáticamente según las últimas versiones.
                </p>
            </div>
        </div>
    );
};

export default ContractsTab;

