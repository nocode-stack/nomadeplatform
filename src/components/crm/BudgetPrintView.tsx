import React from 'react';
import {
    Dialog,
    DialogContent,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Printer, Mail, X } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────
type Location = 'peninsula' | 'canarias' | 'internacional';

interface LineItem {
    name: string;
    subtitle?: string;
    quantity: number;
    unitPrice: number;
    total: number;
    isDiscount?: boolean;
    isCustom?: boolean;
    /** Sub-items included in this line (e.g. pack components) */
    subItems?: string[];
}

interface BudgetPrintData {
    budgetCode: string;
    date: string;
    location: Location;
    // Client
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    // Project details
    modelName: string;
    engineName: string;
    interiorColorName: string;
    packName: string;
    // Line items table
    lineItems: LineItem[];
    // Calculations
    subtotal: number;
    discountPercentage?: number;
    discountPercentAmount?: number;
    discountFixed?: number;
    ivaRate: number;
    ivaAmount: number;
    total: number;
    iedmt?: number;
    totalWithIedmt?: number;
    reservationAmount?: number;
}

interface BudgetPrintViewProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: BudgetPrintData | null;
    /** Legal texts from DB; when provided, overrides the hardcoded locationLegalTexts */
    legalTexts?: string[];
}

// ── Helpers ────────────────────────────────────────────────
const fmt = (n: number) =>
    n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const locationLegalTexts: Record<Location, string[]> = {
    peninsula: [
        'Precios con IVA (21%) incluido. IEDMT no incluido en el PVP — se calcula según normativa vigente.',
        'Plazo estimado de entrega: 8-14 semanas desde la confirmación del pedido, sujeto a disponibilidad de vehículo base y componentes.',
        'Reserva mínima de 1.500€ necesaria para confirmar el pedido. No reembolsable una vez iniciada la producción.',
        'Este presupuesto tiene una validez de 30 días naturales desde la fecha de emisión.',
    ],
    canarias: [
        'Precios sin IVA. IEDMT incluido en el presupuesto.',
        'Gastos de transporte a Canarias no incluidos — consultar coste según destino.',
        'Plazo estimado de entrega: 10-16 semanas desde la confirmación del pedido.',
        'Reserva mínima de 1.500€ necesaria para confirmar el pedido. No reembolsable una vez iniciada la producción.',
        'Este presupuesto tiene una validez de 30 días naturales desde la fecha de emisión.',
    ],
    internacional: [
        'Precios sin impuestos locales del país de destino. Consultar fiscalidad aplicable.',
        'Transporte internacional no incluido — presupuesto de envío bajo demanda.',
        'Plazo estimado de entrega: 12-20 semanas desde la confirmación del pedido.',
        'Reserva mínima de 3.000€ necesaria para confirmar el pedido.',
        'Este presupuesto tiene una validez de 30 días naturales desde la fecha de emisión.',
    ],
};

