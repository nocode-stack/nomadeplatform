
import React, { useMemo } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import ProjectInfoForm from './ProjectInfoForm';
import BudgetItemManager from './BudgetItemManager';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { Separator } from '../ui/separator';
import { Receipt, Percent, Wallet } from 'lucide-react';

import {
    useModelOptions,
    useEngineOptions,
    useExteriorColorOptions,
    useInteriorColorOptions,
    useNewBudgetPacks,
    useElectricSystems
} from '../../hooks/useNewBudgets';
import { calculateBudgetTotal } from '../../utils/pricing';

interface BudgetInfoTabProps {
    form: UseFormReturn<any>;
    disabled?: boolean;
    projectId?: string;
    budgetId?: string;
}

const BudgetInfoTab = ({ form, disabled = false, projectId, budgetId }: BudgetInfoTabProps) => {
    const { data: modelOptions } = useModelOptions();
    const { data: engineOptions } = useEngineOptions();
    const { data: exteriorColorOptions } = useExteriorColorOptions();
    const { data: interiorColorOptions } = useInteriorColorOptions();
    const { data: packOptions } = useNewBudgetPacks();
    const { data: electricOptions } = useElectricSystems();

    // Watch form values to update pricing in real-time
    const {
        vehicleModel,
        motorization,
        electricalSystem,
        extraPacks,
        exteriorColor,
        furnitureColor,
        discount,
        reservationAmount,
        items
    } = useWatch({
        control: form.control,
    });

    const pricingDetails = useMemo(() => {
        const selectedModel = modelOptions?.find(opt => opt.name === vehicleModel);
        const selectedEngine = engineOptions?.find(opt => opt.name === motorization);
        const selectedElectric = electricOptions?.find(opt => opt.name === electricalSystem);
        const selectedPack = packOptions?.find(opt => opt.name === extraPacks);
        const selectedExterior = exteriorColorOptions?.find(opt => opt.name === exteriorColor);
        const selectedInterior = interiorColorOptions?.find(opt => opt.name === furnitureColor);

        const modelPrice = selectedModel?.price_modifier || 0;
        const motorPrice = selectedEngine?.price_modifier || 0;
        const electricalPrice = selectedElectric?.price || 0;
        const packPrice = selectedPack?.price || 0;
        const exteriorPrice = selectedExterior?.price_modifier || 0;
        const interiorPrice = selectedInterior?.price_modifier || 0;

        // Sumar items adicionales
        const itemsTotal = (items || []).reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        const { subtotal, total, discountAmount: discountValAmount } = calculateBudgetTotal({
            vehicleModel,
            motorization,
            electricalSystem,
            extraPacks,
            discount,
            items: items || [],
            prices: {
                model: selectedModel?.price_modifier,
                engine: selectedEngine?.price_modifier,
                electric: selectedElectric?.price,
                pack: selectedPack?.price,
                exterior: selectedExterior?.price_modifier,
                interior: selectedInterior?.price_modifier
            }
        });

        const reservation = Math.round((parseFloat(reservationAmount) || 0) * 100) / 100;
        const pending = Math.round((total - reservation) * 100) / 100;

        return {
            modelPrice,
            motorPrice,
            electricalPrice,
            packPrice,
            exteriorPrice,
            interiorPrice,
            itemsTotal,
            subtotal,
            total,
            reservation,
            pending,
            discountAmount: discountValAmount
        };
    }, [vehicleModel, motorization, electricalSystem, extraPacks, exteriorColor, furnitureColor, discount, reservationAmount, items, modelOptions, engineOptions, electricOptions, packOptions, exteriorColorOptions, interiorColorOptions]);

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-6">
                <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-primary" />
                        Configuración del Proyecto
                    </h3>
                    <ProjectInfoForm form={form} disabled={disabled} notesFieldName="budgetNotes" projectId={projectId} budgetId={budgetId} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-foreground font-bold flex items-center gap-2">
                                    <Percent className="w-4 h-4 text-primary" />
                                    Descuento Realizado (%)
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        className="rounded-xl border-border h-12 bg-background"
                                        disabled={disabled}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="reservationAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-foreground font-bold flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-primary" />
                                    Reserva de Abono (€)
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        className="rounded-xl border-border h-12 bg-background"
                                        disabled={disabled}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <div className="w-full lg:w-80">
                <Card className="border-none shadow-xl bg-primary/5 rounded-2xl overflow-hidden sticky top-6">
                    <CardHeader className="bg-primary text-primary-foreground p-6">
                        <CardTitle className="text-xl flex items-center gap-2">
                            Resumen de Presupuesto
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Modelo base:</span>
                                <span className="font-semibold">{pricingDetails.modelPrice.toLocaleString()}€</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Motorización:</span>
                                <span className="font-semibold">+{pricingDetails.motorPrice.toLocaleString()}€</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sist. Eléctrico:</span>
                                <span className="font-semibold">+{pricingDetails.electricalPrice.toLocaleString()}€</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Color Exterior:</span>
                                <span className="font-semibold">+{pricingDetails.exteriorPrice.toLocaleString()}€</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Color Mobiliario:</span>
                                <span className="font-semibold">+{pricingDetails.interiorPrice.toLocaleString()}€</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Paquete Extra:</span>
                                <span className="font-semibold">+{pricingDetails.packPrice.toLocaleString()}€</span>
                            </div>
                            {pricingDetails.itemsTotal > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Items Adicionales:</span>
                                    <span className="font-semibold">+{pricingDetails.itemsTotal.toLocaleString()}€</span>
                                </div>
                            )}
                        </div>

                        <Separator className="bg-border" />

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span className="font-semibold">{pricingDetails.subtotal.toLocaleString()}€</span>
                            </div>
                            {parseFloat(discount) > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <span>Descuento ({discount}%):</span>
                                    <span>-{(pricingDetails.subtotal * (parseFloat(discount) / 100)).toLocaleString()}€</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-primary pt-2">
                                <span>Total:</span>
                                <span>{pricingDetails.total.toLocaleString()}€</span>
                            </div>
                        </div>

                        <Separator className="bg-border" />

                        <div className="pt-2 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Reserva (Pagado):</span>
                                <span className="font-semibold text-primary">-{pricingDetails.reservation.toLocaleString()}€</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-primary/20">
                                <span className="text-sm font-bold text-muted-foreground">Pendiente:</span>
                                <span className="text-xl font-black text-primary">
                                    {pricingDetails.pending.toLocaleString()}€
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BudgetInfoTab;
