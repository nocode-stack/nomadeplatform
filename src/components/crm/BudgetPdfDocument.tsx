import React from 'react';
import {
    Document,
    Page,
    View,
    Text,
    Image,
    StyleSheet,
    Font,
    pdf,
} from '@react-pdf/renderer';

// ── Types (shared with BudgetPrintView) ────────────────────
export type Location = 'peninsula' | 'canarias' | 'internacional';

export interface LineItem {
    name: string;
    subtitle?: string;
    quantity: number;
    unitPrice: number;
    total: number;
    isDiscount?: boolean;
    isCustom?: boolean;
    subItems?: string[];
}

export interface BudgetPdfData {
    budgetCode: string;
    date: string;
    location: Location;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    modelName: string;
    engineName: string;
    interiorColorName: string;
    packName: string;
    lineItems: LineItem[];
    subtotal: number;
    discountPercentage?: number;
    discountPercentAmount?: number;
    discountPercentLabel?: string;
    discountFixed?: number;
    discountFixedLabel?: string;
    ivaRate: number;
    ivaAmount: number;
    total: number;
    iedmt?: number;
    totalWithIedmt?: number;
    reservationAmount?: number;
    /** Legal texts from DB; when provided, overrides the hardcoded locationLegalTexts */
    legalTexts?: string[];
    /** Pre-converted hero image data URL (PNG/JPG base64). If provided, used instead of default. */
    heroImageDataUrl?: string;
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

// ── Colors ─────────────────────────────────────────────────
const C = {
    dark: '#2C3E50',
    darkAlt: '#34495E',
    darkGray: '#4A5568',
    gold: '#C59D5F',
    orange: '#E8734A',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textLight: '#CBD5E1',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    bg: '#F8F9FA',
    bgAlt: '#F3F4F6',
    white: '#FFFFFF',
    emerald: '#059669',
    emeraldLight: '#D1FAE5',
};

// ── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: C.text,
        backgroundColor: C.white,
        paddingTop: 20,
        paddingBottom: 0,
    },
    // Hero
    heroContainer: {
        width: '100%',
        height: 160,
        position: 'relative',
        overflow: 'hidden',
        marginTop: -20,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center bottom',
    },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 24,
        marginTop: -12,
        paddingBottom: 4,
    },
    logoBox: {
        backgroundColor: C.white,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: C.border,
    },
    logo: {
        height: 28,
        width: 100,
    },
    headerRight: {
        textAlign: 'right',
        alignItems: 'flex-end',
    },
    headerLabelBadge: {
        backgroundColor: C.dark,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 4,
        marginBottom: 3,
    },
    headerLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 3,
        color: C.gold,
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    headerCode: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: C.gold,
        marginTop: 1,
    },
    headerDate: {
        fontSize: 7,
        color: C.textMuted,
        marginTop: 1,
    },
    // Content
    content: {
        paddingHorizontal: 24,
        paddingTop: 12,
        flexGrow: 1,
    },
    // Info box
    infoBox: {
        flexDirection: 'row',
        borderWidth: 0.5,
        borderColor: C.border,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 14,
    },
    infoColumn: {
        flex: 1,
        backgroundColor: C.bg,
        padding: 14,
    },
    infoColumnLeft: {
        borderRightWidth: 0.5,
        borderRightColor: C.border,
    },
    infoLabel: {
        fontSize: 6,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 1,
        color: C.textMuted,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    infoClientName: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: C.text,
        marginBottom: 2,
    },
    infoText: {
        fontSize: 8,
        color: C.textSecondary,
        marginTop: 1,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 3,
    },
    infoRowLabel: {
        fontSize: 6,
        letterSpacing: 0.5,
        color: C.textMuted,
        textTransform: 'uppercase',
        width: 36,
        paddingTop: 1,
    },
    infoRowValue: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: C.text,
    },
    // Table
    table: {
        marginBottom: 14,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1.5,
        borderBottomColor: C.border,
        paddingBottom: 5,
        marginBottom: 2,
    },
    th: {
        fontSize: 6,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 0.8,
        color: C.textMuted,
        textTransform: 'uppercase',
    },
    thName: { flex: 1 },
    thQty: { width: 40, textAlign: 'center' },
    thPrice: { width: 65, textAlign: 'right' },
    thTotal: { width: 65, textAlign: 'right' },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: C.borderLight,
        paddingVertical: 5,
        alignItems: 'center',
    },
    tableRowDiscount: {
        color: C.emerald,
        fontStyle: 'italic',
    },
    tableRowCustom: {
        color: C.textSecondary,
    },
    tdName: { flex: 1 },
    tdQty: { width: 40, textAlign: 'center', fontSize: 8 },
    tdPrice: { width: 65, textAlign: 'right', fontSize: 8 },
    tdTotal: { width: 65, textAlign: 'right', fontSize: 8, fontFamily: 'Helvetica-Bold' },
    tdItemName: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
    },
    tdItemNameDiscount: {
        fontSize: 8,
    },
    tdSubtitle: {
        fontSize: 7,
        color: C.textMuted,
        marginTop: 1,
    },
    // Sub-items
    subItemsContainer: {
        marginLeft: 12,
        paddingLeft: 8,
        borderLeftWidth: 1.5,
        borderLeftColor: 'rgba(232,115,74,0.2)',
        paddingVertical: 3,
        marginBottom: 4,
    },
    subItemsLabel: {
        fontSize: 6,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 0.5,
        color: C.textMuted,
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    subItemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    subItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        width: '50%',
        marginBottom: 1,
    },
    subItemDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(232,115,74,0.4)',
    },
    subItemText: {
        fontSize: 6.5,
        color: C.textSecondary,
    },
    // Signature + Totals
    signatureTotals: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'flex-end',
        marginBottom: 14,
    },
    // Signature
    signatureSection: {
        flex: 1,
    },
    signatureLabel: {
        fontSize: 6,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 1,
        color: C.textMuted,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    signatureLine: {
        height: 40,
        borderBottomWidth: 1.5,
        borderBottomColor: C.textLight,
        marginBottom: 4,
    },
    signatureFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureText: {
        fontSize: 6.5,
        color: C.textMuted,
    },
    signatureTextLight: {
        fontSize: 6.5,
        color: C.textLight,
    },
    // Totals box
    totalsBox: {
        width: 210,
        borderWidth: 0.5,
        borderColor: C.border,
        borderRadius: 8,
        overflow: 'hidden',
    },
    totalsArea: {
        backgroundColor: C.bg,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    totalsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    totalsLabel: {
        fontSize: 7.5,
        color: C.textMuted,
    },
    totalsValue: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
    },
    totalsDiscountLabel: {
        fontSize: 7.5,
        color: C.emerald,
        fontStyle: 'italic',
    },
    totalsDiscountValue: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        color: C.emerald,
    },
    totalsSeparator: {
        height: 0.5,
        backgroundColor: C.border,
        marginVertical: 4,
    },
    totalsSmallLabel: {
        fontSize: 7,
        color: C.textMuted,
    },
    totalsSmallValue: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
    },
    // Total highlight
    totalHighlight: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: C.bgAlt,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderTopWidth: 0.5,
        borderTopColor: C.border,
    },
    totalHighlightLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: C.textSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    totalHighlightValue: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: C.orange,
    },
    // IEDMT
    iedmtArea: {
        backgroundColor: C.bg,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    iedmtTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: C.dark,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginHorizontal: -14,
        marginTop: 6,
        marginBottom: -8,
    },
    iedmtTotalLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: C.white,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    iedmtTotalValue: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: C.gold,
    },
    // Reservation
    reservationArea: {
        backgroundColor: C.bg,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderTopWidth: 0.5,
        borderTopColor: C.border,
        borderTopStyle: 'dashed',
    },
    reservationPendingLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 0.5,
        color: C.orange,
        textTransform: 'uppercase',
    },
    reservationPendingValue: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        color: C.orange,
    },
    // Legal
    legalSection: {
        borderTopWidth: 0.5,
        borderTopColor: C.border,
        paddingTop: 8,
        marginBottom: 10,
    },
    legalTitle: {
        fontSize: 6,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 1,
        color: '#374151',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    legalRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
        marginBottom: 2,
    },
    legalDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: C.textLight,
        marginTop: 3,
    },
    legalText: {
        fontSize: 6.5,
        color: C.textSecondary,
        lineHeight: 1.4,
        flex: 1,
    },
    // Footer
    footer: {
        textAlign: 'center',
        paddingTop: 8,
        marginTop: 'auto',
        paddingBottom: 12,
    },
    footerDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        paddingHorizontal: 24,
    },
    footerLine: {
        flex: 1,
        height: 0.5,
        backgroundColor: C.border,
    },
    footerLogo: {
        height: 12,
        width: 44,
        opacity: 0.3,
        marginHorizontal: 8,
    },
    footerText: {
        fontSize: 6.5,
        color: C.textMuted,
        textAlign: 'center',
    },
    footerCopyright: {
        fontSize: 6,
        color: C.textLight,
        textAlign: 'center',
        marginTop: 2,
    },
});