// ── Print View Component ────────────────────────────────────
const BudgetPrintView = ({ open, onOpenChange, data, legalTexts }: BudgetPrintViewProps) => {

    if (!data) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleEmail = async () => {
        // 1. Generate PDF from the print document
        const printDoc = document.getElementById('budget-print-document');
        if (printDoc) {
            try {
                const html2canvas = (await import('html2canvas')).default;
                const { jsPDF } = await import('jspdf');

                const canvas = await html2canvas(printDoc, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#FFFFFF',
                });

                const imgWidth = 210; // A4 width in mm
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                const pdf = new jsPDF('p', 'mm', 'a4');
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
                pdf.save(`Presupuesto_${data.budgetCode}.pdf`);
            } catch (err) {
                console.error('Error generating PDF:', err);
            }
        }

        // 2. Build a nice email body
        const firstName = data.clientName?.split(' ')[0] || data.clientName || '';
        const totalFormatted = data.total?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const bodyText = [
            `Hola ${firstName},`,
            ``,
            `¡Muchas gracias por tu interés en Nomade Nation!`,
            ``,
            `Adjunto encontrarás tu presupuesto personalizado con todos los detalles de tu camper:`,
            `PRESUPUESTO: ${data.budgetCode}`,
            `🚐  MODELO: ${data.modelName}`,
            `⚙️  MOTOR: ${data.engineName}`,
            data.packName ? `📦  PACK: ${data.packName}` : '',
            `TOTAL: ${totalFormatted} €`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            `Si tienes cualquier duda o quieres hacer algún cambio, no dudes en escribirnos. Estamos aquí para ayudarte a crear la camper de tus sueños.`,
            ``,
            `¡Seguimos en contacto!`,
            `Un saludo,`,
            `El equipo de Nomade Nation`,
        ].filter(Boolean).join('\n');

        // 3. Open Gmail compose in a new tab (uses the browser's logged-in Google session)
        const to = encodeURIComponent(data.clientEmail || '');
        const subject = encodeURIComponent(`Presupuesto ${data.budgetCode} de Nomade Nation`);
        const body = encodeURIComponent(bodyText);
        window.open(
            `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`,
            '_blank'
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[900px] max-h-[95vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl bg-white gap-0 print-dialog-root">

                {/* ── Action Bar (hidden on print) ──── */}
                <div className="flex justify-between items-center px-5 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB] print-hide shrink-0">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="gap-2 rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-white text-xs font-bold uppercase tracking-wider h-9 px-4"
                        >
                            <Printer className="w-4 h-4" /> Imprimir / PDF
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEmail}
                            className="gap-2 rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-white text-xs font-bold uppercase tracking-wider h-9 px-4"
                        >
                            <Mail className="w-4 h-4" /> Enviar por Email
                        </Button>
                    </div>
                </div>

                {/* ── Print Styles (High-Quality A4) ── */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        /* ── Page setup ── */
                        @page {
                            size: A4 portrait;
                            margin: 0;
                        }

                        /* ── Reset everything outside the document ── */
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            background: white !important;
                            overflow: visible !important;
                            width: 210mm !important;
                            height: 297mm !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        /* ── Hide everything except our print document ── */
                        #root,
                        #app-header,
                        aside,
                        header,
                        nav,
                        .print-hidden,
                        .print-hide {
                            display: none !important;
                        }

                        /* ── Radix overlay — hide the backdrop ── */
                        [data-radix-portal] > div:first-child {
                            display: none !important;
                            background: transparent !important;
                        }

                        /* ── Dialog container → full-page print layout ── */
                        div[role="dialog"].print-dialog-root,
                        .print-dialog-root {
                            position: fixed !important;
                            inset: 0 !important;
                            width: 210mm !important;
                            height: 297mm !important;
                            max-width: 210mm !important;
                            max-height: 297mm !important;
                            transform: none !important;
                            border: none !important;
                            border-radius: 0 !important;
                            box-shadow: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            background: white !important;
                            overflow: visible !important;
                            display: block !important;
                        }

                        /* ── The scrollable wrapper → no scroll, full visible ── */
                        .print-scroll-container {
                            overflow: visible !important;
                            height: auto !important;
                            max-height: none !important;
                        }

                        /* ── The PDF document itself ── */
                        #budget-print-document {
                            width: 210mm !important;
                            min-height: 297mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            overflow: visible !important;
                            display: flex !important;
                            flex-direction: column !important;
                            /* NO transform scale — native resolution for max quality */
                        }

                        /* ── Force exact color reproduction ── */
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        /* ── Images: max quality ── */
                        #budget-print-document img {
                            image-rendering: -webkit-optimize-contrast !important;
                            image-rendering: high-quality !important;
                        }

                        /* ── Hero: proportional height ── */
                        #budget-print-document .print-hero {
                            height: 28mm !important;
                            min-height: 28mm !important;
                            max-height: 28mm !important;
                            flex-shrink: 0 !important;
                        }

                        /* ── Header ── */
                        #budget-print-document .print-header {
                            padding: 0 8mm !important;
                            margin-top: -3mm !important;
                            padding-bottom: 1mm !important;
                            flex-shrink: 0 !important;
                        }
                        #budget-print-document .print-header img {
                            height: 10mm !important;
                        }
                        #budget-print-document .print-header h2 {
                            font-size: 20pt !important;
                        }

                        /* ── Content area: fills remaining space ── */
                        #budget-print-document .print-content {
                            padding: 3mm 8mm 4mm 8mm !important;
                            flex: 1 !important;
                            display: flex !important;
                            flex-direction: column !important;
                            justify-content: space-between !important;
                            gap: 0 !important;
                        }

                        /* ── Client/project info ── */
                        #budget-print-document .print-info-box {
                            flex-shrink: 0 !important;
                        }
                        #budget-print-document .print-info-box > div {
                            padding: 2.5mm 4mm !important;
                        }
                        #budget-print-document .print-info-box p,
                        #budget-print-document .print-info-box span,
                        #budget-print-document .print-info-box strong {
                            font-size: 8pt !important;
                            line-height: 1.3 !important;
                        }
                        #budget-print-document .print-info-box .text-lg {
                            font-size: 10pt !important;
                        }
                        #budget-print-document .print-info-box .text-\\[10px\\] {
                            font-size: 7pt !important;
                        }

                        /* ── Table ── */
                        #budget-print-document table {
                            flex-shrink: 0 !important;
                            font-size: 8pt !important;
                        }
                        #budget-print-document table th {
                            font-size: 7pt !important;
                            padding-top: 1.5mm !important;
                            padding-bottom: 1.5mm !important;
                        }
                        #budget-print-document table td {
                            padding-top: 1.5mm !important;
                            padding-bottom: 1.5mm !important;
                            font-size: 8pt !important;
                        }
                        #budget-print-document table .text-\\[11px\\] {
                            font-size: 7pt !important;
                        }
                        #budget-print-document table .text-\\[10px\\] {
                            font-size: 6.5pt !important;
                        }

                        /* ── Sub-items (pack includes) ── */
                        #budget-print-document .grid.grid-cols-2 {
                            gap: 0.5mm 3mm !important;
                        }

                        /* ── Signature + Totals side-by-side ── */
                        #budget-print-document .print-signature-totals {
                            flex-shrink: 0 !important;
                            gap: 4mm !important;
                        }
                        #budget-print-document .print-signature .h-24 {
                            height: 12mm !important;
                        }
                        #budget-print-document .print-signature .text-\\[10px\\] {
                            font-size: 6.5pt !important;
                        }

                        /* ── Totals box ── */
                        #budget-print-document .print-totals {
                            font-size: 8pt !important;
                        }
                        #budget-print-document .print-totals .text-2xl {
                            font-size: 14pt !important;
                        }
                        #budget-print-document .print-totals .text-xl {
                            font-size: 12pt !important;
                        }
                        #budget-print-document .print-totals .text-sm {
                            font-size: 8pt !important;
                        }
                        #budget-print-document .print-totals .text-xs,
                        #budget-print-document .print-totals .text-\\[11px\\] {
                            font-size: 7pt !important;
                        }
                        #budget-print-document .print-totals > div {
                            padding: 2mm 4mm !important;
                        }

                        /* ── Legal text ── */
                        #budget-print-document .print-legal {
                            padding-top: 2mm !important;
                            flex-shrink: 0 !important;
                        }
                        #budget-print-document .print-legal .text-\\[10px\\] {
                            font-size: 6.5pt !important;
                            line-height: 1.3 !important;
                        }
                        #budget-print-document .print-legal .space-y-1\\.5 {
                            gap: 0.5mm !important;
                        }
                        #budget-print-document .print-legal .mb-3 {
                            margin-bottom: 1mm !important;
                        }

                        /* ── Footer ── */
                        #budget-print-document .print-footer {
                            padding-top: 2mm !important;
                            flex-shrink: 0 !important;
                        }
                        #budget-print-document .print-footer img {
                            height: 4mm !important;
                        }
                        #budget-print-document .print-footer .text-\\[10px\\] {
                            font-size: 6.5pt !important;
                        }
                        #budget-print-document .print-footer .text-\\[9px\\] {
                            font-size: 6pt !important;
                        }
                    }
                    `
                }} />

                {/* ── Document ───────────────────────── */}
                <div className="print-scroll-container flex-1 overflow-y-auto bg-white">
                    <div
                        id="budget-print-document"
                        className="w-full text-[#1A1A1A] font-sans bg-white flex flex-col"
                    >

                        {/* ━━ HERO BANNER ━━━━━━━━━━━━━━━━ */}
                        <div className="print-hero relative w-full h-[200px] overflow-hidden flex-shrink-0">
                            <img
                                src="/lovable-uploads/Nomade-Budget.png"
                                alt="Nomade Camper"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        </div>

                        {/* ━━ HEADER: Logo + Budget Code ━━ */}
                        <div className="print-header px-10 pt-0 pb-2 -mt-5 relative z-10 flex-shrink-0">
                            <div className="flex justify-between items-end">
                                <div className="bg-white px-4 py-2 rounded-xl shadow-md border border-[#E5E7EB]/50">
                                    <img
                                        src="/lovable-uploads/logo.png"
                                        alt="Nomade Nation"
                                        className="h-12 w-auto"
                                    />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold tracking-[0.25em] text-[#9CA3AF] uppercase">Presupuesto</p>
                                    <h2 className="text-3xl font-black text-[#C59D5F] tracking-tight mt-0.5">
                                        {data.budgetCode}
                                    </h2>
                                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">{data.date}</p>
                                </div>
                            </div>
                        </div>

                        {/* ━━ CONTENT ━━━━━━━━━━━━━━━━━━━━ */}
                        <div className="print-content px-10 pb-10 space-y-6 flex-1 flex flex-col">

                            {/* ── Client + Project Info Box ── */}
                            <div className="print-info-box grid grid-cols-2 gap-0 rounded-xl overflow-hidden border border-[#E5E7EB] flex-shrink-0">
                                <div className="bg-[#F8F9FA] p-6 border-r border-[#E5E7EB]">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9CA3AF] mb-3">Cliente</p>
                                    <p className="font-bold text-lg text-[#1A1A1A]">{data.clientName}</p>
                                    <p className="text-sm text-[#6B7280] mt-0.5">{data.clientEmail}</p>
                                    <p className="text-sm text-[#6B7280]">{data.clientPhone}</p>
                                </div>
                                <div className="bg-[#F8F9FA] p-6">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9CA3AF] mb-3">Detalles del Proyecto</p>
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex gap-2">
                                            <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] w-16 pt-0.5">Modelo:</span>
                                            <strong className="text-[#1A1A1A]">{data.modelName}</strong>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] w-16 pt-0.5">Motor:</span>
                                            <strong className="text-[#1A1A1A]">{data.engineName}</strong>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] w-16 pt-0.5">Pack:</span>
                                            <strong className="text-[#1A1A1A]">{data.packName || '–'}</strong>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] w-16 pt-0.5">Interior:</span>
                                            <strong className="text-[#1A1A1A]">{data.interiorColorName || '–'}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Line Items Table ────────── */}
                            <div className="flex-shrink-0">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[10px] uppercase font-bold tracking-[0.1em] text-[#9CA3AF] border-b-2 border-[#E5E7EB]">
                                            <th className="py-3 font-bold">Concepto</th>
                                            <th className="py-3 text-center font-bold w-16">Cant.</th>
                                            <th className="py-3 text-right font-bold w-28">Precio Un.</th>
                                            <th className="py-3 text-right font-bold w-28">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F3F4F6]">
                                        {data.lineItems.map((item, idx) => (
                                            <React.Fragment key={idx}>
                                                <tr
                                                    className={`${item.isDiscount
                                                        ? 'text-emerald-600 italic'
                                                        : item.isCustom
                                                            ? 'text-[#6B7280]'
                                                            : ''
                                                        }`}
                                                >
                                                    <td className="py-4">
                                                        <p className={item.isDiscount ? '' : 'font-semibold'}>
                                                            {item.name}
                                                        </p>
                                                        {item.subtitle && (
                                                            <p className="text-[11px] text-[#9CA3AF] mt-0.5">{item.subtitle}</p>
                                                        )}
                                                    </td>
                                                    <td className="text-center tabular-nums">{item.quantity}</td>
                                                    <td className="text-right tabular-nums">{fmt(item.unitPrice)} €</td>
                                                    <td className="text-right tabular-nums font-bold">{fmt(item.total)} €</td>
                                                </tr>
                                                {/* Sub-items (pack components, etc.) */}
                                                {item.subItems && item.subItems.length > 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="pb-3 pt-0 px-0">
                                                            <div className="ml-4 pl-3 border-l-2 border-[#E8734A]/20 py-1">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                                                                    Incluye:
                                                                </p>
                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                                                    {item.subItems.map((sub, sidx) => (
                                                                        <div key={sidx} className="flex items-center gap-1.5">
                                                                            <div className="w-1 h-1 rounded-full bg-[#E8734A]/40 flex-shrink-0" />
                                                                            <span className="text-[10px] text-[#6B7280]">{sub}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Signature + Totals (side by side) ── */}
                            <div className="print-signature-totals flex gap-8 items-end flex-shrink-0">
                                {/* Client Signature — left side */}
                                <div className="print-signature flex-1 space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9CA3AF]">
                                        Firma conformidad del cliente
                                    </p>
                                    <div className="h-24 border-b-2 border-[#CBD5E1] w-full" />
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-[#9CA3AF]">{data.clientName}</p>
                                            <p className="text-[10px] text-[#CBD5E1]">DNI/NIE: ___________________</p>
                                        </div>
                                        <p className="text-[10px] text-[#CBD5E1]">Fecha: ________________</p>
                                    </div>
                                </div>

                                {/* Totals Box — right side */}
                                <div className="print-totals w-[400px] flex-shrink-0 space-y-0 rounded-xl overflow-hidden border border-[#E5E7EB]">
                                    {/* Subtotal area */}
                                    <div className="bg-[#F8F9FA] px-6 py-4 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[#9CA3AF]">Suma de los conceptos (PVP)</span>
                                            <span className="font-bold tabular-nums">{fmt(data.subtotal)} €</span>
                                        </div>
                                        {data.discountPercentage != null && data.discountPercentage > 0 && (
                                            <div className="flex justify-between text-sm text-emerald-600 italic">
                                                <span>Dto. {data.discountPercentage}%</span>
                                                <span className="font-bold tabular-nums">-{fmt(data.discountPercentAmount || 0)} €</span>
                                            </div>
                                        )}
                                        {data.discountFixed != null && data.discountFixed > 0 && (
                                            <div className="flex justify-between text-sm text-emerald-600 italic">
                                                <span>Dto. fijo</span>
                                                <span className="font-bold tabular-nums">-{fmt(data.discountFixed)} €</span>
                                            </div>
                                        )}

                                        <Separator className="bg-[#E5E7EB] my-1" />

                                        <div className="flex justify-between text-xs">
                                            <span className="text-[#9CA3AF]">Precio base</span>
                                            <span className="font-medium tabular-nums">{fmt(data.total / (1 + (data.ivaRate / 100)))} €</span>
                                        </div>
                                        {data.location !== 'internacional' && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-[#9CA3AF]">
                                                    IVA ({data.ivaRate}%)
                                                </span>
                                                <span className="font-medium tabular-nums">{fmt(data.total - (data.total / (1 + (data.ivaRate / 100))))} €</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Total highlight */}
                                    <div className="bg-[#F3F4F6] px-6 py-3 flex justify-between items-center border-t border-[#E5E7EB]">
                                        <span className="text-[#6B7280] font-semibold text-xs uppercase tracking-[0.15em]">
                                            Precio Total
                                        </span>
                                        <span className="text-lg font-bold text-[#E8734A] tabular-nums">
                                            {fmt(data.total)} €
                                        </span>
                                    </div>

                                    {/* IEDMT if peninsula or canarias */}
                                    {data.location !== 'internacional' && data.iedmt != null && data.iedmt > 0 && (
                                        <div className="bg-[#F8F9FA] px-6 py-3 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[#9CA3AF]">+IEDMT</span>
                                                <span className="font-bold tabular-nums">{fmt(data.iedmt)} €</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-gradient-to-r from-[#2C3E50] to-[#34495E] -mx-6 px-6 py-3 mt-2">
                                                <span className="text-white font-bold text-sm uppercase tracking-wider">Total + IEDMT</span>
                                                <span className="text-2xl font-black text-[#C59D5F] tabular-nums">
                                                    {fmt(data.totalWithIedmt || data.total)} €
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Reservation if present */}
                                    {data.reservationAmount != null && data.reservationAmount > 0 && (
                                        <div className="bg-[#F8F9FA] px-6 py-3 border-t border-dashed border-[#E5E7EB] space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[#9CA3AF]">Reserva pagada</span>
                                                <span className="font-bold text-emerald-600 tabular-nums">-{fmt(data.reservationAmount)} €</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E8734A]">Pendiente de Pago</span>
                                                <span className="text-xl font-black text-[#E8734A] tabular-nums">
                                                    {fmt((data.totalWithIedmt || data.total) - data.reservationAmount)} €
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Legal Text (location-dependent) ──── */}
                            <div className="print-legal pt-4 border-t border-[#E5E7EB] flex-shrink-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#374151] mb-3">
                                    Condiciones Generales
                                </p>
                                <div className="space-y-1.5">
                                    {(legalTexts && legalTexts.length > 0 ? legalTexts : locationLegalTexts[data.location]).map((text, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-[#CBD5E1] mt-1.5 flex-shrink-0" />
                                            <p className="text-[10px] text-[#6B7280] leading-relaxed">{text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Footer ──────────────────── */}
                            <div className="print-footer pt-6 text-center space-y-1 flex-shrink-0 mt-auto">
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    <div className="h-px bg-[#E5E7EB] flex-1" />
                                    <img src="/lovable-uploads/logo.png" alt="Nomade" className="h-5 w-auto opacity-30" />
                                    <div className="h-px bg-[#E5E7EB] flex-1" />
                                </div>
                                <p className="text-[10px] text-[#9CA3AF]">
                                    Nomade Vans S.L. · CIF: B09622879 · info@nomade-nation.com
                                </p>
                                <p className="text-[9px] text-[#CBD5E1]">
                                    © {new Date().getFullYear()} Nomade Vans S.L. — Todos los derechos reservados
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BudgetPrintView;
export type { BudgetPrintData, LineItem, Location };
