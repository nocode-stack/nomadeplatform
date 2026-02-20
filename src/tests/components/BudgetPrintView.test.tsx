import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BudgetPrintView from '../../components/crm/BudgetPrintView';
import type { BudgetPrintData } from '../../components/crm/BudgetPrintView';

// ── UI mocks ───────────────────────────────────────────────
vi.mock('../../components/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="print-dialog">{children}</div> : null,
    DialogContent: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

// ── Helper: base mock data ─────────────────────────────────
const createMockPrintData = (overrides?: Partial<BudgetPrintData>): BudgetPrintData => ({
    budgetCode: 'NV-2026-001',
    date: '19 de febrero de 2026',
    location: 'peninsula',
    clientName: 'Juan García',
    clientEmail: 'juan@test.com',
    clientPhone: '+34 600 123 456',
    modelName: 'Neo S',
    engineName: 'Diesel 180cv',
    interiorColorName: 'Madera Natural',
    packName: 'Pack Adventure',
    lineItems: [
        { name: 'Pack Adventure', quantity: 1, unitPrice: 3500, total: 3500 },
        { name: 'Toldo lateral', quantity: 1, unitPrice: 800, total: 800 },
    ],
    subtotal: 52000,
    ivaRate: 21,
    ivaAmount: 7157.02,
    total: 48200,
    iedmt: 2289,
    totalWithIedmt: 50489,
    ...overrides,
});

describe('BudgetPrintView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Rendering ────────────────────────────────────────
    it('should not render when data is null', () => {
        render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={null} />);
        expect(screen.queryByTestId('print-dialog')).not.toBeInTheDocument();
    });

    it('should not render when open is false', () => {
        render(<BudgetPrintView open={false} onOpenChange={vi.fn()} data={createMockPrintData()} />);
        expect(screen.queryByTestId('print-dialog')).not.toBeInTheDocument();
    });

    it('should render when open and data are provided', () => {
        render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={createMockPrintData()} />);
        expect(screen.getByTestId('print-dialog')).toBeInTheDocument();
    });

    // ── Header and client info ───────────────────────────
    it('should display budget code', () => {
        render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={createMockPrintData()} />);
        expect(screen.getByText('NV-2026-001')).toBeInTheDocument();
    });

    it('should display client name', () => {
        render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={createMockPrintData()} />);
        // Client name appears in both client info and signature
        const names = screen.getAllByText('Juan García');
        expect(names.length).toBeGreaterThanOrEqual(1);
    });

    it('should display client email and phone', () => {
        render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={createMockPrintData()} />);
        expect(screen.getByText('juan@test.com')).toBeInTheDocument();
        expect(screen.getByText('+34 600 123 456')).toBeInTheDocument();
    });

    it('should display project details (model, engine, pack, interior)', () => {
        render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={createMockPrintData()} />);
        expect(screen.getByText('Neo S')).toBeInTheDocument();
        expect(screen.getByText('Diesel 180cv')).toBeInTheDocument();
        // Pack Adventure appears in both pack detail section AND line items
        const packMentions = screen.getAllByText('Pack Adventure');
        expect(packMentions.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Madera Natural')).toBeInTheDocument();
    });

    // ── Line items ───────────────────────────────────────
    it('should display line items', () => {
        render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={createMockPrintData()} />);
        // Pack Adventure appears in both project details AND line items
        const packMentions = screen.getAllByText('Pack Adventure');
        expect(packMentions.length).toBeGreaterThanOrEqual(2); // at least in details + table
        expect(screen.getByText('Toldo lateral')).toBeInTheDocument();
    });

    it('should render sub-items for pack line items', () => {
        const data = createMockPrintData({
            lineItems: [
                {
                    name: 'Pack Adventure',
                    quantity: 1,
                    unitPrice: 3500,
                    total: 3500,
                    subItems: ['Toldo lateral', 'Ducha exterior', 'Portabicis'],
                },
            ],
        });

        render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);

        expect(screen.getByText('Incluye:')).toBeInTheDocument();
        expect(screen.getByText('Toldo lateral')).toBeInTheDocument();
        expect(screen.getByText('Ducha exterior')).toBeInTheDocument();
        expect(screen.getByText('Portabicis')).toBeInTheDocument();
    });

    it('should NOT render "Incluye:" when there are no sub-items', () => {
        const data = createMockPrintData({
            lineItems: [
                { name: 'Simple item', quantity: 1, unitPrice: 100, total: 100 },
            ],
        });

        render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);

        expect(screen.queryByText('Incluye:')).not.toBeInTheDocument();
    });

    // ── Discounts in print view ─────────────────────────
    describe('Discount display', () => {
        it('should display percentage discount when present', () => {
            const data = createMockPrintData({
                discountPercentage: 10,
                discountPercentAmount: 5200,
            });

            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);

            expect(screen.getByText('Dto. 10%')).toBeInTheDocument();
        });

        it('should display fixed discount when present', () => {
            const data = createMockPrintData({
                discountFixed: 750,
            });

            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);

            expect(screen.getByText('Dto. fijo')).toBeInTheDocument();
        });

        it('should display both discounts when both are present', () => {
            const data = createMockPrintData({
                discountPercentage: 5,
                discountPercentAmount: 2600,
                discountFixed: 500,
            });

            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);

            expect(screen.getByText('Dto. 5%')).toBeInTheDocument();
            expect(screen.getByText('Dto. fijo')).toBeInTheDocument();
        });

        it('should NOT show discount lines when neither discount is set', () => {
            const data = createMockPrintData({
                discountPercentage: 0,
                discountPercentAmount: 0,
                discountFixed: 0,
            });

            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);

            expect(screen.queryByText(/Dto\./)).not.toBeInTheDocument();
        });

        it('should show subtotal label as "Subtotal (PVP Bruto)"', () => {
            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={createMockPrintData()} />);
            expect(screen.getByText('Subtotal (PVP Bruto)')).toBeInTheDocument();
        });
    });

    // ── Location-specific ────────────────────────────────
    describe('Location-specific rendering', () => {
        it('should show IVA label for peninsula', () => {
            const data = createMockPrintData({ location: 'peninsula', ivaRate: 21 });
            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);
            expect(screen.getByText('IVA (21%)')).toBeInTheDocument();
        });

        it('should show IGIC label for canarias', () => {
            const data = createMockPrintData({ location: 'canarias', ivaRate: 7 });
            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);
            expect(screen.getByText('IGIC (7%)')).toBeInTheDocument();
        });

        it('should show IEDMT section for peninsula', () => {
            const data = createMockPrintData({
                location: 'peninsula',
                iedmt: 2500,
                totalWithIedmt: 55000,
            });
            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);
            expect(screen.getByText('+IEDMT (est.)')).toBeInTheDocument();
            expect(screen.getByText('Total + IEDMT')).toBeInTheDocument();
        });

        it('should NOT show IEDMT for canarias', () => {
            const data = createMockPrintData({
                location: 'canarias',
                iedmt: 0,
            });
            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);
            expect(screen.queryByText('+IEDMT (est.)')).not.toBeInTheDocument();
        });

        it('should show peninsula tax treatment (IVA)', () => {
            const data = createMockPrintData({ location: 'peninsula', ivaRate: 21 });
            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);
            expect(screen.getByText('IVA (21%)')).toBeInTheDocument();
        });

        it('should display Canarias tax treatment (IGIC)', () => {
            const data = createMockPrintData({ location: 'canarias', ivaRate: 7 });
            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);
            expect(screen.getByText('IGIC (7%)')).toBeInTheDocument();
        });
    });

    // ── Signature area ───────────────────────────────────
    describe('Signature area', () => {
        it('should show client signature section', () => {
            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={createMockPrintData()} />);
            expect(screen.getByText('Firma conformidad del cliente')).toBeInTheDocument();
        });

        it('should show DNI/NIE field in signature', () => {
            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={createMockPrintData()} />);
            expect(screen.getByText(/DNI\/NIE/)).toBeInTheDocument();
        });

        it('should NOT show Nomade company signature', () => {
            render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={createMockPrintData()} />);
            expect(screen.queryByText('Firma Nomade Vans S.L.')).not.toBeInTheDocument();
        });
    });

    // ── Action buttons ───────────────────────────────────
    it('should display action buttons (Print and Email)', () => {
        render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={createMockPrintData()} />);
        expect(screen.getByText('Imprimir / PDF')).toBeInTheDocument();
        expect(screen.getByText('Enviar por Email')).toBeInTheDocument();
    });

    // ── Legal text ───────────────────────────────────────
    it('should display legal conditions section', () => {
        render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={createMockPrintData()} />);
        expect(screen.getByText('Condiciones Generales')).toBeInTheDocument();
    });

    // ── Reservation ──────────────────────────────────────
    it('should show reservation amount when present', () => {
        const data = createMockPrintData({
            reservationAmount: 1500,
        });
        render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);
        expect(screen.getByText('Reserva pagada')).toBeInTheDocument();
        expect(screen.getByText('Pendiente de Pago')).toBeInTheDocument();
    });

    it('should NOT show reservation when amount is 0', () => {
        const data = createMockPrintData({
            reservationAmount: 0,
        });
        render(<BudgetPrintView open={true} onOpenChange={vi.fn()} data={data} />);
        expect(screen.queryByText('Reserva pagada')).not.toBeInTheDocument();
    });
});
