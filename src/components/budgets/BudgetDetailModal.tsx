
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer, Mail } from 'lucide-react';
import { JoinedNewBudget } from '@/types/budgets';
import { useNewBudgetItems } from '@/hooks/useNewBudgets';
import { useRegionalConfig, getRegionalLegalText } from '@/hooks/useRegionalPricing';
import type { Location } from '@/hooks/useRegionalPricing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SendBudgetEmailDialog from './SendBudgetEmailDialog';
import { generateBudgetPdfBlob, generateBudgetPdfBase64 } from '../crm/BudgetPdfDocument';
import type { BudgetPdfData, LineItem as PdfLineItem } from '../crm/BudgetPdfDocument';

interface BudgetDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    budget: JoinedNewBudget | null;
    project?: { id: string; project_code?: string };
}

const BudgetDetailModal = ({ open, onOpenChange, budget }: BudgetDetailModalProps) => {
    const { data: budgetItems = [] } = useNewBudgetItems(budget?.id);
    const { data: regionalConfigs } = useRegionalConfig();
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);

    if (!budget) return null;

    // ── Build PDF data from budget object ──────────────────
    const buildPdfData = (): BudgetPdfData | null => {
        if (!budget) return null;

        const location: Location = budget.iva_rate === 7
            ? 'canarias'
            : budget.iva_rate === 0
                ? 'internacional'
                : 'peninsula';

        const lineItems: PdfLineItem[] = [];

        // Base item
        if (budget.base_price) {
            lineItems.push({
                name: 'Base Camperización + Modelo',
                subtitle: budget.model_option?.name,
                quantity: 1,
                unitPrice: budget.base_price,
                total: budget.base_price,
            });
        }

        // Pack
        if (budget.pack_price && budget.pack_price > 0) {
            lineItems.push({
                name: 'Pack Equipamiento',
                subtitle: budget.pack?.name,
                quantity: 1,
                unitPrice: budget.pack_price,
                total: budget.pack_price,
            });
        }

        // Electric system
        if (budget.electric_system_price && budget.electric_system_price > 0) {
            lineItems.push({
                name: 'Sistema Eléctrico',
                quantity: 1,
                unitPrice: budget.electric_system_price,
                total: budget.electric_system_price,
            });
        }

        // Color modifier
        if (budget.color_modifier && budget.color_modifier !== 0) {
            lineItems.push({
                name: 'Suplemento Color',
                quantity: 1,
                unitPrice: budget.color_modifier,
                total: budget.color_modifier,
            });
        }

        // Additional items
        for (const item of budgetItems) {
            const isDiscount = item.is_discount || (item.line_total && item.line_total < 0);
            lineItems.push({
                name: item.name || '',
                quantity: item.quantity || 1,
                unitPrice: item.price || 0,
                total: item.line_total || 0,
                isDiscount: !!isDiscount,
            });
        }

        const dbTexts = getRegionalLegalText(regionalConfigs, location);

        return {
            budgetCode: budget.budget_code || '',
            date: budget.created_at
                ? format(new Date(budget.created_at), "d 'de' MMMM, yyyy", { locale: es })
                : '',
            location: location as 'peninsula' | 'canarias' | 'internacional',
            clientName: budget.project?.clients?.name || 'Cliente',
            clientEmail: budget.project?.clients?.email || '',
            clientPhone: budget.project?.clients?.phone || '',
            modelName: budget.model_option?.name || '-',
            engineName: budget.engine_option?.name || '-',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            interiorColorName: (budget as any).interior_color?.name || '',
            packName: budget.pack?.name || '-',
            lineItems,
            subtotal: budget.subtotal || 0,
            discountPercentage: budget.discount_percentage ? Math.round(budget.discount_percentage * 100) : undefined,
            discountPercentAmount: budget.discount_amount || undefined,
            ivaRate: budget.iva_rate || 21,
            ivaAmount: ((budget.subtotal || 0) - (budget.discount_amount || 0)) * ((budget.iva_rate || 21) / 100),
            total: budget.total || 0,
            reservationAmount: budget.reservation_amount || undefined,
            legalTexts: dbTexts.length > 0 ? dbTexts : undefined,
        };
    };

    const handlePrint = async () => {
        const pdfData = buildPdfData();
        if (!pdfData) return;
        try {
            const blob = await generateBudgetPdfBlob(pdfData);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Presupuesto_${budget.budget_code}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error generating PDF:', err);
        }
    };


    const handleSendEmail = () => {
        setEmailDialogOpen(true);
    };



    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl bg-white print:shadow-none print:w-full print:max-w-none print:h-auto print:static print:max-h-none print:overflow-visible">
                {/* 1. Header Fijo con Acciones (Oculto en impresión) */}
                <div className="flex justify-between items-center p-4 bg-muted/30 border-b border-border print:hidden z-20">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePrint}
                            className="gap-2 bg-white hover:bg-white shadow-sm border border-border text-[11px] font-bold uppercase tracking-wider h-10 px-5 text-black"
                        >
                            <Printer className="w-4 h-4" /> Imprimir / Descargar PDF
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleSendEmail}
                            className="gap-2 bg-white hover:bg-white shadow-sm border border-border text-[11px] font-bold uppercase tracking-wider h-10 px-5 text-black"
                        >
                            <Mail className="w-4 h-4" /> Enviar por email
                        </Button>
                    </div>
                </div>

                {/* 2. PDF Container (Scrollable) */}
                <div className="flex-1 overflow-y-auto bg-white print:overflow-visible print:px-0">
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @media print {
                            @page {
                                margin: 0;
                                size: A4;
                            }

                            /* 1. OCULTAR TODA LA APP DE FONDO */
                            #root,
                            #app-header,
                            aside,
                            header,
                            nav,
                            .print-hidden,
                            button {
                                display: none !important;
                            }

                            /* 2. ELIMINAR EL OVERLAY OSCURO (BACKDROP) */
                            [data-radix-portal] > div:first-child {
                                display: none !important;
                                background: transparent !important;
                            }

                            /* 3. RESETEAR EL DIÁLOGO PARA QUE SEA UNA PÁGINA NORMAL */
                            div[role="dialog"] {
                                position: absolute !important;
                                top: 0 !important;
                                left: 0 !important;
                                right: 0 !important;
                                width: 100% !important;
                                height: auto !important;
                                transform: none !important;
                                border: none !important;
                                box-shadow: none !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                background: white !important;
                                overflow: visible !important;
                            }

                            /* 4. ASEGURAR QUE EL DOCUMENTO ESTÉ ARRIBA */
                            #budget-document {
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                visibility: visible !important;
                                display: block !important;
                                background: white !important;
                                color: black !important;
                            }

                            /* 5. FORZAR COLORES Y GRÁFICOS */
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }

                            body {
                                background: white !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                        }
                    `}} />

                    <div id="budget-document" className="w-full space-y-0 text-[#1A1A1A] font-sans bg-white">

                        {/* 1. Hero Image (Back at the top) */}
                        <div className="w-full h-[200px] overflow-hidden">
                            <img
                                src="/lovable-uploads/Nomade-Budget.png"
                                alt="Nomade Vibe"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* 2. Logo and Budget Info (Immediately below image) */}
                        <div className="px-12 pt-0 pb-2 -mt-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <img
                                        src="/lovable-uploads/logo.png"
                                        alt="Nomade Nation"
                                        className="h-14 w-auto mb-0"
                                    />
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-bold tracking-[0.2em] text-[#94a3b8] uppercase mb-1">Presupuesto</p>
                                    <h2 className="text-4xl font-black text-[#C59D5F] tracking-tight">{budget.budget_code}</h2>
                                    <p className="text-[11px] text-[#94a3b8] mt-1">
                                        {budget.created_at ? format(new Date(budget.created_at), "d 'de' MMMM, yyyy", { locale: es }) : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 pb-12 space-y-6">
                            {/* 3. Info Blocks (Rounded Box) */}
                            <div className="grid grid-cols-2 gap-10 bg-[#F5F5F5] px-10 py-4 rounded-[12px] border border-[#E5E5E5] print:break-inside-avoid">
                                <div className="space-y-2">
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#94a3b8]">Cliente</h3>
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-xl">{budget.project?.clients?.name || 'Cliente No Identificado'}</p>
                                        <p className="text-base text-[#475569]">{budget.project?.clients?.email || '-'}</p>
                                        <p className="text-base text-[#475569]">{budget.project?.clients?.phone || '-'}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#94a3b8]">Detalles del Proyecto</h3>
                                    <div className="space-y-0.5 text-base">
                                        <p><span className="text-[#94a3b8] uppercase text-[11px] mr-3">Modelo:</span> <strong>{budget.model_option?.name || '-'}</strong></p>
                                        <p><span className="text-[#94a3b8] uppercase text-[11px] mr-3">Motor:</span> <strong>{budget.engine_option?.name || '-'}</strong></p>
                                        <p><span className="text-[#94a3b8] uppercase text-[11px] mr-3">Pack:</span> <strong>{budget.pack?.name || '-'}</strong></p>
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        <p><span className="text-[#94a3b8] uppercase text-[11px] mr-3">Interior:</span> <strong>{(budget as any).interior_color?.name || '-'}</strong></p>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Concepts Table */}
                            <div className="space-y-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[#94a3b8] text-[10px] uppercase font-bold tracking-wider border-b border-[#E5E5E5]">
                                            <th className="py-4 font-bold">Concepto</th>
                                            <th className="py-4 text-center font-bold">Cant.</th>
                                            <th className="py-4 text-right font-bold">Precio Un.</th>
                                            <th className="py-4 text-right font-bold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E5E5]">
                                        {/* Main Items */}
                                        <tr>
                                            <td className="py-5">
                                                <p className="font-bold">Base Camperización + Modelo</p>
                                                <p className="text-xs text-[#94a3b8]">{budget.model_option?.name}</p>
                                            </td>
                                            <td className="text-center">1</td>
                                            <td className="text-right">{budget.base_price?.toLocaleString()} €</td>
                                            <td className="text-right font-bold">{budget.base_price?.toLocaleString()} €</td>
                                        </tr>

                                        {budget.pack_price && budget.pack_price > 0 ? (
                                            <tr>
                                                <td className="py-5">
                                                    <p className="font-bold">Pack Equipamiento</p>
                                                    <p className="text-xs text-[#94a3b8]">{budget.pack?.name}</p>
                                                </td>
                                                <td className="text-center">1</td>
                                                <td className="text-right">{budget.pack_price?.toLocaleString()} €</td>
                                                <td className="text-right font-bold">{budget.pack_price?.toLocaleString()} €</td>
                                            </tr>
                                        ) : null}

                                        {budget.electric_system_price && budget.electric_system_price > 0 ? (
                                            <tr>
                                                <td className="py-5">
                                                    <p className="font-bold">Sistema Eléctrico</p>
                                                </td>
                                                <td className="text-center">1</td>
                                                <td className="text-right">{budget.electric_system_price?.toLocaleString()} €</td>
                                                <td className="text-right font-bold">{budget.electric_system_price?.toLocaleString()} €</td>
                                            </tr>
                                        ) : null}

                                        {budget.color_modifier !== 0 && (
                                            <tr>
                                                <td className="py-5">
                                                    <p className="font-bold">Suplemento Color</p>
                                                </td>
                                                <td className="text-center">1</td>
                                                <td className="text-right">{budget.color_modifier?.toLocaleString()} €</td>
                                                <td className="text-right font-bold">{budget.color_modifier?.toLocaleString()} €</td>
                                            </tr>
                                        )}

                                        {/* Additional Items */}
                                        {budgetItems.map((item) => {
                                            const nameStr = item.name || '';
                                            const isDiscount = item.is_discount || (item.line_total && item.line_total < 0) || (nameStr.toLowerCase().includes('-'));
                                            return (
                                                <tr key={item.id} className={isDiscount ? "text-green-600 italic font-medium" : ""}>
                                                    <td className="py-5">
                                                        <p className={isDiscount ? "" : "font-bold"}>{item.name}</p>
                                                    </td>
                                                    <td className="text-center">{item.quantity}</td>
                                                    <td className="text-right">{item.price?.toLocaleString()} €</td>
                                                    <td className="text-right font-bold">{item.line_total?.toLocaleString()} €</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* 5. Totals with Seal */}
                            <div className="flex justify-between items-center pt-4 print:break-inside-avoid">
                                {/* Temporarily removed seal from PDF */}
                                {/*
                                <div className="flex-1 flex justify-center rotate-[-5deg]">
                                    <img
                                        src="/lovable-uploads/Gemini_Generated_Image_eihoafeihoafeiho.png"
                                        alt="Official Seal"
                                        className="h-48 w-auto object-contain mix-blend-multiply"
                                    />
                                </div>
                                */}
                                <div className="flex-1" /> {/* Spacer to keep totals on the right */}
                                <div className="w-[450px] space-y-4 bg-[#F5F5F5] p-8 rounded-[12px] border border-[#E5E5E5]">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#94a3b8]">Subtotal</span>
                                        <span className="font-bold">{budget.subtotal?.toLocaleString()} €</span>
                                    </div>
                                    {budget.discount_percentage && budget.discount_percentage > 0 ? (
                                        <div className="flex justify-between text-sm text-green-600 italic">
                                            <span>Descuento aplicado ({Math.round(budget.discount_percentage * 100)}%)</span>
                                            <span className="font-bold">-{budget.discount_amount?.toLocaleString()} €</span>
                                        </div>
                                    ) : null}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#94a3b8]">IVA ({budget.iva_rate || 21}%)</span>
                                        <span className="font-bold">
                                            {(((budget.subtotal || 0) - (budget.discount_amount || 0)) * ((budget.iva_rate || 21) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </span>
                                    </div>
                                    <div className="h-px bg-[#E5E5E5] w-full" />
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-xs font-bold uppercase tracking-wider">Total Presupuesto</span>
                                        <span className="text-3xl font-bold text-[#C59D5F]">{budget.total?.toLocaleString()} €</span>
                                    </div>
                                    {budget.reservation_amount && budget.reservation_amount > 0 ? (
                                        <>
                                            <div className="flex justify-between text-sm pt-2 border-t border-dashed border-[#E5E5E5]">
                                                <span className="text-[#94a3b8]">Reserva pagada</span>
                                                <span className="font-bold text-success">-{budget.reservation_amount?.toLocaleString()} €</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-xs font-bold uppercase tracking-wider text-primary">Pendiente de Pago</span>
                                                <span className="text-2xl font-bold text-primary">{((budget.total || 0) - budget.reservation_amount).toLocaleString()} €</span>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            {/* 6. Footer / Conditions */}
                            {(() => {
                                const location: Location = budget.iva_rate === 7
                                    ? 'canarias'
                                    : budget.iva_rate === 0
                                        ? 'internacional'
                                        : 'peninsula';

                                const dbTexts = getRegionalLegalText(regionalConfigs, location);
                                const conditionLines = dbTexts.length > 0
                                    ? dbTexts
                                    : [
                                        location === 'peninsula'
                                            ? 'Precios con IVA (21%) incluido. IEDMT no incluido en el PVP — se calcula según normativa vigente.'
                                            : location === 'canarias'
                                                ? 'Precios con IGIC (7%) incluido. Exento de IEDMT. Gastos de transporte a Canarias no incluidos.'
                                                : 'Precios sin impuestos locales del país de destino. Transporte internacional no incluido.',
                                        'Este presupuesto tiene una validez de 30 días naturales desde la fecha de emisión.',
                                    ];

                                return (
                                    <div className="pt-8 print:break-inside-avoid">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#374151] mb-3">
                                            Condiciones Generales
                                        </p>
                                        <div className="space-y-1.5">
                                            {conditionLines.map((text, idx) => (
                                                <div key={idx} className="flex items-start gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-[#CBD5E1] mt-1.5 flex-shrink-0" />
                                                    <p className="text-[10px] text-[#6B7280] leading-relaxed">{text}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[9px] text-[#CBD5E1] text-center mt-4">
                                            © {new Date().getFullYear()} Nomade Vans S.L. — Todos los derechos reservados
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                    </div>
                </div>

            </DialogContent>

            {/* Email dialog */}
            <SendBudgetEmailDialog
                open={emailDialogOpen}
                onOpenChange={setEmailDialogOpen}
                clientEmail={budget.project?.clients?.email || ''}
                clientName={budget.project?.clients?.name || 'Cliente'}
                budgetCode={budget.budget_code || ''}
                totalFormatted={budget.total?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0'}
                modelName={budget.model_option?.name || ''}
                engineName={budget.engine_option?.name || ''}
                packName={budget.pack?.name || ''}
                generatePdf={async () => {
                    const pdfData = buildPdfData();
                    if (!pdfData) return null;
                    try {
                        return await generateBudgetPdfBase64(pdfData);
                    } catch (err) {
                        console.error('Error generating PDF base64:', err);
                        return null;
                    }
                }}
            />
        </Dialog>
    );
};

export default BudgetDetailModal;