// ── Resolve image paths to absolute URLs ───────────────────
function resolveImageUrl(path: string): string {
    // If already absolute URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }
    // Construct absolute URL from the current origin
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Convert any image (including WebP) to a PNG data URL via Canvas.
 * This is needed because @react-pdf/renderer does not support WebP.
 */
async function convertImageToPngDataUrl(src: string): Promise<string> {
    const url = resolveImageUrl(src);
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
}

const HERO_IMAGE_PATH = '/lovable-uploads/Nomade-Budget.png';

// ── PDF Document Component ─────────────────────────────────
const BudgetPdfDocument: React.FC<{ data: BudgetPdfData }> = ({ data }) => {
    const legalItems = data.legalTexts && data.legalTexts.length > 0
        ? data.legalTexts
        : locationLegalTexts[data.location];

    const heroUrl = data.heroImageDataUrl || resolveImageUrl(HERO_IMAGE_PATH);
    const logoUrl = resolveImageUrl('/lovable-uploads/logo.png');

    return (
        <Document>
            <Page size="A4" style={s.page}>
                {/* ━━ HERO BANNER ━━━━━━━━━━━━━━━━ */}
                <View style={s.heroContainer}>
                    <Image src={heroUrl} style={s.heroImage} />
                </View>

                {/* ━━ HEADER: Logo + Budget Code ━━ */}
                <View style={s.header}>
                    <View style={s.logoBox}>
                        <Image src={logoUrl} style={s.logo} />
                    </View>
                    <View style={s.headerRight}>
                        <View style={s.headerLabelBadge}>
                            <Text style={s.headerLabel}>Presupuesto</Text>
                        </View>
                        <Text style={s.headerCode}>{data.budgetCode}</Text>
                        <Text style={s.headerDate}>{data.date}</Text>
                    </View>
                </View>

                {/* ━━ CONTENT ━━━━━━━━━━━━━━━━━━━━ */}
                <View style={s.content}>

                    {/* ── Client + Project Info Box ── */}
                    <View style={s.infoBox}>
                        <View style={[s.infoColumn, s.infoColumnLeft]}>
                            <Text style={s.infoLabel}>Cliente</Text>
                            <Text style={s.infoClientName}>{data.clientName}</Text>
                            <Text style={s.infoText}>{data.clientEmail}</Text>
                            <Text style={s.infoText}>{data.clientPhone}</Text>
                        </View>
                        <View style={s.infoColumn}>
                            <Text style={s.infoLabel}>Detalles del Proyecto</Text>
                            <View style={s.infoRow}>
                                <Text style={s.infoRowLabel}>Modelo:</Text>
                                <Text style={s.infoRowValue}>{data.modelName}</Text>
                            </View>
                            <View style={s.infoRow}>
                                <Text style={s.infoRowLabel}>Motor:</Text>
                                <Text style={s.infoRowValue}>{data.engineName}</Text>
                            </View>
                            <View style={s.infoRow}>
                                <Text style={s.infoRowLabel}>Pack:</Text>
                                <Text style={s.infoRowValue}>{data.packName || '–'}</Text>
                            </View>
                            <View style={s.infoRow}>
                                <Text style={s.infoRowLabel}>Interior:</Text>
                                <Text style={s.infoRowValue}>{data.interiorColorName || '–'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Line Items Table ────────── */}
                    <View style={s.table}>
                        {/* Header */}
                        <View style={s.tableHeader}>
                            <Text style={[s.th, s.thName]}>Concepto</Text>
                            <Text style={[s.th, s.thQty]}>Cant.</Text>
                            <Text style={[s.th, s.thPrice]}>Precio Un.</Text>
                            <Text style={[s.th, s.thTotal]}>Total</Text>
                        </View>
                        {/* Rows */}
                        {data.lineItems.map((item, idx) => (
                            <View key={idx} wrap={false}>
                                <View style={[
                                    s.tableRow,
                                    item.isDiscount ? s.tableRowDiscount : {},
                                    item.isCustom ? s.tableRowCustom : {},
                                ]}>
                                    <View style={s.tdName}>
                                        <Text style={item.isDiscount ? s.tdItemNameDiscount : s.tdItemName}>
                                            {item.name}
                                        </Text>
                                        {item.subtitle && (
                                            <Text style={s.tdSubtitle}>{item.subtitle}</Text>
                                        )}
                                    </View>
                                    <Text style={[s.tdQty, item.isDiscount ? { color: C.emerald } : {}]}>
                                        {item.quantity}
                                    </Text>
                                    <Text style={[s.tdPrice, item.isDiscount ? { color: C.emerald } : {}]}>
                                        {fmt(item.unitPrice)} €
                                    </Text>
                                    <Text style={[s.tdTotal, item.isDiscount ? { color: C.emerald } : {}]}>
                                        {fmt(item.total)} €
                                    </Text>
                                </View>
                                {/* Sub-items */}
                                {item.subItems && item.subItems.length > 0 && (
                                    <View style={s.subItemsContainer}>
                                        <Text style={s.subItemsLabel}>Incluye:</Text>
                                        <View style={s.subItemsGrid}>
                                            {item.subItems.map((sub, sidx) => (
                                                <View key={sidx} style={s.subItemRow}>
                                                    <View style={s.subItemDot} />
                                                    <Text style={s.subItemText}>{sub}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>

                    {/* ── Signature + Totals + Legal (kept together on same page) ── */}
                    <View wrap={false}>
                        <View style={s.signatureTotals}>
                            {/* Client Signature */}
                            <View style={s.signatureSection}>
                                <Text style={s.signatureLabel}>
                                    Firma conformidad del cliente
                                </Text>
                                <View style={s.signatureLine} />
                                <View style={s.signatureFooter}>
                                    <View>
                                        <Text style={s.signatureText}>{data.clientName}</Text>
                                        <Text style={s.signatureTextLight}>DNI/NIE: ___________________</Text>
                                    </View>
                                    <Text style={s.signatureTextLight}>Fecha: ________________</Text>
                                </View>
                            </View>

                            {/* Totals Box */}
                            <View style={s.totalsBox}>
                                <View style={s.totalsArea}>
                                    {/* Subtotal */}
                                    <View style={s.totalsRow}>
                                        <Text style={s.totalsLabel}>Suma de los conceptos (PVP)</Text>
                                        <Text style={s.totalsValue}>{fmt(data.subtotal)} €</Text>
                                    </View>
                                    {/* % Discount */}
                                    {data.discountPercentage != null && data.discountPercentage > 0 && (
                                        <View style={s.totalsRow}>
                                            <Text style={s.totalsDiscountLabel}>
                                                {data.discountPercentLabel
                                                    ? `${data.discountPercentLabel} (${data.discountPercentage}%)`
                                                    : `Dto. ${data.discountPercentage}%`}
                                            </Text>
                                            <Text style={s.totalsDiscountValue}>
                                                -{fmt(data.discountPercentAmount || 0)} €
                                            </Text>
                                        </View>
                                    )}
                                    {/* Fixed Discount */}
                                    {data.discountFixed != null && data.discountFixed > 0 && (
                                        <View style={s.totalsRow}>
                                            <Text style={s.totalsDiscountLabel}>
                                                {data.discountFixedLabel || 'Dto. fijo'}
                                            </Text>
                                            <Text style={s.totalsDiscountValue}>
                                                -{fmt(data.discountFixed)} €
                                            </Text>
                                        </View>
                                    )}

                                    <View style={s.totalsSeparator} />

                                    {/* Base price */}
                                    <View style={s.totalsRow}>
                                        <Text style={s.totalsSmallLabel}>Precio base</Text>
                                        <Text style={s.totalsSmallValue}>
                                            {fmt(data.total / (1 + (data.ivaRate / 100)))} €
                                        </Text>
                                    </View>
                                    {/* IVA */}
                                    {data.location !== 'internacional' && (
                                        <View style={s.totalsRow}>
                                            <Text style={s.totalsSmallLabel}>IVA ({data.ivaRate}%)</Text>
                                            <Text style={s.totalsSmallValue}>
                                                {fmt(data.total - (data.total / (1 + (data.ivaRate / 100))))} €
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Total highlight */}
                                <View style={s.totalHighlight}>
                                    <Text style={s.totalHighlightLabel}>Precio Total</Text>
                                    <Text style={s.totalHighlightValue}>{fmt(data.total)} €</Text>
                                </View>

                                {/* IEDMT */}
                                {data.location !== 'internacional' && data.iedmt != null && data.iedmt > 0 && (
                                    <View style={s.iedmtArea}>
                                        <View style={s.totalsRow}>
                                            <Text style={s.totalsLabel}>+IEDMT</Text>
                                            <Text style={s.totalsValue}>{fmt(data.iedmt)} €</Text>
                                        </View>
                                        <View style={s.iedmtTotal}>
                                            <Text style={s.iedmtTotalLabel}>Total + IEDMT</Text>
                                            <Text style={s.iedmtTotalValue}>
                                                {fmt(data.totalWithIedmt || data.total)} €
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Reservation */}
                                {data.reservationAmount != null && data.reservationAmount > 0 && (
                                    <View style={s.reservationArea}>
                                        <View style={s.totalsRow}>
                                            <Text style={s.totalsLabel}>Reserva pagada</Text>
                                            <Text style={s.totalsDiscountValue}>
                                                -{fmt(data.reservationAmount)} €
                                            </Text>
                                        </View>
                                        <View style={[s.totalsRow, { alignItems: 'center' }]}>
                                            <Text style={s.reservationPendingLabel}>Pendiente de Pago</Text>
                                            <Text style={s.reservationPendingValue}>
                                                {fmt((data.totalWithIedmt || data.total) - data.reservationAmount)} €
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* ── Legal Text ──────────────── */}
                        <View style={s.legalSection}>
                            <Text style={s.legalTitle}>Condiciones Generales</Text>
                            {legalItems.map((text, idx) => (
                                <View key={idx} style={s.legalRow}>
                                    <View style={s.legalDot} />
                                    <Text style={s.legalText}>{text}</Text>
                                </View>
                            ))}
                        </View>
                    </View>{/* end wrap={false} block */}
                </View>

                {/* ── Footer ──────────────────── */}
                <View style={s.footer}>
                    <View style={s.footerDivider}>
                        <View style={s.footerLine} />
                        <Image src={logoUrl} style={s.footerLogo} />
                        <View style={s.footerLine} />
                    </View>
                    <Text style={s.footerText}>
                        Nomade Vans S.L. · CIF: B09622879 · info@nomade-nation.com
                    </Text>
                    <Text style={s.footerCopyright}>
                        © {new Date().getFullYear()} Nomade Vans S.L. — Todos los derechos reservados
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

// ── Helper functions for PDF generation ────────────────────

/**
 * Generate a PDF Blob from budget data.
 * Use this for downloading/saving the PDF.
 */
export async function generateBudgetPdfBlob(data: BudgetPdfData): Promise<Blob> {
    // Pre-convert hero image from WebP to PNG
    if (!data.heroImageDataUrl) {
        try {
            data = { ...data, heroImageDataUrl: await convertImageToPngDataUrl(HERO_IMAGE_PATH) };
        } catch (e) {
            console.warn('Could not convert hero image:', e);
        }
    }
    const doc = <BudgetPdfDocument data={data} />;
    const blob = await pdf(doc).toBlob();
    return blob;
}

/**
 * Generate a base64-encoded PDF string from budget data.
 * Use this for sending via email (Resend attachment).
 */
export async function generateBudgetPdfBase64(data: BudgetPdfData): Promise<string> {
    // Pre-convert hero image from WebP to PNG
    if (!data.heroImageDataUrl) {
        try {
            data = { ...data, heroImageDataUrl: await convertImageToPngDataUrl(HERO_IMAGE_PATH) };
        } catch (e) {
            console.warn('Could not convert hero image:', e);
        }
    }
    const doc = <BudgetPdfDocument data={data} />;
    const blob = await pdf(doc).toBlob();
    // Convert blob to base64
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

export default BudgetPdfDocument;
